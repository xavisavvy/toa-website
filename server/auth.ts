import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from '../shared/schema';
import type { User, UserWithPassword, LoginCredentials } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { maskEmail, safeLog } from './log-sanitizer';
import { AuditService, AuditAction } from './audit';
import type { Request } from 'express';

// Security: Use strong work factor for bcrypt (10-12 recommended)
const SALT_ROUNDS = 12;

// Security: Rate limiting for auth attempts (implement in middleware)
export const AUTH_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
};

/**
 * Hash a password securely using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Stored password hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user (admin or customer)
 * Security: Never returns password hash
 * @param email User email
 * @param password Plain text password (will be hashed)
 * @param role User role (admin or customer)
 * @returns User object without password hash
 */
export async function createUser(
  email: string,
  password: string,
  role: 'admin' | 'customer' = 'customer'
): Promise<User> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  // Security: Validate email format
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email address');
  }

  // Security: Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Security: Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db.insert(users).values({
    email: email.toLowerCase().trim(), // Security: Normalize email
    passwordHash,
    role,
    isActive: 1,
  }).returning();

  if (!newUser) {
    throw new Error('Failed to create user');
  }

  // Security: Never return password hash
  return sanitizeUser(newUser);
}

/**
 * Authenticate user with email and password
 * Security: Returns null on failure (don't reveal if email exists)
 * @param credentials Login credentials
 * @param req Express request for audit logging
 * @returns User object if authenticated, null otherwise
 */
export async function authenticateUser(
  credentials: LoginCredentials, 
  req?: Request
): Promise<User | null> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Get user with password hash
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, credentials.email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      // Security: Don't reveal if email exists
      // Still run bcrypt to prevent timing attacks
      await bcrypt.compare(credentials.password, '$2a$12$invalidhashtopreventtimingattack');
      
      // Audit: Log failed login attempt
      if (req) {
        await AuditService.logAuth(
          AuditAction.LOGIN_FAILED,
          "failure",
          req,
          credentials.email,
          undefined,
          "Invalid credentials"
        );
      }
      
      return null;
    }

    // Security: Check if account is active
    if (user.isActive !== 1) {
      safeLog.warn(`Inactive account login attempt: ${maskEmail(user.email)}`);
      
      // Audit: Log inactive account attempt
      if (req) {
        await AuditService.logAuth(
          AuditAction.LOGIN_FAILED,
          "failure",
          req,
          user.email,
          user.id,
          "Account is inactive"
        );
      }
      
      return null;
    }

    // Verify password
    const isValid = await verifyPassword(credentials.password, user.passwordHash);
    if (!isValid) {
      safeLog.warn(`Failed login attempt for: ${maskEmail(user.email)}`);
      
      // Audit: Log failed password attempt
      if (req) {
        await AuditService.logAuth(
          AuditAction.LOGIN_FAILED,
          "failure",
          req,
          user.email,
          user.id,
          "Invalid password"
        );
      }
      
      return null;
    }

    // Update last login timestamp
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    safeLog.info(`Successful login: ${maskEmail(user.email)} (${user.role})`);

    // Audit: Log successful login
    if (req) {
      await AuditService.logAuth(
        AuditAction.LOGIN,
        "success",
        req,
        user.email,
        user.id
      );
    }

    // Security: Return user without password hash
    return sanitizeUser(user);
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Audit: Log system error
    if (req) {
      await AuditService.logAuth(
        AuditAction.LOGIN_FAILED,
        "failure",
        req,
        credentials.email,
        undefined,
        error instanceof Error ? error.message : "System error"
      );
    }
    
    return null;
  }
}

/**
 * Get user by email (without password hash)
 * @param email User email
 * @returns User object or null
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!db) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  return user ? sanitizeUser(user) : null;
}

/**
 * Get user by ID (without password hash)
 * @param id User ID
 * @returns User object or null
 */
export async function getUserById(id: string): Promise<User | null> {
  if (!db) {
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ? sanitizeUser(user) : null;
}

/**
 * Update user password
 * @param userId User ID
 * @param newPassword New plain text password
 */
export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ 
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.info(`Password updated for user: ${userId}`);
}

/**
 * Deactivate user account
 * Security: Don't delete users, deactivate them for audit trail
 * @param userId User ID
 */
export async function deactivateUser(userId: string): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db
    .update(users)
    .set({ 
      isActive: 0,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.warn(`User deactivated: ${userId}`);
}

/**
 * Reactivate user account
 * @param userId User ID
 */
export async function reactivateUser(userId: string): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db
    .update(users)
    .set({ 
      isActive: 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  console.info(`User reactivated: ${userId}`);
}

/**
 * Remove password hash from user object
 * Security: CRITICAL - Never expose password hashes
 * @param user User with password hash
 * @returns User without password hash
 */
function sanitizeUser(user: UserWithPassword): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Validate session user and check role
 * @param user Session user
 * @param requiredRole Required role (optional)
 * @returns True if valid
 */
export function isValidSessionUser(user: unknown, requiredRole?: 'admin' | 'customer'): user is User {
  if (!user || !user.id || !user.email || !user.role) {
    return false;
  }

  if (user.isActive !== 1) {
    return false;
  }

  if (requiredRole && user.role !== requiredRole) {
    return false;
  }

  return true;
}

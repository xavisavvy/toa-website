import type { Request, Response, NextFunction } from 'express';

import type { User } from '../shared/schema';

import { getUserById, isValidSessionUser } from './auth';
import { logSecurityEvent } from './security';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Require authenticated user
 * Security: Blocks access if not logged in
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource',
    });
    return;
  }

  // Validate session user
  if (!isValidSessionUser(req.session.user)) {
    logSecurityEvent('INVALID_SESSION', {
      ip: req.ip,
      sessionUser: req.session.user,
    });

    // Clear invalid session
    req.session.destroy(() => {});

    res.status(401).json({ 
      error: 'Invalid session',
      message: 'Please log in again',
    });
    return;
  }

  // Check if account is active
  if (req.session.user.isActive !== 1) {
    logSecurityEvent('DEACTIVATED_ACCOUNT_ACCESS', {
      ip: req.ip,
      userId: req.session.user.id,
      email: req.session.user.email,
    });

    req.session.destroy(() => {});

    res.status(403).json({ 
      error: 'Account deactivated',
      message: 'Your account has been deactivated. Please contact support.',
    });
    return;
  }

  // Attach user to request
  req.user = req.session.user;
  next();
}

/**
 * Require admin role
 * Security: Must be logged in AND have admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // First check if authenticated
  if (!req.session || !req.session.user) {
    logSecurityEvent('ADMIN_UNAUTHORIZED_ACCESS', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Admin access only',
    });
    return;
  }

  // Validate session user
  if (!isValidSessionUser(req.session.user, 'admin')) {
    const sessionUser = req.session.user as { id?: string; role?: string };
    logSecurityEvent('ADMIN_FORBIDDEN_ACCESS', {
      ip: req.ip,
      userId: sessionUser.id || 'unknown',
      role: sessionUser.role || 'unknown',
      path: req.path,
    });

    res.status(403).json({ 
      error: 'Forbidden',
      message: 'Admin privileges required',
    });
    return;
  }

  // The session holds a copy of the user taken at login, which can be up to
  // 7 days old. Re-read it so deactivating or demoting an admin takes effect
  // on their next request rather than when the cookie expires.
  const sessionUserId = req.session.user.id;
  getUserById(sessionUserId)
    .then((currentUser) => {
      if (!currentUser || currentUser.isActive !== 1 || currentUser.role !== 'admin') {
        logSecurityEvent('ADMIN_SESSION_REVOKED', {
          ip: req.ip,
          userId: sessionUserId,
          path: req.path,
          reason: currentUser ? 'inactive or no longer admin' : 'user not found',
        });
        req.session.destroy(() => {});
        res.status(401).json({
          error: 'Session invalid',
          message: 'Please sign in again',
        });
        return;
      }

      // Attach the fresh user record to the request
      req.user = currentUser;
      next();
    })
    .catch((error: unknown) => {
      console.error('Error re-validating admin session:', error);
      res.status(500).json({ error: 'Server error' });
    });
}

/**
 * Require customer role (for future customer-only features)
 * Security: Must be logged in AND have customer role
 */
export function requireCustomer(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.user) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please log in to access this resource',
    });
    return;
  }

  if (!isValidSessionUser(req.session.user, 'customer')) {
    res.status(403).json({ 
      error: 'Forbidden',
      message: 'Customer account required',
    });
    return;
  }

  req.user = req.session.user;
  next();
}

/**
 * Optional auth - attach user if logged in, but don't require it
 * Useful for routes that behave differently when authenticated
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.user && isValidSessionUser(req.session.user)) {
    req.user = req.session.user;
  }
  next();
}

/**
 * Security: Prevent authenticated users from accessing auth pages
 * (e.g., redirect from /login if already logged in)
 */
export function requireGuest(req: Request, res: Response, next: NextFunction): void {
  if (req.session && req.session.user && isValidSessionUser(req.session.user)) {
    // User is already logged in
    if (req.session.user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/');
    }
    return;
  }
  next();
}

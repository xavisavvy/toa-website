# Authentication & Security Implementation

## 🔒 Security Overview

This document describes the authentication and security implementation for Tales of Aneria admin dashboard.

**Security Philosophy:** Privacy and security first. All PII (Personally Identifiable Information) is protected.

---

## 🏗️ Architecture

### Authentication System
- **Password Hashing:** bcrypt with 12 rounds (strong work factor)
- **Session Management:** Express sessions with secure cookies
- **Role-Based Access Control (RBAC):** Admin and customer roles
- **Session Duration:** 7 days (configurable)

### Security Layers
1. **Password Security**
   - Minimum 8 characters required
   - bcrypt hashing with salt rounds = 12
   - Passwords never stored in plain text
   - Password hashes never exposed in API responses

2. **Session Security**
   - HTTP-only cookies (prevent XSS)
   - Secure flag in production (HTTPS only)
   - Session regeneration on login (prevent fixation)
   - Automatic session expiration
   - Session validation on every request

3. **Access Control**
   - Route-level protection via middleware
   - Role validation (admin, customer)
   - Active account checking
   - Audit logging for security events

4. **API Security**
   - Rate limiting on auth endpoints
   - Request validation with Zod schemas
   - No information leakage on failed logins
   - CSRF protection (TODO: implement)

---

## 🔐 Authentication Flow

### Login Process
```
1. User submits email + password
2. Server validates input format (Zod schema)
3. Server looks up user by email
4. Server compares password hash (bcrypt.compare)
5. If valid:
   - Create session
   - Regenerate session ID
   - Return user info (NO password hash)
6. If invalid:
   - Return generic error (don't reveal if email exists)
   - Log security event
```

### Session Validation
```
1. Client sends request with session cookie
2. Middleware checks session exists
3. Middleware validates user in session
4. Middleware checks account is active
5. Middleware checks required role (if applicable)
6. If valid: Attach user to req.user
7. If invalid: Return 401/403
```

---

## 🛡️ Security Best Practices Implemented

### Password Protection
✅ **Never store plain text passwords**
✅ **Use bcrypt with high work factor (12 rounds)**
✅ **Validate password strength**
✅ **Hash on server side only**

### Session Protection
✅ **HTTP-only cookies** (JavaScript cannot access)
✅ **Secure cookies in production** (HTTPS only)
✅ **Session regeneration** on login
✅ **Session destruction** on logout
✅ **Session expiration** after inactivity

### Data Protection
✅ **Never expose password hashes** in API
✅ **Sanitize user objects** before returning
✅ **PII logging prevention** (no passwords in logs)
✅ **Account deactivation** instead of deletion (audit trail)

### Attack Prevention
✅ **Timing attack prevention** (run bcrypt even if user not found)
✅ **Rate limiting** on auth endpoints
✅ **Account lockout** (via deactivation)
✅ **Security event logging**
✅ **No information leakage** on failed auth

---

## 📝 Database Schema

### Users Table
```typescript
{
  id: uuid (primary key),
  email: string (unique, indexed),
  passwordHash: string (never exposed),
  role: 'admin' | 'customer' (indexed),
  isActive: 0 | 1 (account status),
  lastLoginAt: timestamp,
  createdAt: timestamp (indexed),
  updatedAt: timestamp
}
```

**Security Notes:**
- Email is indexed for fast lookup
- Password hash is NEVER returned in queries
- isActive allows account suspension without deletion
- lastLoginAt for security auditing

---

## 🔑 API Endpoints

### POST `/api/auth/login`
**Purpose:** Authenticate user

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Authentication failed",
  "message": "Invalid email or password"
}
```

**Security:**
- ✅ Rate limited (5 attempts per 15 minutes)
- ✅ Generic error message (don't reveal if email exists)
- ✅ Password hash never returned
- ✅ Session regenerated on success
- ✅ Security events logged

---

### POST `/api/auth/logout`
**Purpose:** End user session

**Success Response (200):**
```json
{
  "success": true
}
```

**Security:**
- ✅ Session destroyed server-side
- ✅ Cookie cleared
- ✅ Logout event logged

---

### GET `/api/auth/me`
**Purpose:** Get current authenticated user

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Not authenticated",
  "user": null
}
```

**Security:**
- ✅ Refreshes user data from database
- ✅ Validates account is still active
- ✅ Destroys session if user no longer valid
- ✅ Password hash never returned

---

## 🚧 Middleware

### `requireAuth`
**Purpose:** Require any authenticated user

**Usage:**
```typescript
app.get('/api/protected', requireAuth, (req, res) => {
  // req.user is available
});
```

**Checks:**
- Session exists
- User in session is valid
- Account is active

---

### `requireAdmin`
**Purpose:** Require admin role

**Usage:**
```typescript
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  // req.user is guaranteed to be admin
});
```

**Checks:**
- Session exists
- User in session is valid
- Account is active
- Role is 'admin'

---

### `requireCustomer`
**Purpose:** Require customer role

**Usage:**
```typescript
app.get('/api/customer/orders', requireCustomer, (req, res) => {
  // req.user is guaranteed to be customer
});
```

**Checks:**
- Session exists
- User in session is valid
- Account is active
- Role is 'customer'

---

### `optionalAuth`
**Purpose:** Attach user if logged in, but don't require it

**Usage:**
```typescript
app.get('/api/content', optionalAuth, (req, res) => {
  // req.user may or may not exist
  if (req.user) {
    // Logged in
  } else {
    // Guest
  }
});
```

---

## 🔧 Admin User Management

### Creating Admin Users

**CLI Command:**
```bash
npm run create-admin
```

**Process:**
1. Prompts for email
2. Prompts for password (hidden input)
3. Confirms password
4. Validates input
5. Hashes password
6. Creates admin user in database
7. Displays success message

**Security:**
- ✅ Password never visible on screen
- ✅ Password validation enforced
- ✅ Confirmation required
- ✅ Duplicate email check
- ✅ Secure password hashing

---

## 📊 Security Event Logging

All security events are logged for auditing:

**Events Logged:**
- Failed login attempts
- Successful logins
- Unauthorized access attempts
- Admin privilege escalation attempts
- Account deactivation/reactivation
- Password changes
- Invalid session attempts

**Log Format:**
```javascript
logSecurityEvent('EVENT_TYPE', {
  ip: req.ip,
  userId: user.id,
  email: user.email,
  // ... relevant metadata
});
```

**Security:**
- ✅ No passwords logged
- ✅ No password hashes logged
- ✅ PII minimization
- ✅ Timestamped
- ✅ Actionable information only

---

## 🎯 Future Security Enhancements

### High Priority
- [ ] CSRF protection tokens
- [ ] Account lockout after N failed attempts
- [ ] Password reset flow (with email verification)
- [ ] Two-factor authentication (2FA)
- [ ] IP-based rate limiting per user

### Medium Priority
- [ ] Password complexity requirements (uppercase, numbers, special chars)
- [ ] Password history (prevent reuse)
- [ ] Session management UI (view/revoke active sessions)
- [ ] Security question recovery
- [ ] Email verification for new accounts

### Low Priority
- [ ] Biometric authentication
- [ ] Hardware key support (WebAuthn)
- [ ] OAuth2 integration (Google, GitHub)
- [ ] Audit log viewer for admins

---

## ⚠️ Security Checklist

### Development
- [x] Never commit passwords or secrets
- [x] Use environment variables for sensitive config
- [x] Test with dummy data only
- [x] Never log passwords or hashes
- [x] Sanitize all user data before returning

### Deployment
- [ ] Enable HTTPS (secure cookies)
- [ ] Set strong session secret
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Monitor auth logs
- [ ] Backup database regularly
- [ ] Test disaster recovery

### Maintenance
- [ ] Review access logs weekly
- [ ] Audit user accounts monthly
- [ ] Update dependencies regularly
- [ ] Review security events
- [ ] Deactivate unused accounts
- [ ] Rotate secrets periodically

---

## 📞 Security Incident Response

### If Breach Suspected:
1. **Isolate:** Disable affected accounts immediately
2. **Investigate:** Check security event logs
3. **Notify:** Alert administrators
4. **Remediate:** Fix vulnerability
5. **Document:** Record incident details
6. **Review:** Update security procedures

### Emergency Commands:
```bash
# Deactivate all users (emergency)
# UPDATE users SET is_active = 0;

# View recent logins
# SELECT email, last_login_at FROM users ORDER BY last_login_at DESC;

# View failed login attempts
# Check security event logs
```

---

**Last Updated:** 2026-01-04  
**Version:** 1.0  
**Maintained By:** Development Team

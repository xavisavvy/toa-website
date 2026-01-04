# Database Schema Deployment Notes

## 🔄 Local Development (Docker)

### Current Status: ⏳ PENDING
**Date:** 2026-01-04

### Steps to Complete:

1. **Start Docker Desktop**
   - Open Docker Desktop application
   - Wait for it to fully start (Docker icon in system tray)

2. **Start PostgreSQL Container**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d db
   ```

3. **Wait for Database to be Ready**
   ```bash
   # Check status
   docker-compose -f docker-compose.dev.yml ps
   
   # Should show "healthy" status after ~10 seconds
   ```

4. **Push Schema to Local Database**
   ```bash
   npm run db:push
   ```

5. **Create First Admin User**
   ```bash
   npm run create-admin
   ```
   - Enter your email
   - Enter password (min 8 chars)
   - Confirm password

6. **Test Authentication**
   - Start dev server: `npm run dev`
   - Test login endpoint: `POST http://localhost:5000/api/auth/login`

---

## 🚀 Production Deployment (Replit/Neon)

### Status: ⏳ TODO - REQUIRED BEFORE PRODUCTION

**Critical:** Must push schema to production database before deploying admin dashboard.

### Steps:

1. **Update DATABASE_URL in Replit Secrets**
   - Go to Replit project secrets
   - Verify DATABASE_URL points to production Neon database
   - Format: `postgresql://user:password@host/database?sslmode=require`

2. **Push Schema to Production**
   ```bash
   # In Replit shell
   npm run db:push
   ```

3. **Create Production Admin User**
   ```bash
   # In Replit shell
   npm run create-admin
   ```
   - Use production admin email
   - Use strong password (save in password manager)

4. **Verify Schema**
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Expected tables:
   -- - users
   -- - orders
   -- - order_items
   -- - order_events
   ```

5. **Security Checklist**
   - [ ] HTTPS enabled (for secure cookies)
   - [ ] SESSION_SECRET is strong random string
   - [ ] ADMIN_EMAIL configured in secrets
   - [ ] Database backups enabled
   - [ ] Rate limiting configured

---

## 📋 Schema Changes

### Tables Created:

#### Users Table (Authentication)
- `id` - UUID primary key
- `email` - Unique, indexed
- `passwordHash` - bcrypt hash (never exposed)
- `role` - admin | customer
- `isActive` - 1 | 0 (account status)
- `lastLoginAt` - timestamp
- `createdAt` - timestamp (indexed)
- `updatedAt` - timestamp

#### Orders Table (Already exists)
- Enhanced with proper indexes
- Customer email indexed for lookups

#### Order Items Table (Already exists)
- Line items for orders

#### Order Events Table (Already exists)
- Audit trail for orders

### Indexes Created:
- `users.email` - Fast login lookups
- `users.role` - Admin filtering
- `users.createdAt` - Audit queries
- (All order indexes from previous implementation)

---

## 🔧 Troubleshooting

### Docker Issues

**"Docker daemon is not running"**
- Start Docker Desktop
- Wait for it to fully initialize

**"Port 5432 already in use"**
```bash
# Find and stop conflicting process
netstat -ano | findstr :5432
taskkill /PID <process_id> /F
```

**"Container fails health check"**
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs db

# Restart container
docker-compose -f docker-compose.dev.yml restart db
```

### Schema Push Issues

**"Database not initialized"**
- Verify DATABASE_URL is set in .env
- Check database is running: `docker-compose -f docker-compose.dev.yml ps`

**"Permission denied"**
- Check PostgreSQL user has CREATE privileges
- Default user/pass: postgres/postgres

**"Schema conflicts"**
- If tables already exist, may need to drop them first (CAUTION: data loss)
- Better: Use migrations for incremental changes

---

## 📝 Migration History

### 2026-01-04 - Initial Auth Schema
**Changes:**
- Created `users` table with authentication fields
- Added indexes for email, role, createdAt
- Enhanced existing order tables with proper indexes

**Drizzle Migration:**
```bash
# Generated via: npm run db:push
# Applied to: Local PostgreSQL (Docker)
# Status: ✅ Complete (local) | ⏳ Pending (production)
```

---

## 🎯 Next Steps After Schema Push

1. **Test Authentication Locally**
   - Create admin user
   - Test login API
   - Verify session management

2. **Build Admin UI**
   - Login page
   - Dashboard
   - Orders management

3. **Deploy to Production**
   - Push schema to Replit/Neon
   - Create production admin user
   - Test end-to-end flow

4. **Security Hardening**
   - Enable HTTPS
   - Configure rate limiting
   - Set up monitoring
   - Regular backups

---

**Created:** 2026-01-04
**Last Updated:** 2026-01-04
**Status:** Local pending, Production TODO

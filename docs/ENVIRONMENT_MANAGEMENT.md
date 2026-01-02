# Environment Variable Management Best Practices

## Overview

This project uses a multi-layered approach to keep environment files synchronized and prevent configuration drift between local development, Docker, and production environments.

## Files

- **`.env.example`** - Template with all possible environment variables (committed to git)
- **`.env`** - Local development environment (NOT committed to git)
- **`.env.docker`** - Docker-specific overrides (NOT committed to git)

## Automated Synchronization

### NPM Scripts

```bash
# Check if .env and .env.docker are in sync with .env.example
npm run env:check

# Automatically add missing keys from .env.example to .env and .env.docker
npm run env:sync
```

### How It Works

1. **Template-First Approach**: `.env.example` is the source of truth
2. **Automatic Sync**: Running `npm run env:sync` adds missing keys to your env files
3. **Value Preservation**: Existing values in `.env` and `.env.docker` are never overwritten
4. **Git Hook Protection**: Pre-commit hook checks synchronization when `.env.example` is modified

### Pre-Commit Hook

When you modify `.env.example` and try to commit, the pre-commit hook will:
1. Detect the change
2. Run `npm run env:check` 
3. Block the commit if `.env` or `.env.docker` are out of sync
4. Prompt you to run `npm run env:sync`

This ensures you never forget to update your local env files when adding new variables.

## Workflow

### Adding a New Environment Variable

1. **Add to `.env.example`** with documentation:
   ```bash
   # ============================================
   # MY NEW FEATURE
   # ============================================
   # Description of what this variable does
   # Where to get it: https://...
   MY_NEW_VAR=example_value_here
   ```

2. **Run sync command**:
   ```bash
   npm run env:sync
   ```

3. **Fill in actual values** in `.env` and `.env.docker`:
   ```bash
   # .env
   MY_NEW_VAR=my_local_dev_value

   # .env.docker  
   MY_NEW_VAR=my_docker_value
   ```

4. **Update platform secrets**:
   - GitHub Actions: Settings → Secrets and variables → Actions
   - Replit: Tools → Secrets
   - Production (Vercel/Railway/etc): Project Settings → Environment Variables

5. **Commit changes**:
   ```bash
   git add .env.example
   git commit -m "feat: add MY_NEW_VAR configuration"
   ```

The pre-commit hook will verify that your `.env` and `.env.docker` files have the new key.

## Environment-Specific Configuration

### Local Development (`.env`)
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://localhost:5432/toa_local
ALLOWED_ORIGINS=http://localhost:5000,http://dev-local.talesofaneria.com:5000
```

### Docker Development (`.env.docker`)
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@db:5432/toa_website
ALLOWED_ORIGINS=http://localhost:5000,http://dev-local.talesofaneria.com:5000
```

### Production (Platform Secrets)
- Never store production secrets in files
- Use platform-specific secret management
- Rotate regularly

## Security Best Practices

1. **Never commit** `.env` or `.env.docker` (they're in `.gitignore`)
2. **Different secrets** for dev/staging/production
3. **Rotate secrets** every 90 days
4. **Use platform secrets** for production (GitHub Secrets, Vercel Environment Variables, etc.)
5. **Document everything** in `.env.example`

## Troubleshooting

### "Missing keys" error on commit
```bash
# Run sync to add missing keys
npm run env:sync

# Fill in the new values in .env and .env.docker

# Try commit again
git commit
```

### Keys out of sync between environments
```bash
# Check what's missing
npm run env:check

# Sync everything
npm run env:sync
```

### Docker not picking up new env vars
```bash
# Rebuild Docker containers with new env
docker compose down
docker compose up --build
```

## Multi-Environment Checklist

When adding a new environment variable, update ALL of these:

- [ ] `.env.example` (template + documentation)
- [ ] `.env` (local development)
- [ ] `.env.docker` (Docker development)
- [ ] GitHub Secrets (CI/CD)
- [ ] Replit Secrets (if using Replit)
- [ ] Production platform (Vercel/Railway/etc)

**Pro tip**: Use `npm run env:sync` to automatically sync the first 3 items!

## Advanced: Platform-Specific Overrides

Different environments may need different values:

```bash
# .env (local dev)
DATABASE_URL=postgresql://localhost:5432/toa_local
ALLOWED_ORIGINS=http://localhost:5000

# .env.docker (containerized)
DATABASE_URL=postgresql://postgres:postgres@db:5432/toa_website
ALLOWED_ORIGINS=http://localhost:5000,http://dev-local.talesofaneria.com:5000

# Production (Vercel)
DATABASE_URL=postgres://vercel-postgres-url
ALLOWED_ORIGINS=https://talesofaneria.com,https://www.talesofaneria.com
```

## Integration with CI/CD

The synchronization check runs as part of the CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Check environment sync
  run: npm run env:check
```

This prevents deploying code with missing environment variable definitions.

# Tales of Aneria - GitHub Copilot Instructions

## 🎯 Project Context
This is a TTRPG live play website showcasing enterprise-grade practices: comprehensive testing, security scanning, CI/CD automation, and WCAG 2.1 AA accessibility compliance.

## 📋 Quick Commands

```bash
# Development
npm run dev                    # Start dev server (port 5000)
npm run build                  # Build for production
npm run check                  # TypeScript type checking
npm run lint                   # ESLint (add --fix to auto-fix)

# Testing
npm run test                   # Unit tests (Vitest watch mode)
npm run test:coverage          # Unit tests with coverage report
npm run test:e2e               # E2E tests (Playwright)
npm run test:e2e:headed        # E2E tests with visible browser
npm run test:quick             # Fast unit tests without coverage
vitest run path/to/test.ts     # Run a single test file

# Database
npm run db:push                # Push schema changes (dev only)
npm run db:generate            # Generate migration files
npm run db:migrate             # Apply migrations (production)
npm run db:studio              # Visual database browser
npm run db:seed                # Seed database with test data

# Specialized Testing
npm run test:mutation          # Mutation testing (Stryker)
npm run test:contract          # Contract tests (Pact)
npm run test:security          # Security tests
npm run test:chaos             # Chaos/resilience tests

# Quality Checks
npm run check:markdown-secrets # Scan markdown for secrets
npm run check:mistakes         # Check common import errors
```

## ⚠️ CRITICAL: Cross-Platform Script Maintenance
**ALWAYS maintain parity between PowerShell (.ps1) and Shell (.sh) scripts:**
- When updating `.kubernetes/local/*.ps1` → Update corresponding `.sh` files
- When updating any `scripts/*.ps1` → Update corresponding `.sh` files
- Test both Windows and Unix paths/commands
- Maintain identical functionality across platforms
- This applies to ALL script changes in every session

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, wouter (routing)
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **Testing**: Vitest (unit), Playwright (E2E), Stryker (mutation), Axe (accessibility)
- **CI/CD**: GitHub Actions, Docker, automated versioning
- **Security**: Trivy, Snyk, GitLeaks, npm audit
- **Integrations**: YouTube Data API, Printful, Stripe, AWS SES

## 🚫 Common Mistakes to Avoid

### Wouter Navigation (CRITICAL)
**NEVER use `useNavigate` with wouter!**
- ❌ WRONG: `import { useNavigate } from 'wouter'` - THIS DOES NOT EXIST
- ✅ CORRECT: `import { useLocation } from 'wouter'` then `const [, setLocation] = useLocation()`
- Navigation: `setLocation('/path')` NOT `navigate('/path')`
- See `.github/copilot-knowledge.md` for full reference

### Script Parity (CRITICAL)
**ALWAYS maintain parity between `.ps1` and `.sh` scripts!**
- Any change to `.kubernetes/local/*.ps1` MUST be reflected in `.kubernetes/local/*.sh`
- Any change to `scripts/*.ps1` MUST be reflected in `scripts/*.sh`
- Both Windows (PowerShell) and Unix (Bash) users must have identical functionality

### API Routes Architecture
All backend routes are in **single file**: `server/routes.ts`. Every endpoint must have:
- Zod validation for all inputs
- Rate limiting (`apiLimiter` or `expensiveLimiter`)
- try/catch error handling
- Consistent return format: `{ success: boolean, data/error }`

### Database Workflow
1. Edit schema in `shared/schema.ts`
2. Run `npm run db:push` for dev (direct schema push)
3. Run `npm run db:generate` + `npm run db:migrate` for production (migration files)

## 📁 Architecture

### Directory Structure
```
client/src/
  ├── components/      # React components (PascalCase.tsx)
  │   ├── layout/      # Header, Footer, etc.
  │   └── ui/          # shadcn/ui components
  ├── pages/           # Page components
  ├── hooks/           # Custom React hooks
  ├── lib/             # Utilities and helpers
  └── data/            # Static JSON (cast.json, social-links.json)

server/
  ├── routes.ts        # ALL Express route handlers (single file)
  ├── auth.ts          # Authentication logic
  ├── security.ts      # Security utilities, validation, logging
  ├── db.ts            # Database connection (Drizzle)
  ├── stripe.ts        # Stripe integration
  ├── printful.ts      # Printful API integration
  ├── youtube.ts       # YouTube API integration
  ├── cache.ts         # Redis caching layer
  └── [other services] # Feature-specific modules

shared/
  ├── schema.ts        # Drizzle ORM schema + Zod validation
  └── types/           # Shared TypeScript types

test/                  # Unit & integration tests
e2e/                   # Playwright E2E tests
.ai/                   # AI context (architecture.md, prompts.md)
docs/                  # Comprehensive documentation
```

### Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`

### Naming Conventions
- **Components**: `PascalCase.tsx` (e.g., `HeroSection.tsx`)
- **Test files**: `kebab-case.test.tsx` (e.g., `hero-section.test.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Types**: `PascalCase` interfaces (e.g., `UserProfile`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)

## 🎯 Trigger Words & Standards

### ⚡ "enterprise test"
**Creates:** Comprehensive test suite with 80%+ coverage

```typescript
// Unit test (Vitest)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    // Test interactions
  });

  it('should handle edge cases and errors', () => {
    // Test error states
  });
});

// E2E test (Playwright)
import { test, expect } from '@playwright/test';

test('critical user flow', async ({ page }) => {
  await page.goto('/');
  // Test user journey
  await expect(page).toPassAxeCheck(); // Accessibility
});
```

### 🔒 "secure endpoint"
**Creates:** API endpoint with validation, rate limiting, error handling

```typescript
// All routes go in server/routes.ts

// 1. Define Zod validation schema
const requestSchema = z.object({
  field: z.string().min(1).max(100),
  email: z.string().email(),
});

// 2. Add route handler
app.post('/api/endpoint', apiLimiter, async (req, res) => {
  try {
    const validated = requestSchema.parse(req.body);
    
    // Business logic here
    const result = await doSomething(validated);
    
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    logSecurityEvent('API_ERROR', { endpoint: '/api/endpoint', error });
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// 3. Add tests in test/routes/ directory
```

**Rate Limiters:**
- `apiLimiter` - Standard API endpoints (100 req/15min)
- `expensiveLimiter` - Resource-intensive endpoints (10 req/15min)

### ♿ "accessible component"
**Creates:** WCAG 2.1 AA compliant React component

```typescript
import { Button } from '@/components/ui/button';

interface AccessibleComponentProps {
  title: string;
  description: string;
  onAction?: () => void;
}

/**
 * Accessible component following WCAG 2.1 AA standards
 */
export function AccessibleComponent({ 
  title, 
  description, 
  onAction 
}: AccessibleComponentProps) {
  return (
    <section 
      aria-labelledby="section-title"
      className="container mx-auto px-4 py-8"
    >
      <h2 
        id="section-title" 
        className="text-2xl md:text-3xl font-bold mb-4"
      >
        {title}
      </h2>
      
      <p className="text-base md:text-lg text-muted-foreground mb-6">
        {description}
      </p>
      
      {onAction && (
        <Button 
          onClick={onAction}
          aria-label={`Take action: ${title}`}
          className="focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Take Action
        </Button>
      )}
    </section>
  );
}

// Checklist:
// ✅ Semantic HTML (section, h2, p, button)
// ✅ ARIA labels (aria-labelledby, aria-label)
// ✅ Keyboard navigation (native button element)
// ✅ Focus indicators (focus-visible classes)
// ✅ Responsive design (text-base md:text-lg)
// ✅ Color contrast (using theme colors)
// ✅ Screen reader support (descriptive labels)
```

### 🗄️ "database migration"
**Creates:** Drizzle schema with Zod validation and TypeScript types

```typescript
// shared/schema.ts

import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// 1. Define table schema
export const tableName = pgTable('table_name', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Add indexes for frequently queried columns
  emailIdx: index('table_name_email_idx').on(table.email),
}));

// 2. Create Zod validation schemas
export const insertTableNameSchema = createInsertSchema(tableName, {
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
});

export const selectTableNameSchema = createSelectSchema(tableName);

// 3. Export TypeScript types
export type TableName = typeof tableName.$inferSelect;
export type NewTableName = typeof tableName.$inferInsert;

// 4. Apply schema changes
// Dev: npm run db:push
// Prod: npm run db:generate && npm run db:migrate
```

### 🚀 "ci pipeline"
**Creates:** GitHub Actions workflow with quality gates

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run check
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests with coverage
        run: npm run test:coverage
      
      - name: E2E tests
        run: npm run test:e2e
      
      - name: Security scan
        run: npm audit --production
```

### 🔄 "test on change"
**Automated:** Git hooks ensure quality before commit/push

**Already configured!** This project uses Husky to automatically:

#### Pre-commit Hook (`.husky/pre-commit`)
1. Run ESLint and fix issues (via lint-staged)
2. Run unit tests for related files (`vitest related --run`)
3. Only commit if all tests pass

#### Pre-push Hook (`.husky/pre-push`)  
1. Run **full unit test suite with coverage**
2. Verify coverage meets thresholds (40% global, 80% for critical files)
3. **Block push if tests fail or coverage drops**
4. Only push if all quality gates pass

**Coverage Thresholds:**
- Global: 40% (lines, functions, statements)
- Critical files: 80% (server/routes.ts, server/index.ts, etc.)

**Manual Commands:**
```bash
# Check coverage before push
npm run test:coverage

# Clear and check test cache
npm run clear-cache
npm run check-quota

# Run specific test suite
npm run test -- path/to/test.ts --run
```


**How it works:**
```json
// package.json - lint-staged configuration
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",           // Fix linting issues
      "vitest related --run"    // Run impacted tests
    ]
  }
}
```

**Manual testing:**
```bash
# Test only changed files
npm run test:changed

# Watch mode for development
npm run test:watch

# Quick test run (no coverage)
npm run test:quick
```

**Pre-commit behavior:**
- ✅ Automatically runs when you `git commit`
- ✅ Tests only files affected by your changes
- ✅ Fails commit if tests fail
- ✅ Fast - only runs impacted tests
- ⚠️ Can bypass with `git commit --no-verify` (NOT recommended)

## ✅ Code Quality Standards

### Testing Requirements
- **Coverage Threshold**: 40% global minimum (80% for critical files)
- **Critical File Thresholds**: 
  - `server/routes.ts`: 40% lines, 47% functions
  - `server/security.ts`: 60% lines, 50% functions
  - `server/env-validator.ts`: 77% lines, 80% functions
- **Mutation Score**: 80% minimum (run with `npm run test:mutation`)
- **E2E Coverage**: All critical user flows
- **Accessibility**: WCAG 2.1 AA compliance (`await expect(page).toPassAxeCheck()`)

### Security Requirements
- **Input Validation**: ALL user inputs validated with Zod
- **Rate Limiting**: ALL public API endpoints must have rate limiting
- **SQL Injection**: ONLY use Drizzle ORM prepared statements (no raw SQL)
- **Webhook Verification**: Stripe and Printful webhooks use HMAC signature verification
- **Session Security**: Regenerate session ID after login to prevent fixation attacks
- **Security Logging**: Log security events via `logSecurityEvent()` in `server/security.ts`
- **Secrets**: NEVER commit secrets; use environment variables
- **Pre-commit Hook**: Runs `npm run check:markdown-secrets` automatically

### TypeScript Standards
- **Strict Mode**: ALWAYS enabled
- **Explicit Types**: Define interfaces for all props and function parameters
- **Return Types**: Explicit return types for exported functions
- **Any Types**: FORBIDDEN (use `unknown` if truly needed)
- **Enums**: Use const objects or string literal unions instead

### React Component Standards
- **Functional Components**: ONLY use functional components with hooks
- **Props Interface**: ALWAYS define TypeScript interface for props
- **Named Exports**: Prefer named exports over default exports
- **Max Length**: Functions should be < 50 lines (extract smaller functions)
- **Single Responsibility**: One component = one purpose

### Code Style
```typescript
// ✅ Good
interface UserCardProps {
  name: string;
  email: string;
  onDelete?: () => void;
}

export function UserCard({ name, email, onDelete }: UserCardProps) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <p>{email}</p>
      {onDelete && <button onClick={onDelete}>Delete</button>}
    </div>
  );
}

// ❌ Bad
export default function({ name, email, onDelete }) {
  // No types, default export, unclear parameter types
}
```

## 🔄 Common Patterns

### API Route Pattern (server/routes.ts)
```typescript
// Define schema at top of file
const resourceSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

// Add route handler
app.post('/api/resource', apiLimiter, async (req, res) => {
  try {
    const data = resourceSchema.parse(req.body);
    
    // Business logic
    const result = await processResource(data);
    
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    logSecurityEvent('API_ERROR', { endpoint: '/api/resource', error });
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});
```

### Custom Hook Pattern
```typescript
import { useState, useEffect } from 'react';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useData<T>(url: string): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}
```

### Form with Validation Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof formSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## 🔐 Environment Variables

When adding new environment variables:

1. **Add to `.env.example` with documentation:**
```bash
# YouTube API Configuration
YOUTUBE_API_KEY=your_api_key_here        # Server-side YouTube Data API v3 key
VITE_YOUTUBE_PLAYLIST_ID=your_id         # Public playlist ID (client-side)
```

2. **Add validation in `server/env-validator.ts`:**
```typescript
const envSchema = z.object({
  YOUTUBE_API_KEY: z.string().min(1),
  // ... other variables
});
```

3. **Document in README.md** if user-facing

**Key Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `YOUTUBE_API_KEY` - Server-side YouTube API key
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` - Stripe keys
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification
- `PRINTFUL_API_KEY` - Printful integration
- `SESSION_SECRET` - Session encryption (generate with `openssl rand -base64 32`)
- `SENTRY_DSN` - (Optional) Sentry APM integration

## 📝 Documentation Requirements

When adding new features:
- [ ] Add JSDoc comments for exported functions
- [ ] Update README.md if user-facing feature
- [ ] Add examples in `docs/` for complex features
- [ ] Update `.env.example` with new variables
- [ ] Add migration guide if breaking change

```typescript
/**
 * Fetches user data from the API
 * @param userId - The unique identifier of the user
 * @returns User profile data or null if not found
 * @throws {Error} If the API request fails
 * 
 * @example
 * ```typescript
 * const user = await fetchUser('123');
 * console.log(user.name);
 * ```
 */
export async function fetchUser(userId: string): Promise<User | null> {
  // Implementation
}
```

## 🎨 UI/UX Standards

### Responsive Design
Always include responsive classes:
```tsx
<div className="text-sm md:text-base lg:text-lg">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
```

### Theme Colors
Use Tailwind theme colors (defined in `tailwind.config.ts`):
- `bg-background` / `text-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-muted` / `text-muted-foreground`
- `border` for borders

### Spacing
Use consistent spacing scale:
- `gap-4`, `gap-6`, `gap-8` for component spacing
- `px-4 py-8` for section padding
- `container mx-auto` for centering

## 🚨 Git Commit Standards

Use Conventional Commits format:

```bash
feat: add user authentication system
fix: resolve mobile navigation menu bug
docs: update API documentation
test: add E2E tests for checkout flow
refactor: optimize database query performance
perf: improve image loading with lazy loading
style: format code with prettier
chore: update dependencies
```

Breaking changes:
```bash
feat!: redesign navigation component API

BREAKING CHANGE: Navigation props have changed
```

This automatically:
- Bumps version numbers
- Generates changelog
- Creates git tags

## ✨ Performance Standards

- **Lighthouse Score**: 90+ across all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

### Optimization Techniques
- Use WebP images with fallbacks
- Implement lazy loading for images
- Code split with dynamic imports
- Minimize bundle size (check with `npm run build`)
- Use React.memo() for expensive components

## 🧪 Testing Patterns

### Unit Test Structure (Vitest)
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('FeatureName', () => {
  describe('FunctionName', () => {
    it('should handle the happy path', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(() => functionName('')).toThrow();
    });
  });
});

// Component test
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});
```

### E2E Test Structure (Playwright)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature');
  });

  test('should complete user flow', async ({ page }) => {
    // Arrange
    await page.fill('[data-testid="input"]', 'value');
    
    // Act
    await page.click('[data-testid="submit"]');
    
    // Assert
    await expect(page.locator('[data-testid="result"]'))
      .toHaveText('Expected');
    
    // Accessibility check (REQUIRED for all E2E tests)
    await expect(page).toPassAxeCheck();
  });
});
```

### Run Specific Tests
```bash
# Single file
vitest run test/specific.test.ts

# Pattern matching
vitest run --testNamePattern="should handle errors"

# Watch mode for TDD
npm run test:watch
```

## 📊 Quality Gates (CI Must Pass)

All pull requests must pass:
- ✅ TypeScript type checking (`npm run check`)
- ✅ ESLint with no warnings (`npm run lint`)
- ✅ Unit tests with 40%+ coverage (`npm run test:coverage`)
- ✅ E2E tests for critical paths (`npm run test:e2e`)
- ✅ Security scans - no high/critical issues (`npm audit`)
- ✅ Mutation tests with 80%+ score (`npm run test:mutation`)
- ✅ Accessibility tests - WCAG 2.1 AA (E2E tests include axe checks)
- ✅ Pre-commit hooks (ESLint + related tests)
- ✅ Pre-push hooks (full test suite with coverage)

## 🔍 Code Review Checklist

Before submitting PR:
- [ ] Tests written and passing
- [ ] Pre-commit hooks passed (automatic)
- [ ] Pre-push hooks passed (automatic)
- [ ] TypeScript types defined
- [ ] No `any` types used
- [ ] Accessibility attributes added (aria-labels, semantic HTML)
- [ ] Responsive design implemented (mobile, tablet, desktop)
- [ ] Error handling included
- [ ] Security logging for sensitive operations
- [ ] Documentation updated
- [ ] Environment variables documented in `.env.example`
- [ ] Conventional commit messages used
- [ ] Cross-platform script parity maintained (if applicable)

## 📚 Documentation

- **Main Documentation**: [`docs/README.md`](../docs/README.md) - Documentation index
- **Architecture**: [`.ai/architecture.md`](../.ai/architecture.md) - System design overview
- **CI/CD**: [`docs/ci-cd/`](../docs/ci-cd/) - GitHub Actions, workflows
- **Testing**: [`docs/testing/`](../docs/testing/) - Testing strategies
- **Security**: [`docs/security/`](../docs/security/) - Security practices
- **Deployment**: [`docs/deployment/`](../docs/deployment/) - Docker, Kubernetes, deployment guides
- **Features**: [`docs/features/`](../docs/features/) - Feature implementation guides
- **Guides**: [`docs/guides/`](../docs/guides/) - Phase documentation and summaries

## 🚨 Important Files to Review

### When Working on Authentication
- `server/auth.ts` - Authentication logic
- `server/auth-middleware.ts` - Auth middleware (requireAdmin, optionalAuth)
- `shared/schema.ts` - User schema and validation

### When Working on API Routes
- `server/routes.ts` - **ALL routes are in this single file**
- `server/security.ts` - Security utilities (validation, logging)
- `server/rate-limiter.ts` - Rate limiting configuration

### When Working on Database
- `shared/schema.ts` - Database schema (Drizzle ORM)
- `server/db.ts` - Database connection
- `drizzle.config.ts` - Drizzle configuration

### When Working on Frontend
- `client/src/App.tsx` - Main app component with routing
- `client/src/components/` - React components
- `client/src/data/` - Static JSON data (cast.json, social-links.json)
- `.github/copilot-knowledge.md` - Wouter navigation reference

---

**Remember**: Quality over speed. Follow these standards to maintain enterprise-grade code.

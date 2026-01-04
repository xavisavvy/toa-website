# Tales of Aneria - GitHub Copilot Instructions

## 🎯 Project Context
This is a TTRPG live play website showcasing enterprise-grade practices: comprehensive testing, security scanning, CI/CD automation, and WCAG 2.1 AA accessibility compliance.

## ⚠️ CRITICAL: Cross-Platform Script Maintenance
**ALWAYS maintain parity between PowerShell (.ps1) and Shell (.sh) scripts:**
- When updating `.kubernetes/local/*.ps1` → Update corresponding `.sh` files
- When updating any `scripts/*.ps1` → Update corresponding `.sh` files
- Test both Windows and Unix paths/commands
- Maintain identical functionality across platforms
- This applies to ALL script changes in every session

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL, Drizzle ORM
- **Testing**: Vitest (unit), Playwright (E2E), Stryker (mutation), Axe (accessibility)
- **CI/CD**: GitHub Actions, Docker, automated versioning
- **Security**: Trivy, Snyk, GitLeaks, npm audit

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

## 📁 Architecture

### Directory Structure
```
client/src/
  ├── components/      # React components (PascalCase)
  │   ├── layout/      # Layout components (Header, Footer, etc.)
  │   └── ui/          # shadcn/ui components
  ├── pages/           # Page components
  ├── hooks/           # Custom React hooks
  ├── lib/             # Utilities and helpers
  └── data/            # Static JSON data

server/
  ├── routes/          # Express route handlers
  ├── db/              # Drizzle ORM schema
  ├── middleware/      # Express middleware
  └── utils/           # Server utilities

shared/
  └── types/           # Shared TypeScript types

test/                  # Unit & integration tests
e2e/                   # Playwright E2E tests
scripts/               # Build & deployment scripts
docs/                  # Comprehensive documentation
```

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
**Creates:** API endpoint with validation, rate limiting, error handling, tests

```typescript
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

// Zod validation schema
const requestSchema = z.object({
  field: z.string().min(1).max(100),
  email: z.string().email(),
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

// Route handler
router.post('/api/endpoint', limiter, async (req, res) => {
  try {
    const validated = requestSchema.parse(req.body);
    
    // Business logic here
    
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;

// Required: Add unit tests for validation and error cases
```

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
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Database schema
export const tableName = pgTable('table_name', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod validation schemas
export const insertTableNameSchema = createInsertSchema(tableName, {
  email: z.string().email(),
  age: z.number().min(0).max(150).optional(),
});

export const selectTableNameSchema = createSelectSchema(tableName);

// TypeScript types
export type TableName = typeof tableName.$inferSelect;
export type NewTableName = typeof tableName.$inferInsert;

// After creating schema, run:
// npm run db:push
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
- **Coverage Threshold**: 80% minimum (lines, functions, branches, statements)
- **Mutation Score**: 80% minimum
- **E2E Coverage**: All critical user flows
- **Accessibility**: WCAG 2.1 AA compliance (run `await expect(page).toPassAxeCheck()`)

### Security Requirements
- **Input Validation**: ALL user inputs validated with Zod
- **Rate Limiting**: ALL public API endpoints must have rate limiting
- **SQL Injection**: ONLY use Drizzle ORM prepared statements
- **XSS Prevention**: Sanitize outputs (React handles this automatically)
- **Secrets**: NEVER commit secrets; use environment variables
- **Dependencies**: Run `npm audit` regularly

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

### API Route Pattern
```typescript
import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

const schema = z.object({
  // Define schema
});

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

router.post('/api/resource', limiter, async (req, res) => {
  try {
    const data = schema.parse(req.body);
    // Handle request
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

export default router;
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

1. Add to `.env.example` with documentation:
```bash
# YouTube API Configuration
YOUTUBE_API_KEY=your_api_key_here        # YouTube Data API v3 key
VITE_YOUTUBE_PLAYLIST_ID=your_id         # Public playlist ID
```

2. Update validation in `server/index.ts`:
```typescript
const envSchema = z.object({
  YOUTUBE_API_KEY: z.string().min(1),
  // ... other variables
});
```

3. Document in README.md if user-facing

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

### Unit Test Structure
```typescript
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
```

### E2E Test Structure
```typescript
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
    
    // Accessibility
    await expect(page).toPassAxeCheck();
  });
});
```

## 📊 Quality Gates (CI Must Pass)

All pull requests must pass:
- ✅ TypeScript type checking (`npm run check`)
- ✅ ESLint with no warnings (`npm run lint`)
- ✅ Unit tests with 80%+ coverage (`npm run test:coverage`)
- ✅ E2E tests for critical paths (`npm run test:e2e`)
- ✅ Security scans - no high/critical issues (`npm audit`)
- ✅ Mutation tests with 80%+ score (`npm run test:mutation`)
- ✅ Accessibility tests - WCAG 2.1 AA (`npm run test:e2e`)

## 🔍 Code Review Checklist

Before submitting PR:
- [ ] Tests written and passing
- [ ] Pre-commit hooks passed (tests run automatically)
- [ ] TypeScript types defined
- [ ] No `any` types used
- [ ] Accessibility attributes added
- [ ] Responsive design implemented

## 📤 Git Push Status Reporting

**IMPORTANT**: At the end of every summary or response involving code changes:
- ✅ **Always indicate whether changes have been pushed to remote**
- Format: `🔄 Status: Pushed to remote` or `⚠️ Status: Not yet pushed to remote`
- This helps maintain clarity on deployment state
- [ ] Error handling included
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] Conventional commit messages used

## 🎯 Automated Testing on File Changes

### Pre-commit Hook (Already Configured!)
When you commit files, the following automatically runs:

1. **ESLint** - Fixes formatting and catches issues
2. **Vitest Related** - Runs tests for changed files and their dependencies
3. **Blocks Commit** - If tests fail, commit is prevented

### Testing Strategies by Scenario

**Development (making changes):**
```bash
npm run test:watch          # Watch mode - tests rerun on save
```

**Pre-commit (automatic):**
```bash
git add .
git commit -m "feat: add feature"
# ✅ Automatically runs: eslint --fix, vitest related --run
```

**Before push:**
```bash
npm run test:changed        # Test only files changed from HEAD~1
npm run test:all            # Full test suite (coverage + E2E)
```

**Quick validation:**
```bash
npm run test:quick          # Fast run, no coverage report
```

### How Vitest Detects Related Tests

Vitest `--related` flag intelligently finds affected tests:
- Tests that import the changed file
- Tests in the same directory
- Tests that share dependencies
- Integration tests using the changed code

**Example:**
```bash
# You change: server/routes/users.ts
# Vitest runs:
# - test/routes/users.test.ts (direct test)
# - test/integration/api.test.ts (imports users route)
# - e2e/user-flow.spec.ts (tests user features)
```

### Customizing Pre-commit Hooks

To modify what runs on commit, edit `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run",
      // Add more commands here
    ]
  }
}
```

### Bypassing Hooks (Emergency Only)
```bash
# NOT RECOMMENDED - only for emergencies
git commit --no-verify -m "hotfix: critical bug"
```

## 📚 Reference Documentation

- [Documentation Index](../docs/README.md)
- [Enterprise CI/CD Guide](../docs/ci-cd/ENTERPRISE_CICD_GUIDE.md)
- [Testing Guide](../docs/testing/TESTING.md)
- [Security Guide](../docs/security/SECURITY.md)
- [Deployment Guide](../docs/deployment/DEPLOYMENT.md)

---

**Remember**: Quality over speed. Follow these standards to maintain enterprise-grade code.

---

## 📤 Summary & Git Status Guidelines

At the end of every task summary, **ALWAYS** include a clear Git status section:

### Format:
```
## 📤 Git Status

**Status:** [PUSHED | NOT PUSHED | PARTIALLY PUSHED]

**Details:**
- Commit Hash: abc1234 (if committed)
- Branch: main
- Remote: origin/main
- Pushed to GitHub: [YES | NO]

**Action Required:**
[If NOT PUSHED: "Run `git push` to deploy changes to remote"]
[If PUSHED: "All changes are live on GitHub"]
```

### Examples:

**✅ PUSHED:**
```
## 📤 Git Status
**Status:** PUSHED ✅
- Commit: fcae57b
- All changes deployed to GitHub
- No action required
```

**❌ NOT PUSHED:**
```
## 📤 Git Status
**Status:** NOT PUSHED ⚠️
- Changes committed locally only
- **Action Required:** Run `git push` to deploy to GitHub
```

**⚠️ PARTIALLY PUSHED:**
```
## 📤 Git Status
**Status:** PARTIALLY PUSHED ⚠️
- Previous commits pushed (abc1234, def5678)
- Latest commit (ghi9012) NOT PUSHED
- **Action Required:** Run `git push` to sync all changes
```

This ensures clear communication about deployment status at all times.

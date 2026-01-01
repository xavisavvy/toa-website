# GitHub Copilot Custom Instructions & Standards

This guide explains how to create persistent instructions and trigger words that GitHub Copilot will follow every time it works in your project.

## 🎯 Methods to Configure Copilot Behavior

### Method 1: `.github/copilot-instructions.md` (Recommended)

**Best for:** Project-specific standards, coding conventions, architecture patterns

Create a file at `.github/copilot-instructions.md` in your repository root:

```markdown
# Project Copilot Instructions

## Architecture Standards
- Use TypeScript strict mode for all new code
- Follow the repository monorepo structure: client/, server/, shared/
- All API routes must use Zod for validation
- Use Drizzle ORM for all database queries

## Testing Requirements
- Every new feature must include unit tests (Vitest)
- Maintain 80%+ code coverage
- Write E2E tests for user-facing features (Playwright)
- Use data-testid attributes for test selectors

## Security Standards
- Never commit secrets or API keys
- All user inputs must be validated with Zod
- Use prepared statements for database queries
- Apply rate limiting to all public endpoints

## Code Style
- Use functional components with hooks (no class components)
- Prefer named exports over default exports
- Use async/await over .then() chains
- Maximum function length: 50 lines

## Trigger Words
When I say "enterprise test", create:
- Unit tests with Vitest
- Integration tests with supertest
- E2E tests with Playwright
- Accessibility tests with axe

When I say "secure endpoint", create:
- Zod validation schema
- Rate limiting
- Input sanitization
- Error handling with proper status codes
- Unit tests for validation and error cases

When I say "react component", create:
- Functional component with TypeScript
- Props interface
- Unit tests with Testing Library
- Accessibility attributes (ARIA)
- Responsive design with Tailwind

## File Organization
- Components: `client/src/components/[Feature]/ComponentName.tsx`
- Tests: `test/[feature]/component-name.test.tsx`
- API Routes: `server/routes/[feature].ts`
- Types: `shared/types/[feature].ts`

## Documentation
- Add JSDoc comments for all exported functions
- Update README.md when adding new features
- Document environment variables in .env.example
- Add examples to docs/ folder for complex features
```

### Method 2: `CONTRIBUTING.md`

**Best for:** Contribution guidelines, code review standards

```markdown
# Contributing Guidelines

## Before You Start
GitHub Copilot users: This project follows strict standards.

## Coding Standards
1. **TypeScript**: All code must be TypeScript with strict mode
2. **Testing**: 80%+ coverage required, run `npm test` before committing
3. **Linting**: Run `npm run lint:fix` before committing
4. **Commits**: Use Conventional Commits (feat:, fix:, docs:, etc.)

## Copilot Trigger Phrases
- "Add enterprise test coverage" → Full test suite (unit + E2E + accessibility)
- "Create secure API endpoint" → Zod validation + rate limiting + tests
- "Build accessible component" → WCAG 2.1 AA compliant React component
```

### Method 3: Code Comments with Trigger Words

**Best for:** In-file standards, specific patterns

Add special comments at the top of key files:

```typescript
/**
 * COPILOT INSTRUCTIONS:
 * - This file contains database schema definitions
 * - Use Drizzle ORM syntax
 * - All tables must have: id, createdAt, updatedAt
 * - Use snake_case for column names, camelCase for TypeScript
 * - Add Zod schema validation for all tables
 * 
 * TRIGGER: "add table" → Create full table with indexes and relations
 */

import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
```

### Method 4: Custom `README.md` Section

**Best for:** Project-wide conventions, quick reference

Add a section in your README:

```markdown
## 🤖 GitHub Copilot Standards

### Trigger Words for This Project

| Trigger | Action |
|---------|--------|
| `enterprise test` | Create comprehensive test suite (unit, E2E, accessibility) |
| `secure endpoint` | API with validation, rate limiting, error handling |
| `accessible component` | WCAG 2.1 AA compliant React component |
| `database migration` | Drizzle schema + migration + types |
| `ci pipeline` | GitHub Actions workflow with tests & security scans |

### Default Standards
- **Language**: TypeScript strict mode
- **Testing**: Vitest (unit), Playwright (E2E), 80%+ coverage
- **Security**: Zod validation, rate limiting, Helmet.js
- **Style**: Functional components, Tailwind CSS, shadcn/ui
- **Commits**: Conventional Commits format
```

### Method 5: Project Configuration Files

**Best for:** Tool-specific settings

Create configuration that Copilot can read:

```json
// .vscode/settings.json
{
  "github.copilot.advanced": {
    "customInstructions": "Follow TypeScript strict mode. Use Vitest for testing. Maintain 80%+ coverage. Apply Zod validation to all inputs."
  }
}
```

```yaml
# .copilot-rules.yml
project:
  language: TypeScript
  framework: React 18
  testing: Vitest + Playwright
  styling: Tailwind CSS
  validation: Zod
  orm: Drizzle

standards:
  coverage_threshold: 80
  max_function_length: 50
  prefer_functional_components: true
  require_prop_types: true

triggers:
  enterprise_test:
    - unit tests with Vitest
    - E2E tests with Playwright
    - accessibility tests with axe
    - 80%+ coverage
  
  secure_endpoint:
    - Zod validation schema
    - rate limiting
    - error handling
    - unit tests
```

## 📋 Complete Example: Project Setup

Here's a complete setup for this project:

### File: `.github/copilot-instructions.md`

```markdown
# Tales of Aneria - Copilot Instructions

## Project Context
This is a TTRPG live play website built with React, TypeScript, and Express.
We follow enterprise-grade practices with comprehensive testing and security.

## Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Testing**: Vitest (unit), Playwright (E2E), Stryker (mutation)
- **CI/CD**: GitHub Actions with automated versioning

## Architecture Rules

### File Structure
```
client/src/
  ├── components/      # React components
  ├── pages/          # Page components
  ├── hooks/          # Custom hooks
  ├── lib/            # Utilities
  └── data/           # Static data (JSON)

server/
  ├── routes/         # API routes
  ├── db/             # Database schema
  ├── middleware/     # Express middleware
  └── utils/          # Server utilities

test/               # Unit & integration tests
e2e/                # End-to-end tests
shared/             # Shared types & utilities
```

### Naming Conventions
- **Components**: PascalCase (e.g., `HeroSection.tsx`)
- **Files**: kebab-case (e.g., `hero-section.test.tsx`)
- **Variables**: camelCase (e.g., `userName`)
- **Types**: PascalCase with descriptive names (e.g., `UserProfile`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRIES`)

## Trigger Words & Standards

### "enterprise test"
Create comprehensive test coverage:
```typescript
// Unit test with Vitest
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange, Act, Assert
  });
  
  it('should handle edge cases', () => {
    // Test error states
  });
});

// E2E test with Playwright
test('user flow name', async ({ page }) => {
  // Test critical user paths
  // Include accessibility checks
});

// Accessibility test
test('accessibility', async ({ page }) => {
  await expect(page).toPassAxeCheck();
});
```

### "secure endpoint"
Create a secure API endpoint:
```typescript
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

// Validation schema
const schema = z.object({
  field: z.string().min(1).max(100),
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Route
router.post('/endpoint', limiter, async (req, res) => {
  try {
    const validated = schema.parse(req.body);
    // Handle request
  } catch (error) {
    // Error handling
  }
});

// Tests required
```

### "accessible component"
Create WCAG 2.1 AA compliant component:
```typescript
interface Props {
  title: string;
  description: string;
}

export function ComponentName({ title, description }: Props) {
  return (
    <section 
      aria-labelledby="section-title"
      className="responsive-classes"
    >
      <h2 id="section-title" className="sr-only-if-needed">
        {title}
      </h2>
      <p className="text-base md:text-lg">
        {description}
      </p>
    </section>
  );
}

// Include:
// - Semantic HTML
// - ARIA labels
// - Keyboard navigation
// - Screen reader support
// - Responsive design
// - Unit tests
// - Accessibility tests
```

### "database migration"
Create database schema with Drizzle:
```typescript
// Schema
export const tableName = pgTable('table_name', {
  id: serial('id').primaryKey(),
  field: text('field').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Zod validation
export const insertSchema = createInsertSchema(tableName);
export const selectSchema = createSelectSchema(tableName);

// Types
export type TableName = typeof tableName.$inferSelect;
export type NewTableName = typeof tableName.$inferInsert;
```

## Code Quality Standards

### Testing Requirements
- **Coverage**: Minimum 80% (lines, functions, branches)
- **Mutation Score**: Minimum 80%
- **E2E Tests**: All critical user flows
- **Accessibility**: WCAG 2.1 AA compliance

### Security Requirements
- **Input Validation**: All inputs validated with Zod
- **Rate Limiting**: All public endpoints
- **SQL Injection**: Use prepared statements (Drizzle ORM)
- **XSS Prevention**: Sanitize all user inputs
- **Secrets**: Never commit secrets, use environment variables

### Code Style
- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Exports**: Named exports preferred
- **Functions**: Max 50 lines, single responsibility
- **Error Handling**: Always handle errors explicitly
- **Comments**: JSDoc for exported functions only

### Git Commit Standards
Use Conventional Commits:
```
feat: add user authentication
fix: resolve mobile navigation bug
docs: update API documentation
test: add E2E tests for checkout flow
refactor: optimize database queries
perf: improve image loading performance
```

## Environment Variables
Always update `.env.example` when adding new variables:
```bash
# New feature
FEATURE_API_KEY=your_api_key_here  # Description of what this is for
```

## Documentation Requirements
When adding features:
1. Update README.md if user-facing
2. Add JSDoc comments for exported functions
3. Create/update docs in `docs/` for complex features
4. Update `.env.example` with new variables
5. Add examples in code comments

## Common Patterns

### API Route Pattern
```typescript
import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const schema = z.object({ /* ... */ });

router.post('/endpoint', async (req, res) => {
  try {
    const data = schema.parse(req.body);
    // Logic here
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
```

### React Component Pattern
```typescript
import { useState } from 'react';

interface Props {
  initialValue?: string;
}

export function ComponentName({ initialValue = '' }: Props) {
  const [state, setState] = useState(initialValue);

  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

### Custom Hook Pattern
```typescript
import { useState, useEffect } from 'react';

export function useCustomHook(param: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Logic
  }, [param]);

  return { data, loading, error };
}
```

## Performance Standards
- **Lighthouse Score**: 90+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Image Optimization**: Use WebP, lazy loading
- **Code Splitting**: Dynamic imports for routes

## Accessibility Checklist
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus indicators visible
- [ ] Color contrast ratio 4.5:1+
- [ ] Screen reader tested
- [ ] No keyboard traps
- [ ] Form labels and errors

## CI/CD Expectations
All PRs must pass:
- ✅ TypeScript type checking
- ✅ ESLint (no warnings)
- ✅ Unit tests (80%+ coverage)
- ✅ E2E tests (all critical paths)
- ✅ Security scans (no high/critical)
- ✅ Mutation tests (80%+ score)
- ✅ Accessibility tests (WCAG 2.1 AA)

## Questions?
Refer to:
- [Documentation Index](../docs/README.md)
- [Testing Guide](../docs/testing/TESTING.md)
- [Security Guide](../docs/security/SECURITY.md)
- [CI/CD Guide](../docs/ci-cd/ENTERPRISE_CICD_GUIDE.md)
```

## 🚀 How to Implement

### Step 1: Create the Instructions File
```bash
mkdir -p .github
touch .github/copilot-instructions.md
# Add your instructions (see example above)
```

### Step 2: Commit to Repository
```bash
git add .github/copilot-instructions.md
git commit -m "docs: add GitHub Copilot instructions and standards"
git push
```

### Step 3: Test It Out
Open GitHub Copilot and try your trigger words:
- Type: "Create an enterprise test for the login component"
- Copilot should follow your defined patterns

### Step 4: Iterate and Improve
- Add more trigger words based on common tasks
- Refine standards as your project evolves
- Share updates with your team

## 💡 Best Practices

### 1. Be Specific
❌ Bad: "Write clean code"
✅ Good: "Use TypeScript strict mode with explicit return types"

### 2. Include Examples
```markdown
### "create api endpoint"
Example:
\`\`\`typescript
// Full working example here
\`\`\`
```

### 3. Define Clear Triggers
Make triggers memorable and project-specific:
- `enterprise test` (comprehensive test suite)
- `secure endpoint` (validated, rate-limited API)
- `accessible component` (WCAG compliant UI)

### 4. Keep It Updated
Review and update quarterly or when:
- New patterns emerge
- Technologies change
- Standards evolve

### 5. Share with Team
Ensure all team members know about:
- The `.github/copilot-instructions.md` file
- Available trigger words
- Expected standards

## 📊 Measuring Effectiveness

Track whether Copilot follows your standards:
- Code review feedback decreases
- Test coverage stays above threshold
- Fewer security issues in PRs
- Consistent code style across team

## 🎯 Quick Reference Template

```markdown
# [Your Project] - Copilot Instructions

## Stack
- Language: [TypeScript/JavaScript/etc]
- Framework: [React/Vue/etc]
- Testing: [Vitest/Jest/etc]

## Triggers
| Command | Output |
|---------|--------|
| `trigger word` | What it creates |

## Standards
- Coverage: [80%+]
- Max function length: [50 lines]
- Naming: [camelCase/PascalCase/etc]

## Required Patterns
```[language]
// Example code
```

## Checklist
- [ ] Tests included
- [ ] Types defined
- [ ] Docs updated
```

---

**Pro Tip**: The `.github/copilot-instructions.md` file is the most reliable method because GitHub Copilot is designed to read and follow it automatically!

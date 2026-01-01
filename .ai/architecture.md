# Tales of Aneria - System Architecture

## 🏗️ High-Level Architecture

**Frontend**: React 18 + TypeScript + Vite  
**Backend**: Express.js + Node.js 20  
**Database**: PostgreSQL + Drizzle ORM  
**Testing**: Vitest + Playwright + Stryker  

## 🔄 Request Flow

```
Client → Express → Zod Validation → Drizzle ORM → PostgreSQL → Response
```

## 📁 Key Directories

- `client/src/` - React components and pages
- `server/` - Express API routes
- `server/db/` - Database schema (Drizzle)
- `test/` - Unit & integration tests
- `e2e/` - Playwright E2E tests

## 🔑 Core Patterns

### API Routes
- Always use Zod validation
- Always add rate limiting
- Always use try/catch error handling
- Return JSON with `{ success: boolean, data/error }`

### React Components
- Functional components only (no classes)
- TypeScript interfaces for props
- Named exports preferred
- Tailwind CSS for styling

### Database
- Drizzle ORM only (no raw SQL)
- All queries use prepared statements
- Schema in `server/db/schema.ts`

## ⚠️ Critical Files

**Review Required:**
- `server/index.ts` - Server configuration
- `server/db/schema.ts` - Database schema
- `.github/copilot-instructions.md` - AI standards

**AI-Safe:**
- `server/routes/` - API endpoints
- `client/src/components/` - React components
- `test/` - Test files

---

**For Copilot:** This is a TypeScript full-stack app. Use Zod validation, Drizzle ORM, functional React components. Maintain 80%+ test coverage.

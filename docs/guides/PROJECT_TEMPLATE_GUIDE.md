# Using This Project as a Template for New Projects

This guide explains how to leverage the structure, patterns, and enterprise-grade practices from this project to seed and kickstart new projects.

## 🎯 What Makes This Project Template-Worthy

This project showcases:
- **Enterprise CI/CD Pipeline** - Automated testing, security scanning, deployment
- **Comprehensive Testing Strategy** - Unit, E2E, contract, mutation, accessibility, load, chaos tests
- **Security-First Approach** - Trivy, Snyk, GitLeaks, npm audit integration
- **Modern Full-Stack Architecture** - React 18, TypeScript, Express, PostgreSQL
- **Production-Ready Infrastructure** - Docker, health checks, monitoring
- **Quality Gates** - 80%+ code coverage, 80%+ mutation score, WCAG 2.1 AA compliance
- **Automated Versioning** - Conventional commits, automatic changelog generation

## 🚀 Quick Start: Creating a New Project from This Template

### Option 1: GitHub Template (Recommended)

1. **Create a new repository from this template:**
   ```bash
   # On GitHub, click "Use this template" button
   # Or via CLI:
   gh repo create my-new-project --template xavisavvy/toa-website --public
   ```

2. **Clone your new repository:**
   ```bash
   git clone https://github.com/your-username/my-new-project.git
   cd my-new-project
   ```

3. **Run the setup script:**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your values
   ```

### Option 2: Manual Clone & Customize

1. **Clone this repository:**
   ```bash
   git clone https://github.com/xavisavvy/toa-website.git my-new-project
   cd my-new-project
   rm -rf .git
   git init
   ```

2. **Update project metadata:**
   - Edit `package.json`: name, description, repository URLs
   - Edit `README.md`: Update project title, description, badges
   - Edit `LICENSE`: Update copyright holder
   - Update `CHANGELOG.md`: Reset to version 0.1.0

3. **Configure environment:**
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your project values
   ```

## 📋 Checklist: Adapting the Template

### Phase 1: Project Identity (5-10 minutes)

- [ ] Update `package.json`:
  - [ ] `name`: Your project name
  - [ ] `description`: Your project description
  - [ ] `version`: Reset to `0.1.0`
  - [ ] `repository`: Your repo URL
  - [ ] `author`: Your name/organization
  - [ ] Remove unused dependencies

- [ ] Update `README.md`:
  - [ ] Replace project title and description
  - [ ] Update badge URLs (GitHub Actions, etc.)
  - [ ] Rewrite features section
  - [ ] Update screenshots/images
  - [ ] Update social links and branding

- [ ] Update branding files:
  - [ ] Replace images in `client/public/`
  - [ ] Update favicon and app icons
  - [ ] Customize theme colors in `tailwind.config.ts`
  - [ ] Update fonts in `client/src/index.css`

### Phase 2: Content & Features (30-60 minutes)

- [ ] Remove/replace domain-specific content:
  - [ ] Delete/replace `client/src/data/cast.json`
  - [ ] Delete/replace `client/src/data/social-links.json`
  - [ ] Remove YouTube/Podcast integration (if not needed)
  - [ ] Remove WorldAnvil/Etsy integrations (if not needed)

- [ ] Update component structure:
  - [ ] Remove unused sections from `client/src/pages/Home.tsx`
  - [ ] Delete unused components from `client/src/components/`
  - [ ] Update navigation in `client/src/components/layout/`

- [ ] Configure API endpoints:
  - [ ] Review `server/routes.ts` - remove unused routes
  - [ ] Update or remove YouTube API in `server/youtube.ts`
  - [ ] Update or remove podcast parser in `server/podcast.ts`
  - [ ] Add your own API endpoints

### Phase 3: Infrastructure (15-30 minutes)

- [ ] Update Docker configuration:
  - [ ] Edit `Dockerfile`: Update labels, metadata
  - [ ] Edit `docker-compose.yml`: Update service names, ports
  - [ ] Update `.dockerignore` if needed

- [ ] Update GitHub Actions:
  - [ ] Review `.github/workflows/ci.yml`
  - [ ] Review `.github/workflows/deploy.yml`
  - [ ] Update deployment targets
  - [ ] Configure GitHub Secrets (see below)

- [ ] Database setup:
  - [ ] Review `server/db/schema.ts`
  - [ ] Create your own database schema
  - [ ] Update `drizzle.config.ts` if needed
  - [ ] Run migrations: `npm run db:push`

### Phase 4: Testing & Quality (30-60 minutes)

- [ ] Update tests:
  - [ ] Remove domain-specific tests from `test/`
  - [ ] Update E2E tests in `e2e/`
  - [ ] Review and update `playwright.config.ts`
  - [ ] Review `vitest.config.ts` and `vitest.report.config.ts`

- [ ] Configure quality gates:
  - [ ] Review `stryker.conf.json` (mutation testing)
  - [ ] Review `lighthouserc.json` (performance)
  - [ ] Update `.eslintrc.js` or `eslint.config.js`
  - [ ] Review pre-commit hooks in `.husky/`

### Phase 5: Security & Compliance (15-30 minutes)

- [ ] Security configuration:
  - [ ] Review `.gitleaks.toml` (secret scanning)
  - [ ] Review `.snyk` (if exists)
  - [ ] Update `scripts/license-check.js`
  - [ ] Review security policies in `docs/security/`

- [ ] Environment variables:
  - [ ] Update `.env.example` with your variables
  - [ ] Remove unused environment variables
  - [ ] Document required vs optional variables
  - [ ] Update validation in `server/index.ts`

### Phase 6: Documentation (20-40 minutes)

- [ ] Update documentation:
  - [ ] Review and update all files in `docs/`
  - [ ] Update deployment guides
  - [ ] Update CI/CD documentation
  - [ ] Update testing guides
  - [ ] Update security guides

- [ ] Create project-specific docs:
  - [ ] Architecture documentation
  - [ ] API documentation
  - [ ] Deployment runbook
  - [ ] Contributing guidelines

## 🎨 Customizing the Stack

### Keep These (Core Value)
✅ **TypeScript** - Type safety and developer experience
✅ **Vite** - Fast build times and modern tooling
✅ **Express** - Proven, flexible backend framework
✅ **Vitest** - Fast, modern testing framework
✅ **Playwright** - Reliable E2E testing
✅ **GitHub Actions** - Free CI/CD for public repos
✅ **Docker** - Consistent deployment
✅ **Drizzle ORM** - Type-safe database queries

### Replace These (Project-Specific)
🔄 **React** → Vue, Svelte, or other frontend framework
🔄 **PostgreSQL** → MySQL, MongoDB, or other database
🔄 **Tailwind CSS** → Your preferred CSS solution
🔄 **Shadcn UI** → Material UI, Chakra, or other component library

### Remove These (Optional Features)
❌ YouTube API integration
❌ Podcast RSS parser
❌ WorldAnvil integration
❌ Etsy shop integration
❌ Character/cast management

## 🔧 GitHub Secrets Configuration

Configure these secrets in your repository settings:

### Required for CI/CD
```
GITHUB_TOKEN (automatically provided)
```

### Optional for Enhanced Features
```
SNYK_TOKEN          # For Snyk security scanning
CODECOV_TOKEN       # For code coverage reporting
LIGHTHOUSE_TOKEN    # For Lighthouse CI
```

### Deployment Secrets (Platform-Specific)
```
# For Docker Hub
DOCKER_USERNAME
DOCKER_PASSWORD

# For Cloud Providers
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
# or
AZURE_CREDENTIALS
# or
GCP_SERVICE_ACCOUNT_KEY
```

See [GitHub Secrets Guide](../ci-cd/GITHUB_SECRETS_GUIDE.md) for detailed setup.

## 📦 What to Keep vs. Remove

### Keep (Universal Value)

**Structure & Patterns:**
- ✅ `client/src/` - Frontend structure
- ✅ `server/` - Backend structure
- ✅ `shared/` - Shared types and utilities
- ✅ `test/` - Testing structure
- ✅ `e2e/` - E2E testing structure
- ✅ `scripts/` - Utility scripts

**Configuration:**
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `vite.config.ts` - Build configuration
- ✅ `vitest.config.ts` - Test configuration
- ✅ `playwright.config.ts` - E2E configuration
- ✅ `eslint.config.js` - Linting rules
- ✅ `tailwind.config.ts` - Design system (customize colors)

**CI/CD:**
- ✅ `.github/workflows/ci.yml` - Core CI pipeline
- ✅ `.github/workflows/deploy.yml` - Deployment automation
- ✅ `.github/workflows/version.yml` - Semantic versioning
- ✅ `.github/workflows/sbom.yml` - Security bill of materials

**Quality & Security:**
- ✅ `.husky/` - Git hooks
- ✅ `.gitleaks.toml` - Secret scanning
- ✅ `stryker.conf.json` - Mutation testing
- ✅ `lighthouserc.json` - Performance testing

**Documentation:**
- ✅ `docs/ci-cd/` - CI/CD guides (update examples)
- ✅ `docs/deployment/` - Deployment guides
- ✅ `docs/testing/` - Testing strategies
- ✅ `docs/security/` - Security practices

### Remove (Project-Specific)

**Domain Content:**
- ❌ `client/src/data/cast.json` - Specific to this project
- ❌ `client/src/data/social-links.json` - Project-specific links
- ❌ `hero-*.png` - Project-specific images
- ❌ `attached_assets/` - Project-specific assets

**Feature-Specific Code:**
- ❌ `server/youtube.ts` - Unless you need YouTube integration
- ❌ `server/podcast.ts` - Unless you need podcast parsing
- ❌ Character management components
- ❌ World building components
- ❌ Shop/merchandise components

**Documentation Content:**
- ❌ Project-specific examples in docs
- ❌ Phase completion summaries (create your own)
- ❌ Tales of Aneria branding references

## 🏗️ Architecture Patterns to Replicate

### 1. Full-Stack TypeScript Monorepo
```
project/
├── client/          # Frontend (React + Vite)
├── server/          # Backend (Express)
├── shared/          # Shared types and utilities
├── test/            # Unit & integration tests
├── e2e/             # End-to-end tests
├── scripts/         # Build & deployment scripts
└── docs/            # Comprehensive documentation
```

### 2. Environment-Based Configuration
- `.env.example` - Template with all variables documented
- `.env` - Local development (gitignored)
- `.env.docker` - Docker-specific overrides
- Environment validation on startup

### 3. Layered Testing Strategy
```
Unit Tests (Vitest)
  ↓
Integration Tests (Vitest + Supertest)
  ↓
Contract Tests (Pact)
  ↓
E2E Tests (Playwright)
  ↓
Mutation Tests (Stryker)
  ↓
Accessibility Tests (Axe)
  ↓
Load Tests (Autocannon)
  ↓
Chaos Tests (Custom)
```

### 4. CI/CD Pipeline Structure
```
On Push:
1. Code Quality (lint, type-check, format)
2. Unit Tests + Coverage
3. Security Scans (Trivy, Snyk, npm audit)
4. Build Validation
5. E2E Tests
6. Mutation Tests
7. Performance Tests

On Main Branch:
8. Generate SBOM
9. Version Bump
10. Deploy to Production
11. Post-Deployment Tests
```

### 5. Security-First Approach
- Secret scanning (GitLeaks)
- Dependency scanning (Snyk, npm audit)
- Container scanning (Trivy)
- License compliance checking
- Automated SBOM generation
- Security headers (Helmet.js)
- Rate limiting
- Input validation (Zod)

## 📊 Maintaining Quality Standards

### Coverage Thresholds
```json
{
  "coverage": {
    "lines": 80,
    "functions": 80,
    "branches": 80,
    "statements": 80
  }
}
```

### Mutation Score
- Minimum: 80%
- Critical paths: 90%+

### Accessibility
- WCAG 2.1 AA compliance
- Automated Axe testing in CI
- Manual testing recommended

### Performance
- Lighthouse score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s

## 🔄 Continuous Improvement

### Regular Maintenance Tasks
```bash
# Update dependencies
npm outdated
npm update

# Security audit
npm audit
npm audit fix

# License check
npm run license:check

# Coverage report
npm run test:coverage

# Mutation testing
npm run test:mutation

# Load testing
npm run test:load:autocannon
```

### Monthly Reviews
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Update documentation
- [ ] Review test coverage
- [ ] Review mutation scores
- [ ] Update roadmap

## 💡 Tips for Success

### Start Small
1. Begin with core features only
2. Keep the CI/CD pipeline
3. Add domain-specific features gradually
4. Don't remove quality gates

### Leverage Documentation
- This project has extensive docs - read them!
- Each phase has a completion summary
- CI/CD guides explain every step
- Testing guides show best practices

### Maintain Quality
- Don't lower coverage thresholds
- Keep mutation testing enabled
- Run security scans regularly
- Update dependencies monthly

### Customize Gradually
- Replace branding first
- Update content second
- Modify features third
- Keep infrastructure last

## 🎓 Learning Resources

### In This Repository
- [Documentation Index](../README.md)
- [Quick Start CI/CD](../ci-cd/QUICK_START_CICD.md)
- [Enterprise CI/CD Guide](../ci-cd/ENTERPRISE_CICD_GUIDE.md)
- [Testing Guide](../testing/TESTING.md)
- [Security Guide](../security/SECURITY.md)
- [Docker Guide](../deployment/DOCKER.md)

### External Resources
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Vitest Guide](https://vitest.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contributing Back

If you find improvements or patterns worth sharing:
1. Create an issue describing the enhancement
2. Submit a PR with your improvements
3. Help others learn from your experience

## 📝 Example: Creating a Blog Platform

Here's a concrete example of adapting this template:

### 1. Initial Setup
```bash
git clone https://github.com/xavisavvy/toa-website.git my-blog
cd my-blog
rm -rf .git
git init
```

### 2. Update Metadata
```json
// package.json
{
  "name": "my-awesome-blog",
  "description": "A modern blog platform with markdown support",
  "version": "0.1.0",
  // ...
}
```

### 3. Remove Unused Features
```bash
# Remove Tales of Aneria specific components
rm client/src/components/CharacterSection.tsx
rm client/src/components/WorldSection.tsx
rm client/src/components/ShopSection.tsx
rm server/youtube.ts
rm server/podcast.ts
```

### 4. Add Blog-Specific Features
```bash
# Create new components
touch client/src/components/BlogPost.tsx
touch client/src/components/BlogList.tsx
touch client/src/components/MarkdownEditor.tsx
touch server/routes/blog.ts
```

### 5. Update Database Schema
```typescript
// server/db/schema.ts
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  // ...
});
```

### 6. Keep the Infrastructure
- ✅ CI/CD pipeline stays the same
- ✅ Testing infrastructure stays the same
- ✅ Security scanning stays the same
- ✅ Docker setup stays the same
- ✅ Quality gates stay the same

## ✨ Success Stories

Use this template to create:
- 📝 **Blogs & Content Platforms** - Markdown, CMS integration
- 🛒 **E-commerce Sites** - Product catalogs, shopping carts
- 📊 **Dashboards** - Data visualization, analytics
- 🎮 **Gaming Communities** - Guilds, leaderboards, forums
- 📱 **SaaS Applications** - Multi-tenant, authentication
- 🎯 **Landing Pages** - Marketing sites, portfolios

All with enterprise-grade CI/CD, testing, and security built-in!

---

**Questions?** Open an issue or check the [documentation index](../README.md).

**Built with** ❤️ **by the TTRPG community**

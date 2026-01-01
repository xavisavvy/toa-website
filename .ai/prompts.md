# Effective Copilot Prompts for Tales of Aneria

## 🎯 Code Generation

### Creating New Features
```
✅ "Create a secure endpoint for user registration following our standards"
✅ "Add enterprise test coverage for the login component"
✅ "Build an accessible navigation menu component"
✅ "Create a database migration for storing user preferences"
```

### Following Patterns
```
✅ "Create an API endpoint using our standard pattern for [feature]"
✅ "Build a React component following our conventions for [UI element]"
✅ "Add Zod validation schema for [data type]"
```

## 🔧 Refactoring

```
✅ "Refactor server/routes/users.ts to follow our naming conventions"
✅ "Extract this function into smaller, testable units"
✅ "Optimize this component for performance using React.memo"
✅ "Convert this class component to a functional component"
```

## 🧪 Testing

```
✅ "Write comprehensive tests for the authentication flow with edge cases"
✅ "Add mutation tests for the password validation function"
✅ "Create E2E test for the user registration flow"
✅ "Add accessibility tests for the homepage"
```

## 🐛 Debugging

```
✅ "Analyze this error message and suggest fixes: [error]"
✅ "Find the root cause of users not being able to login"
✅ "Review server/auth.ts for security vulnerabilities"
✅ "Debug why the test coverage dropped below 80%"
```

## 📝 Documentation

```
✅ "Document the /api/users endpoint with JSDoc and examples"
✅ "Create a usage guide for the authentication system"
✅ "Update README.md with the new user registration feature"
✅ "Add inline comments explaining this complex algorithm"
```

## 🎨 UI/UX

```
✅ "Make this component responsive using Tailwind classes"
✅ "Add proper ARIA labels for accessibility"
✅ "Implement dark mode support for this page"
✅ "Add loading states and error handling to this component"
```

## 🔐 Security

```
✅ "Add input validation to prevent SQL injection"
✅ "Implement rate limiting for the login endpoint"
✅ "Add CSRF protection to this form"
✅ "Review this code for XSS vulnerabilities"
```

## ⚙️ Configuration

```
✅ "Add a new environment variable for [service] with validation"
✅ "Configure Docker to optimize build time"
✅ "Set up GitHub Actions workflow for [task]"
```

## ❌ Avoid These Prompts

```
❌ "Make it better" (too vague)
❌ "Fix the bug" (no context)
❌ "Add features" (no specifics)
❌ "Refactor everything" (too broad)
```

## 💡 Pro Tips

### Be Specific
- ✅ "Add Zod validation for email with RFC 5322 compliance"
- ❌ "Add validation"

### Provide Context
- ✅ "Refactor the login handler to match our API pattern in server/routes/auth.ts"
- ❌ "Refactor login"

### Reference Examples
- ✅ "Create a component like HeroSection.tsx but for testimonials"
- ❌ "Create a testimonials component"

### Include Constraints
- ✅ "Optimize this function to run in O(n) time complexity"
- ❌ "Optimize this function"

---

**Remember:** Copilot works best with clear, specific prompts that reference existing patterns and include constraints.

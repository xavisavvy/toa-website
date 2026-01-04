# GitHub Copilot Knowledge Base

## Common Mistakes to Avoid

### ❌ Wouter Navigation
**WRONG:**
```typescript
import { useNavigate } from 'wouter';
const navigate = useNavigate();
navigate('/path');
```

**CORRECT:**
```typescript
import { useLocation } from 'wouter';
const [, setLocation] = useLocation();
setLocation('/path');
```

**Why:** Wouter does NOT export `useNavigate`. It only exports `useLocation` which returns `[location, setLocation]`.

### ✅ Wouter Patterns

#### Navigation
```typescript
import { useLocation } from 'wouter';

function MyComponent() {
  const [, setLocation] = useLocation();
  
  const handleClick = () => {
    setLocation('/new-path');
  };
  
  return <button onClick={handleClick}>Navigate</button>;
}
```

#### Links
```typescript
import { Link } from 'wouter';

<Link href="/path">Click me</Link>
```

#### Get Current Location
```typescript
import { useLocation } from 'wouter';

function MyComponent() {
  const [location] = useLocation();
  console.log('Current path:', location);
}
```

## Router Library Reference

We use **wouter** (NOT react-router). Key differences:

| Feature | Wouter | React Router |
|---------|--------|--------------|
| Navigation Hook | `useLocation()` → `[location, setLocation]` | `useNavigate()` → `navigate` |
| Link Component | `<Link href="/path">` | `<Link to="/path">` |
| Route Component | `<Route path="/path" component={Comp} />` | `<Route path="/path" element={<Comp />} />` |

## Pre-commit Checks

Run before committing:
```bash
npm run check:mistakes  # Check for common import errors
npm run lint            # ESLint
npm run type-check      # TypeScript
```

## VS Code Snippets

Type these prefixes for auto-completion:
- `useWouterNav` - Navigation hook setup
- `useWouterLoc` - Location hook setup
- `wouterLink` - Link component

---

**This file is read by GitHub Copilot to prevent common mistakes.**

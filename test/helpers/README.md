# Test Helpers Quick Reference

Quick reference for using the centralized test utilities.

## 📦 Import Statement

```typescript
import {
  renderWithProviders,
  screen,
  fireEvent,
  userEvent,
  mockFetch,
  mockWindowLocation,
  TestFactory,
} from './helpers/test-utils';
```

---

## 🏭 Test Factories

### Video
```typescript
const video = TestFactory.video(); // Default video
const customVideo = TestFactory.video({
  title: 'Custom Title',
  duration: '12:34',
});
```

### Short
```typescript
const short = TestFactory.short();
const customShort = TestFactory.short({
  durationSeconds: 30,
});
```

### Episode
```typescript
const episode = TestFactory.episode();
const customEpisode = TestFactory.episode({
  title: 'Episode 42',
  duration: '7200', // 2 hours
});
```

### Character
```typescript
const character = TestFactory.character();
const wizard = TestFactory.character({
  class: 'Wizard',
  level: 10,
});
```

### Product
```typescript
const product = TestFactory.product();
const expensive = TestFactory.product({
  price: '$100.00',
  inStock: false,
});
```

### Multiple Items
```typescript
const playlist = TestFactory.playlistResponse(5); // 5 videos
```

---

## 🎨 Rendering

### Basic Rendering
```typescript
renderWithProviders(<MyComponent />);
```

### With Props
```typescript
renderWithProviders(<MyComponent prop="value" />);
```

### With Initial Route
```typescript
renderWithProviders(<MyComponent />, {
  initialRoute: '/characters',
});
```

### With Custom Query Client
```typescript
const queryClient = createTestQueryClient();
renderWithProviders(<MyComponent />, { queryClient });
```

### Accessing Returned Values
```typescript
const { container, queryClient } = renderWithProviders(<MyComponent />);
```

---

## 🌐 Mocking Fetch

### Success Response
```typescript
mockFetch.success([TestFactory.video()]);
mockFetch.success({ data: 'value' });
```

### Error Response
```typescript
mockFetch.error(404, 'Not Found');
mockFetch.error(500); // Default: 'Internal Server Error'
```

### Network Error
```typescript
mockFetch.network();
```

### Timeout
```typescript
mockFetch.timeout(5000); // 5 second timeout
```

---

## 🪟 Mocking Window.Location

### Basic Usage
```typescript
describe('Component', () => {
  let locationMock;

  beforeEach(() => {
    locationMock = mockWindowLocation();
  });

  afterEach(() => {
    locationMock.restore();
  });

  it('should navigate', () => {
    // Trigger navigation
    fireEvent.click(button);
    
    // Check location
    expect(locationMock.getHref()).toContain('/new-page');
  });
});
```

---

## 🧪 Common Test Patterns

### Test Rendering
```typescript
it('should render component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Test User Interaction
```typescript
it('should handle click', async () => {
  renderWithProviders(<MyComponent />);
  
  const button = screen.getByRole('button');
  await userEvent.click(button);
  
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

### Test Async Data Loading
```typescript
it('should load data', async () => {
  mockFetch.success([TestFactory.video()]);
  
  renderWithProviders(<MyComponent />);
  
  const title = await screen.findByText('Test Video Title');
  expect(title).toBeInTheDocument();
});
```

### Test Error Handling
```typescript
it('should handle errors', async () => {
  mockFetch.error(500);
  
  renderWithProviders(<MyComponent />);
  
  const error = await screen.findByText(/error/i);
  expect(error).toBeInTheDocument();
});
```

### Test Form Submission
```typescript
it('should submit form', async () => {
  const locationMock = mockWindowLocation();
  
  renderWithProviders(<MyForm />);
  
  await userEvent.type(screen.getByLabelText('Name'), 'John');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(locationMock.getHref()).toContain('mailto:');
  
  locationMock.restore();
});
```

---

## 🎯 Testing Library Queries

### Recommended (by priority)
1. `getByRole` - Most accessible
2. `getByLabelText` - For forms
3. `getByPlaceholderText` - For inputs
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort

### Examples
```typescript
// By role (best)
screen.getByRole('button', { name: /submit/i });

// By label text
screen.getByLabelText('Email');

// By placeholder
screen.getByPlaceholderText('Enter email');

// By text content
screen.getByText('Welcome');

// By test ID (fallback)
screen.getByTestId('custom-component');
```

---

## ⏱️ Async Queries

### findBy - Wait for element
```typescript
const element = await screen.findByText('Loaded');
```

### waitFor - Wait for condition
```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### waitForElementToBeRemoved
```typescript
import { waitForElementToBeRemoved } from '@testing-library/react';

await waitForElementToBeRemoved(() => 
  screen.queryByText('Loading...')
);
```

---

## 🔍 Debugging

### Print DOM
```typescript
screen.debug();
```

### Print Specific Element
```typescript
screen.debug(screen.getByText('Hello'));
```

### Log Queries
```typescript
const { container } = renderWithProviders(<MyComponent />);
console.log(container.innerHTML);
```

---

## ✅ Best Practices

1. **Use factories** for test data
2. **Use renderWithProviders** for components
3. **Use mockFetch** for API calls
4. **Use mockWindowLocation** for navigation
5. **Prefer findBy** for async operations
6. **Avoid act() warnings** - utilities handle this
7. **Clean up mocks** in afterEach
8. **Test behavior**, not implementation

---

## 🚨 Common Pitfalls

### ❌ Don't do this:
```typescript
// Accessing implementation details
expect(component.state.count).toBe(1);

// Testing too many things
it('should do everything', () => { /* 50 assertions */ });

// Not cleaning up
globalThis.fetch = vi.fn(); // Persists across tests!
```

### ✅ Do this instead:
```typescript
// Test observable behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();

// One concern per test
it('should increment count', () => { /* focused test */ });

// Use beforeEach/afterEach
beforeEach(() => {
  mockFetch.success([]);
});
```

---

## 📚 More Resources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Vitest Docs](https://vitest.dev/)
- `docs/TEST_IMPROVEMENTS.md` - Detailed improvement guide
- `test/helpers/test-utils.tsx` - Source code

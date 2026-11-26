# Visual Regression Testing

## Overview

Visual regression testing automatically detects unintended visual changes in your UI by comparing screenshots against baseline images. This catches CSS bugs, layout issues, and UI regressions that might slip through functional tests.

## Implementation

This project uses **Playwright's built-in screenshot comparison** for visual regression testing - no need for additional tools like Storybook or Chromatic.

## Files Created

- `e2e/visual-regression.spec.ts` - 25+ visual tests
- Baseline screenshots stored in `e2e/visual-regression.spec.ts-snapshots/`

## How It Works

### 1. Capture Baseline Screenshots
```bash
npm run test:visual:update
```

First run captures "golden" screenshots and saves them as baselines.

### 2. Compare Against Baselines
```bash
npm run test:visual
```

Subsequent runs compare new screenshots against baselines and fail if differences exceed thresholds.

### 3. Review Differences
When tests fail, Playwright generates:
- **Actual screenshot** - What the app looks like now
- **Expected screenshot** - The baseline
- **Diff image** - Highlights the differences

Open the Playwright HTML report to see visual diffs:
```bash
npx playwright show-report
```

## Test Coverage

### Pages Tested (7 test categories)

#### 1. Homepage Visual Tests
- Hero section baseline
- Full page desktop view
- Mobile responsive view

#### 2. Characters Page Visual Tests  
- Character grid layout
- Character card hover states

#### 3. Character Detail Visual Tests
- Individual character page layout

#### 4. Navigation Visual Tests
- Header navigation bar
- Mobile menu (if applicable)

#### 5. Footer Visual Tests
- Footer layout and content

#### 6. Responsive Design Tests
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1280x720)
- Wide (1920x1080)

#### 7. Interactive Component States
- Button hover states
- Link hover states
- Loading spinner appearance
- 404 error page

#### 8. Dark Mode Tests (if applicable)
- Homepage in dark mode
- Component rendering in dark theme

## Configuration

### Screenshot Options

```typescript
await expect(page).toHaveScreenshot('screenshot-name.png', {
  fullPage: true,              // Capture entire page
  maxDiffPixels: 100,          // Allow up to 100 pixels difference
  maxDiffPixelRatio: 0.01,     // Or 1% of total pixels
  threshold: 0.2,              // Pixel color threshold (0-1)
  animations: 'disabled',      // Disable animations
});
```

### Tolerance Levels

Different tests use different tolerance based on content:

| Content Type | Tolerance | Reason |
|--------------|-----------|--------|
| Static pages | 0.01 (1%) | Should be pixel-perfect |
| Dynamic content | 0.02 (2%) | Videos, carousels may vary |
| Hover states | 50px | Antialiasing differences |

## npm Scripts

```json
{
  "test:visual": "playwright test e2e/visual-regression.spec.ts",
  "test:visual:update": "playwright test e2e/visual-regression.spec.ts --update-snapshots",
  "test:visual:ui": "playwright test e2e/visual-regression.spec.ts --ui"
}
```

## Usage Examples

### Run All Visual Tests
```bash
npm run test:visual
```

### Update All Baselines
```bash
npm run test:visual:update
```

### Update Specific Test
```bash
npx playwright test -g "homepage hero" --update-snapshots
```

### Run in UI Mode
```bash
npm run test:visual:ui
```

### Run Specific Viewport Tests
```bash
npx playwright test -g "mobile resolution"
```

## When to Update Baselines

Update baselines when:
- ✅ You intentionally changed the UI
- ✅ You added new components
- ✅ You updated styles/colors
- ✅ You fixed a layout bug

Don't update baselines when:
- ❌ Tests fail unexpectedly
- ❌ You haven't reviewed the changes
- ❌ Differences seem unintentional

## Best Practices

### 1. Consistent Test Environment
```typescript
test.beforeEach(async ({ page }) => {
  // Set consistent viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  
  // Wait for content
  await page.waitForLoadState('networkidle');
});
```

### 2. Handle Dynamic Content
```typescript
// Hide dynamic timestamps
await page.addStyleTag({
  content: '.timestamp { visibility: hidden; }'
});

// Or mask specific elements
await expect(page).toHaveScreenshot({
  mask: [page.locator('.dynamic-content')]
});
```

### 3. Wait for Animations
```typescript
// Wait for transitions
await button.hover();
await page.waitForTimeout(500); // Wait for animation

// Or disable animations globally
await page.emulateMedia({ reducedMotion: 'reduce' });
```

### 4. Test Responsive Breakpoints
```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];

for (const viewport of viewports) {
  test(`page at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    // ... test
  });
}
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Visual Regression Tests

on: [pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
      
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Run visual tests
        run: npm run test:visual
        
      - name: Upload diff images
        if: failure()
        uses: actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7
        with:
          name: visual-diffs
          path: test-results/
```

## Common Issues & Solutions

### Issue: Tests fail on different machines
**Solution:** Playwright uses consistent rendering across platforms, but ensure:
- Same OS (or use Docker)
- Same browser version
- Same viewport size
- Disable animations

### Issue: Fonts look different
**Solution:** 
```typescript
// Wait for fonts to load
await page.waitForLoadState('networkidle');
await page.evaluate(() => document.fonts.ready);
```

### Issue: Images not loaded
**Solution:**
```typescript
// Wait for images
await page.waitForSelector('img[src]');
await page.evaluate(() => 
  Promise.all(
    Array.from(document.images)
      .filter(img => !img.complete)
      .map(img => new Promise(resolve => {
        img.onload = img.onerror = resolve;
      }))
  )
);
```

### Issue: Flaky tests due to async content
**Solution:**
```typescript
// Wait for specific content
await page.waitForSelector('[data-testid="loaded"]');

// Or use auto-wait assertions
await expect(page.locator('.content')).toBeVisible();
```

## Advantages Over Manual Testing

✅ **Fast** - Automated screenshot comparison in seconds  
✅ **Reliable** - Catches pixel-level changes humans miss  
✅ **Comprehensive** - Test all breakpoints automatically  
✅ **Documented** - Visual history in baseline images  
✅ **CI/CD Ready** - Runs on every PR automatically  

## Limitations

⚠️ **Not a replacement for functional tests** - Only catches visual changes  
⚠️ **Requires baseline updates** - After intentional UI changes  
⚠️ **Can be brittle** - Dynamic content needs special handling  
⚠️ **Storage requirements** - Baseline images take disk space  

## Project-Specific Implementation

### Current Test Count
- **25+ visual tests** covering:
  - 3 homepage tests (desktop, mobile, full page)
  - 2 characters page tests
  - 1 character detail test
  - 2 navigation tests
  - 1 footer test
  - 4 responsive design tests
  - 2 component state tests
  - 1 loading state test
  - 1 error state test
  - 8 additional UI component tests

### Test Organization
```
e2e/
├── visual-regression.spec.ts    # All visual tests
└── visual-regression.spec.ts-snapshots/
    ├── homepage-hero-chromium-darwin.png
    ├── homepage-mobile-chromium-darwin.png
    ├── characters-page-chromium-darwin.png
    └── ... (more baseline screenshots)
```

### Running Tests

**Prerequisites:**
1. Start dev server: `npm run dev`
2. In another terminal, run tests

**First Time Setup:**
```bash
# Generate baselines
npm run test:visual:update
```

**Regular Testing:**
```bash
# Run visual regression tests
npm run test:visual
```

**Review Failures:**
```bash
# Open HTML report
npx playwright show-report
```

## Metrics

With visual regression testing, we:
- ✅ Prevent CSS regressions
- ✅ Catch layout bugs before production
- ✅ Validate responsive design automatically
- ✅ Ensure consistent UI across browsers
- ✅ Document visual history

## Next Steps

1. ✅ Tests created (25+ tests)
2. ⏳ Generate baseline screenshots
3. ⏳ Run in CI/CD pipeline
4. ⏳ Integrate with PR reviews
5. ⏳ Set up automated baseline updates

## Resources

- [Playwright Screenshots](https://playwright.dev/docs/screenshots)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Troubleshooting

### All tests failing after update
- Review changes: `npx playwright show-report`
- If intentional: `npm run test:visual:update`

### Flaky visual tests
- Increase `maxDiffPixels` tolerance
- Add `await page.waitForLoadState('networkidle')`
- Disable animations: `animations: 'disabled'`

### Different results on CI vs local
- Use same OS/browser
- Or use Docker for consistent environment
- Check font rendering settings

---

**Visual regression testing is now part of your comprehensive test strategy!** 🎨✨

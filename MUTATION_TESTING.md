# Mutation Testing with Stryker

## What is Mutation Testing?

Mutation testing is a method to evaluate the quality of your tests by introducing small changes (mutations) to your code and checking if your tests catch them. If a test fails when the code is mutated, the mutation is "killed" (good!). If tests still pass with mutated code, the mutation "survived" (bad - means your tests aren't thorough enough).

## Installation

Already installed in this project:
```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
```

## Configuration

Two configuration files are provided:

### 1. `stryker.conf.json` - Full Project Mutation Testing
Tests all server and shared code:
- `server/**/*.ts`
- `shared/**/*.ts`
- Excludes test files

### 2. `stryker-security.conf.json` - Focused Security Testing
Tests only the security module:
- `server/security.ts`
- Faster, more focused testing
- Good for CI/CD pipelines

## Usage

### Run Full Mutation Testing
```bash
npm run test:mutation
```

### Run Incremental Mutation Testing
Only tests changed code since last run:
```bash
npm run test:mutation:incremental
```

### Run Security-Focused Mutation Testing
```bash
npx stryker run stryker-security.conf.json
```

## Understanding the Results

### Mutation Score
- **80%+ (High)**: Excellent test quality
- **60-79% (Medium)**: Good test quality
- **<60% (Low)**: Tests need improvement

### Mutation States

1. **Killed** ✅
   - Mutation caused tests to fail
   - **Good!** Your tests caught the bug

2. **Survived** ❌
   - Mutation didn't break any tests
   - **Bad!** Your tests missed this change

3. **Timeout** ⏱️
   - Test took too long with mutation
   - Usually indicates infinite loop

4. **No Coverage** ⚠️
   - No tests execute this code
   - Add tests for this code

## Example: Mutation Types

### 1. Arithmetic Mutations
```typescript
// Original
const result = a + b;

// Mutated
const result = a - b;  // Tests should fail!
```

### 2. Comparison Mutations
```typescript
// Original
if (value > 10) { ... }

// Mutated
if (value >= 10) { ... }  // Tests should catch this!
```

### 3. Boolean Mutations
```typescript
// Original
if (isValid && isAuthorized) { ... }

// Mutated
if (isValid || isAuthorized) { ... }  // Should break tests!
```

### 4. Return Value Mutations
```typescript
// Original
return true;

// Mutated
return false;  // Tests must fail!
```

## Configuration Explained

### Key Settings

```json
{
  "mutate": [
    "server/**/*.ts",     // Files to mutate
    "!server/**/*.test.ts" // Files to exclude
  ],
  "thresholds": {
    "high": 80,   // Excellent quality threshold
    "low": 60,    // Acceptable threshold
    "break": 50   // Fail build if below this
  },
  "coverageAnalysis": "perTest",  // Fastest analysis
  "timeoutMS": 60000,             // 60 second timeout
  "timeoutFactor": 2,             // 2x normal test time
  "maxConcurrentTestRunners": 2,  // Parallel test runners
  "incremental": true,            // Enable incremental mode
  "excludedMutations": [
    "StringLiteral",    // Skip string mutations
    "ObjectLiteral"     // Skip object mutations
  ]
}
```

### Why Exclude Some Mutations?

- **StringLiteral**: Error messages, log strings don't need mutation testing
- **ObjectLiteral**: Configuration objects are often static

## Best Practices

### 1. Start Small
Run mutation testing on critical modules first:
```bash
# Focus on security module
npx stryker run stryker-security.conf.json
```

### 2. Use Incremental Mode
After the initial run, use incremental:
```bash
npm run test:mutation:incremental
```

### 3. Set Realistic Thresholds
- Start with 50% break threshold
- Gradually increase as tests improve
- Aim for 80%+ on critical modules

### 4. Review Surviving Mutations
When mutations survive:
1. Check the mutation report in `reports/mutation/html/index.html`
2. Add tests to kill the mutation
3. Re-run mutation testing

### 5. Integrate with CI/CD
```yaml
# .github/workflows/mutation-test.yml
- name: Mutation Testing
  run: npm run test:mutation
  continue-on-error: true  # Don't fail build initially
```

## Example: Good vs Bad Tests

### Bad Test (Mutation Survives)
```typescript
it('validates URL', () => {
  const result = validateUrl('http://example.com');
  expect(result).toBeDefined();  // Too weak!
});
```
**Why it's bad**: Mutation could change validation logic and test still passes.

### Good Test (Kills Mutations)
```typescript
it('validates URL', () => {
  const result = validateUrl('http://example.com');
  expect(result.valid).toBe(true);
  expect(result.error).toBeUndefined();
  
  const invalid = validateUrl('not-a-url');
  expect(invalid.valid).toBe(false);
  expect(invalid.error).toBeDefined();
});
```
**Why it's good**: Tests both success and failure paths with specific assertions.

## Interpreting the Report

### HTML Report
Open `reports/mutation/html/index.html` to see:
- Mutation score per file
- Specific mutations that survived
- Line-by-line mutation status

### Color Coding
- 🟢 **Green**: Mutation killed (good)
- 🔴 **Red**: Mutation survived (needs attention)
- 🟡 **Yellow**: No coverage (add tests)

## Common Mutation Survival Reasons

### 1. Incomplete Boundary Testing
```typescript
// Code
if (value > 10) { return true; }

// Missing test for value === 10
// Mutation: > becomes >=
// Survives because no test checks boundary!
```

### 2. Missing Edge Cases
```typescript
// Code
function divide(a: number, b: number) {
  return a / b;
}

// Missing test for b === 0
// Mutation: changes division logic
// Survives because edge case not tested!
```

### 3. Weak Assertions
```typescript
// Weak
expect(result).toBeTruthy();

// Strong
expect(result.status).toBe(200);
expect(result.data).toHaveLength(5);
```

## Performance Tips

### 1. Limit Scope
Don't mutate everything at once:
```json
{
  "mutate": [
    "server/security.ts",      // Critical module
    "server/validators.ts"     // Another critical module
  ]
}
```

### 2. Use Coverage Analysis
```json
{
  "coverageAnalysis": "perTest"  // Fastest option
}
```

### 3. Adjust Concurrency
```json
{
  "maxConcurrentTestRunners": 4  // Match your CPU cores
}
```

### 4. Incremental Mode
```bash
# Only tests changes since last run
npm run test:mutation:incremental
```

## Project-Specific Notes

### Current Test Quality Estimate
Based on our comprehensive test suite:
- **Security module**: Expected 70-80% (63 tests)
- **Validators**: Expected 65-75% (property tests)
- **Overall**: Expected 60-70%

### Recommended Mutation Testing Order

1. **Security Module** (Highest Priority)
   ```bash
   npx stryker run stryker-security.conf.json
   ```
   - Critical code
   - Well-tested (63 tests)
   - Fast to run

2. **Validators** (High Priority)
   ```bash
   # Add to stryker.conf.json mutate array
   "server/validators.ts"
   ```

3. **API Routes** (Medium Priority)
   ```bash
   "server/routes/**/*.ts"
   ```

4. **Full Project** (Lower Priority)
   ```bash
   npm run test:mutation
   ```

## Expected Results

With our 331 tests, we expect:

| Module | Mutation Score | Notes |
|--------|---------------|-------|
| Security | 70-80% | 63 security tests |
| Validators | 65-75% | Property + unit tests |
| API Routes | 60-70% | E2E + unit tests |
| Utils | 50-60% | Basic coverage |
| **Overall** | **60-70%** | Excellent starting point! |

## Next Steps

1. ✅ Configuration created
2. ⏳ Run initial mutation test
3. ⏳ Review HTML report
4. ⏳ Identify weak tests
5. ⏳ Add missing test cases
6. ⏳ Achieve 80%+ on critical modules

## Resources

- [Stryker Documentation](https://stryker-mutator.io/)
- [Mutation Testing Explained](https://stryker-mutator.io/docs/)
- [Vitest Runner Guide](https://stryker-mutator.io/docs/stryker-js/vitest-runner)

## Troubleshooting

### "No tests found"
- Check `vitest.config.ts` path in stryker config
- Ensure test files match vitest patterns

### "Timeout"
- Increase `timeoutMS` in config
- Increase `timeoutFactor`

### "Out of memory"
- Reduce `maxConcurrentTestRunners`
- Limit `mutate` array scope

### "Tests fail in initial run"
- Fix failing tests first
- Run `npm run test` before mutation testing

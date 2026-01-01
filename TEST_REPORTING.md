# Test Reporting & Observability

## Overview
Comprehensive test reporting infrastructure providing visibility into test execution, coverage, performance, and trends over time.

## Reporting Tools

### 1. Unit Test Reports
- **Format:** HTML, JSON, JUnit XML
- **Location:** `reports/test-report.html`
- **Features:**
  - Test execution summary
  - Pass/fail rates
  - Execution time per test
  - Error stack traces
  - Flaky test detection

### 2. Coverage Reports
- **Format:** HTML, JSON, LCOV, Text, Summary
- **Location:** `coverage/index.html`
- **Metrics:**
  - Line coverage: 80% threshold
  - Function coverage: 80% threshold
  - Branch coverage: 75% threshold
  - Statement coverage: 80% threshold

### 3. E2E Test Reports
- **Format:** HTML, JSON, JUnit
- **Location:** `playwright-report/index.html`
- **Features:**
  - Screenshots on failure
  - Video recordings
  - Trace files for debugging
  - Network logs
  - Console logs

### 4. Performance Reports
- **Format:** JSON, Custom HTML
- **Location:** `reports/benchmark-results.json`
- **Metrics:**
  - Operations per second
  - Memory usage
  - CPU time
  - Comparison baselines

### 5. Mutation Testing Reports
- **Format:** HTML, JSON
- **Location:** `reports/mutation/html/index.html`
- **Metrics:**
  - Mutation score
  - Killed/survived mutants
  - Test effectiveness
  - Coverage quality

### 6. Load Test Reports
- **Format:** JSON, Custom console
- **Metrics:**
  - Requests per second
  - Average latency
  - p50, p95, p99 latency
  - Error rates
  - Throughput

## Report Generation

### Generate All Reports
```bash
npm run test:all:report
```

### Individual Reports
```bash
# Unit tests with coverage
npm run test:coverage

# E2E tests with report
npm run test:e2e

# Performance benchmarks
npm run test:perf

# Mutation testing
npm run test:mutation

# Load testing
npm run test:load
```

## CI/CD Integration

### GitHub Actions Artifacts
All reports are automatically uploaded as artifacts:
- `test-results` - Unit test results
- `coverage` - Coverage reports
- `playwright-report` - E2E test reports
- `mutation-report` - Mutation testing results
- `benchmark-results` - Performance metrics

### Report Retention
- **Unit/E2E:** 30 days
- **Coverage:** 90 days
- **Performance:** 90 days (trends)
- **Mutation:** 30 days

## Metrics Dashboard

### Key Metrics Tracked
1. **Test Health**
   - Total tests: X
   - Passing: Y (Z%)
   - Failing: N
   - Flaky tests: M
   - Skipped: K

2. **Coverage Metrics**
   - Overall coverage: 85%
   - Critical paths: 95%
   - New code coverage: 90%

3. **Performance Metrics**
   - Test execution time: Xms
   - Build time: Yms
   - Deploy time: Zms

4. **Quality Metrics**
   - Mutation score: 75%
   - Code smells: Low
   - Technical debt: Manageable

## Report Structure

```
reports/
├── test-report.html         # Unit test results
├── test-results.json        # Machine-readable results
├── junit.xml                # CI/CD integration
├── benchmark-results.json   # Performance data
└── mutation/                # Mutation testing
    ├── html/
    │   └── index.html
    └── mutation.json

coverage/
├── index.html               # Coverage overview
├── lcov.info                # LCOV format
├── coverage-summary.json    # JSON summary
└── [source files]/          # Per-file coverage

playwright-report/
├── index.html               # E2E test results
├── data/
│   └── test-results.json
└── trace/                   # Debug traces
```

## Custom Reporting

### Test Summary Script
```typescript
import fs from 'fs';
import path from 'path';

interface TestResults {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  testResults: Array<{
    name: string;
    status: string;
    duration: number;
  }>;
}

function generateSummary() {
  const results: TestResults = JSON.parse(
    fs.readFileSync('reports/test-results.json', 'utf-8')
  );

  console.log('\n📊 Test Summary\n');
  console.log(`Total Tests: ${results.numTotalTests}`);
  console.log(`✅ Passed: ${results.numPassedTests}`);
  console.log(`❌ Failed: ${results.numFailedTests}`);
  console.log(`⏸️  Skipped: ${results.numPendingTests}`);
  console.log(`\nSuccess Rate: ${(results.numPassedTests / results.numTotalTests * 100).toFixed(2)}%\n`);
}
```

## Viewing Reports

### Local Development
```bash
# Open coverage report
npm run coverage:view
# or manually:
open coverage/index.html

# Open E2E report
npm run test:e2e:report
# or manually:
npx playwright show-report

# View mutation report
open reports/mutation/html/index.html
```

### CI/CD
Reports are available in GitHub Actions:
1. Navigate to Actions tab
2. Select workflow run
3. Download artifacts
4. Extract and view HTML reports

## Report Analysis

### Coverage Analysis
```bash
# Check coverage thresholds
npm run coverage:check

# Generate coverage badge
npm run coverage:badge

# Compare coverage with main branch
git diff origin/main coverage/coverage-summary.json
```

### Trend Analysis
```typescript
// Track metrics over time
interface TrendData {
  date: string;
  coverage: number;
  testCount: number;
  mutationScore: number;
}

const trends: TrendData[] = [
  { date: '2024-01-01', coverage: 75, testCount: 100, mutationScore: 65 },
  { date: '2024-01-08', coverage: 80, testCount: 120, mutationScore: 70 },
  { date: '2024-01-15', coverage: 85, testCount: 150, mutationScore: 75 },
];

// Visualize improvements
```

## Alerting

### Quality Gates
```yaml
# .github/workflows/quality-gates.yml
- name: Check Coverage
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "❌ Coverage below threshold: $COVERAGE%"
      exit 1
    fi

- name: Check Mutation Score
  run: |
    SCORE=$(cat reports/mutation/mutation.json | jq '.mutationScore')
    if (( $(echo "$SCORE < 75" | bc -l) )); then
      echo "❌ Mutation score below threshold: $SCORE%"
      exit 1
    fi
```

### Slack Notifications
```typescript
// Send test results to Slack
async function notifySlack(results: TestResults) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  
  await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify({
      text: `🧪 Test Run Complete`,
      attachments: [{
        color: results.numFailedTests > 0 ? 'danger' : 'good',
        fields: [
          { title: 'Total', value: results.numTotalTests, short: true },
          { title: 'Passed', value: results.numPassedTests, short: true },
          { title: 'Failed', value: results.numFailedTests, short: true },
          { title: 'Coverage', value: '85%', short: true },
        ],
      }],
    }),
  });
}
```

## Best Practices

### 1. Always Review Reports
- Check coverage gaps
- Review failed tests
- Analyze performance regressions
- Track flaky tests

### 2. Set Quality Thresholds
- Minimum coverage: 80%
- Mutation score: 75%
- Max test execution: 5 minutes
- E2E test stability: 95%

### 3. Monitor Trends
- Coverage over time
- Test count growth
- Execution time trends
- Flaky test frequency

### 4. Act on Insights
- Fix failing tests immediately
- Increase coverage for critical paths
- Optimize slow tests
- Remove flaky tests

## Troubleshooting

### Missing Reports
```bash
# Ensure reports directory exists
mkdir -p reports coverage playwright-report

# Regenerate reports
npm run test:all:report
```

### Report Permissions
```bash
# Fix permissions
chmod -R 755 reports coverage playwright-report
```

### Large Report Files
```bash
# Clean old reports
npm run clean:reports

# Or manually
rm -rf reports coverage playwright-report
```

## Integration Examples

### Codecov Integration
```yaml
# .github/workflows/test.yml
- name: Upload to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
    flags: unittests
    fail_ci_if_error: true
```

### SonarQube Integration
```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  with:
    args: >
      -Dsonar.coverage.lcov.reportPaths=coverage/lcov.info
      -Dsonar.testExecutionReportPaths=reports/junit.xml
```

## Future Enhancements

- [ ] Historical trend dashboard
- [ ] Automated performance regression detection
- [ ] Test flakiness tracking
- [ ] Code quality scoring
- [ ] Automated report distribution
- [ ] Real-time monitoring dashboard
- [ ] Custom metric visualizations
- [ ] Comparative analysis tools

## Resources

- [Vitest Reporters](https://vitest.dev/guide/reporters.html)
- [Playwright Test Reports](https://playwright.dev/docs/test-reporters)
- [LCOV Format](http://ltp.sourceforge.net/coverage/lcov.php)
- [JUnit XML Format](https://llg.cubic.org/docs/junit/)

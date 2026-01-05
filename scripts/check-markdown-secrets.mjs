#!/usr/bin/env node

/**
 * Markdown Secret Scanner
 * 
 * Scans markdown files being committed for:
 * - Real API keys (Stripe, AWS, etc.)
 * - Actual secrets in documentation
 * - Live tokens and credentials
 * 
 * This prevents accidental secret exposure in documentation.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Patterns that should NEVER appear in markdown files
const FORBIDDEN_PATTERNS = [
  {
    pattern: /sk_live_[a-zA-Z0-9]{24,}/,
    name: 'Stripe Live Secret Key',
    severity: 'CRITICAL',
    message: 'NEVER commit live Stripe keys to documentation!',
  },
  {
    pattern: /pk_live_[a-zA-Z0-9]{24,}/,
    name: 'Stripe Live Publishable Key',
    severity: 'HIGH',
    message: 'Live publishable keys should not be in documentation',
  },
  {
    pattern: /sk_test_[0-9]{2}[a-zA-Z0-9]{50,}/,
    name: 'Real Stripe Test Key',
    severity: 'MEDIUM',
    message: 'Use placeholder like sk_test_your_key_here instead',
  },
  {
    pattern: /pk_test_[0-9]{2}[a-zA-Z0-9]{50,}/,
    name: 'Real Stripe Test Key',
    severity: 'MEDIUM',
    message: 'Use placeholder like pk_test_your_key_here instead',
  },
  {
    pattern: /whsec_[a-zA-Z0-9]{32,}/,
    name: 'Stripe Webhook Secret',
    severity: 'HIGH',
    message: 'Use placeholder like whsec_your_secret_here',
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/,
    name: 'AWS Access Key',
    severity: 'CRITICAL',
    message: 'NEVER commit AWS keys!',
  },
  {
    pattern: /AIza[0-9A-Za-z\-_]{35}/,
    name: 'Google API Key',
    severity: 'HIGH',
    message: 'Use placeholder like AIzaXXXXXXXX_your_key_here',
  },
  {
    pattern: /ghp_[a-zA-Z0-9]{36,}/,
    name: 'GitHub Personal Access Token',
    severity: 'CRITICAL',
    message: 'NEVER commit GitHub tokens!',
  },
  {
    pattern: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/,
    name: 'Private Key',
    severity: 'CRITICAL',
    message: 'NEVER commit private keys!',
  },
];

// Allowed placeholder patterns (these are OK)
const ALLOWED_PLACEHOLDERS = [
  /sk_test_your_.*_here/,
  /pk_test_your_.*_here/,
  /sk_live_\.\.\./,
  /pk_live_\.\.\./,
  /whsec_your_.*_here/,
  /AKIA\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\./, // Redacted AWS key
  /AKIAIOSFODNN7EXAMPLE/, // Official AWS documentation example
  /xxx+/i,
  /your.*key.*here/i,
  /example.*key/i,
  /placeholder/i,
  /\[YOUR_.*\]/,
  /\{.*KEY.*\}/,
  /_EXAMPLE/i, // Keys ending with _EXAMPLE
  /DO_NOT_USE/i, // Keys marked as DO_NOT_USE
];

function isPlaceholder(text) {
  return ALLOWED_PLACEHOLDERS.some(pattern => pattern.test(text));
}

function scanFile(filepath) {
  let content;
  try {
    content = readFileSync(filepath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File was deleted or moved, skip it
      console.log(`⚠️  Skipping ${filepath} (file not found)`);
      return [];
    }
    throw error;
  }
  
  const lines = content.split('\n');
  const violations = [];

  FORBIDDEN_PATTERNS.forEach(({ pattern, name, severity, message }) => {
    lines.forEach((line, index) => {
      const matches = line.match(new RegExp(pattern, 'g'));
      if (matches) {
        matches.forEach(match => {
          // Skip if it's an allowed placeholder
          if (isPlaceholder(match)) {
            return;
          }

          violations.push({
            file: filepath,
            line: index + 1,
            pattern: name,
            severity,
            message,
            match: match.substring(0, 20) + '...', // Redact full secret
          });
        });
      }
    });
  });

  return violations;
}

function main() {
  console.log('\n🔍 Scanning markdown files for secrets...\n');

  // Get staged markdown files
  let stagedFiles;
  try {
    stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(file => file.endsWith('.md') && file.length > 0);
  } catch (error) {
    console.error('❌ Error getting staged files:', error.message);
    process.exit(1);
  }

  if (stagedFiles.length === 0) {
    console.log('✅ No markdown files to scan\n');
    process.exit(0);
  }

  console.log(`📄 Scanning ${stagedFiles.length} markdown file(s)...\n`);

  let allViolations = [];

  stagedFiles.forEach(file => {
    const violations = scanFile(file);
    allViolations = allViolations.concat(violations);
  });

  if (allViolations.length === 0) {
    console.log('✅ No secrets found in markdown files\n');
    process.exit(0);
  }

  // Report violations
  console.error('❌ SECRET EXPOSURE DETECTED IN MARKDOWN FILES!\n');
  console.error('━'.repeat(80));

  const critical = allViolations.filter(v => v.severity === 'CRITICAL');
  const high = allViolations.filter(v => v.severity === 'HIGH');
  const medium = allViolations.filter(v => v.severity === 'MEDIUM');

  if (critical.length > 0) {
    console.error('\n🚨 CRITICAL VIOLATIONS (NEVER commit these!):\n');
    critical.forEach(v => {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`  ⚠️  ${v.pattern}: ${v.match}`);
      console.error(`  💡 ${v.message}\n`);
    });
  }

  if (high.length > 0) {
    console.error('\n⚠️  HIGH SEVERITY VIOLATIONS:\n');
    high.forEach(v => {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`  ⚠️  ${v.pattern}: ${v.match}`);
      console.error(`  💡 ${v.message}\n`);
    });
  }

  if (medium.length > 0) {
    console.error('\n⚠️  MEDIUM SEVERITY VIOLATIONS:\n');
    medium.forEach(v => {
      console.error(`  ${v.file}:${v.line}`);
      console.error(`  ⚠️  ${v.pattern}: ${v.match}`);
      console.error(`  💡 ${v.message}\n`);
    });
  }

  console.error('━'.repeat(80));
  console.error('\n🛠️  HOW TO FIX:\n');
  console.error('1. Replace real keys with placeholders:');
  console.error('   ❌ sk_test_51SkxsyKIWXn...');
  console.error('   ✅ sk_test_your_key_here\n');
  console.error('2. Use obvious fake values:');
  console.error('   ✅ sk_test_EXAMPLE_DO_NOT_USE');
  console.error('   ✅ pk_test_xxx...xxx');
  console.error('   ✅ AKIA................\n');
  console.error('3. Mark as redacted:');
  console.error('   ✅ [REDACTED]');
  console.error('   ✅ {YOUR_API_KEY_HERE}\n');
  console.error('━'.repeat(80));
  console.error('\n❌ Commit blocked to prevent secret exposure!\n');

  process.exit(1);
}

main();

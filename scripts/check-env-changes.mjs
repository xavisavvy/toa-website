#!/usr/bin/env node

/**
 * Environment Variable Change Detector
 * 
 * This script compares .env.example with the previous version
 * and alerts about new or changed environment variables.
 * 
 * Run as a pre-commit hook to catch env changes before pushing.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ENV_EXAMPLE_FILE = resolve(process.cwd(), '.env.example');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function getGitDiff() {
  try {
    // Check if file is staged
    const status = execSync('git status --porcelain .env.example', { encoding: 'utf-8' });
    
    if (!status) {
      // No changes
      return null;
    }
    
    // Get the diff
    const diff = execSync('git diff HEAD .env.example', { encoding: 'utf-8' });
    return diff;
  } catch {
    // File might be new or git not initialized
    return null;
  }
}

function extractVarsFromDiff(diff) {
  if (!diff) return { added: [], removed: [], modified: [] };
  
  const added = [];
  const removed = [];
  const lines = diff.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const match = line.match(/^\+([A-Z_][A-Z0-9_]*)=/);
      if (match && !line.startsWith('+ #')) {
        added.push(match[1]);
      }
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      const match = line.match(/^-([A-Z_][A-Z0-9_]*)=/);
      if (match && !line.startsWith('- #')) {
        removed.push(match[1]);
      }
    }
  }
  
  return { added, removed, modified: [] };
}

function printBanner(message) {
  const line = '━'.repeat(60);
  console.log(`\n${colors.cyan}${line}${colors.reset}`);
  console.log(`${colors.yellow}${colors.bright}${message}${colors.reset}`);
  console.log(`${colors.cyan}${line}${colors.reset}\n`);
}

function printChecklist() {
  console.log(`${colors.yellow}⚠️  ENVIRONMENT VARIABLE UPDATE CHECKLIST${colors.reset}\n`);
  console.log(`${colors.gray}Update these locations:${colors.reset}\n`);
  console.log(`  ${colors.green}1. ✅ Local .env file${colors.reset}`);
  console.log(`  ${colors.yellow}2. ⬜ GitHub Secrets${colors.reset} (Settings → Secrets → Actions)`);
  console.log(`  ${colors.yellow}3. ⬜ Replit Secrets${colors.reset} (Tools → Secrets)`);
  console.log(`  ${colors.yellow}4. ⬜ Production Environment${colors.reset} (Vercel/Railway/etc.)`);
  console.log(`  ${colors.yellow}5. ⬜ Redeploy if needed${colors.reset}\n`);
}

function main() {
  if (!existsSync(ENV_EXAMPLE_FILE)) {
    console.log(`${colors.gray}No .env.example file found - skipping check${colors.reset}`);
    return;
  }
  
  const diff = getGitDiff();
  
  if (!diff) {
    // No changes to .env.example
    return;
  }
  
  const changes = extractVarsFromDiff(diff);
  
  if (changes.added.length === 0 && changes.removed.length === 0) {
    // Only comment changes
    return;
  }
  
  printBanner('🔔 ENVIRONMENT VARIABLES CHANGED!');
  
  if (changes.added.length > 0) {
    console.log(`${colors.green}${colors.bright}NEW Variables Added:${colors.reset}`);
    changes.added.forEach(v => console.log(`  ${colors.green}+ ${v}${colors.reset}`));
    console.log('');
  }
  
  if (changes.removed.length > 0) {
    console.log(`${colors.red}${colors.bright}Variables Removed:${colors.reset}`);
    changes.removed.forEach(v => console.log(`  ${colors.red}- ${v}${colors.reset}`));
    console.log('');
  }
  
  printChecklist();
  
  console.log(`${colors.cyan}${'━'.repeat(60)}${colors.reset}\n`);
}

main();

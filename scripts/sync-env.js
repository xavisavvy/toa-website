#!/usr/bin/env node
/**
 * Environment File Synchronization Script
 * 
 * Ensures .env and .env.docker stay in sync by:
 * 1. Checking if all keys in .env.example exist in both files
 * 2. Warning about missing keys
 * 3. Optionally syncing keys (without values for security)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ENV_EXAMPLE = path.join(rootDir, '.env.example');
const ENV_LOCAL = path.join(rootDir, '.env');
const ENV_DOCKER = path.join(rootDir, '.env.docker');

// Parse env file into key-value pairs
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { keys: new Set(), lines: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const keys = new Set();

  lines.forEach(line => {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) return;
    
    // Extract key from KEY=VALUE
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match) {
      keys.add(match[1]);
    }
  });

  return { keys, lines };
}

// Get all keys from .env.example (template)
function getTemplateKeys() {
  const { keys } = parseEnvFile(ENV_EXAMPLE);
  return keys;
}

// Check sync status
function checkSync() {
  console.log('🔍 Checking environment file synchronization...\n');

  const template = parseEnvFile(ENV_EXAMPLE);
  const local = parseEnvFile(ENV_LOCAL);
  const docker = parseEnvFile(ENV_DOCKER);

  let hasIssues = false;

  // Check .env
  const missingInLocal = [...template.keys].filter(key => !local.keys.has(key));
  if (missingInLocal.length > 0) {
    hasIssues = true;
    console.log('⚠️  Missing keys in .env:');
    missingInLocal.forEach(key => console.log(`   - ${key}`));
    console.log('');
  }

  // Check .env.docker
  const missingInDocker = [...template.keys].filter(key => !docker.keys.has(key));
  if (missingInDocker.length > 0) {
    hasIssues = true;
    console.log('⚠️  Missing keys in .env.docker:');
    missingInDocker.forEach(key => console.log(`   - ${key}`));
    console.log('');
  }

  // Check for extra keys not in template
  const extraInLocal = [...local.keys].filter(key => !template.keys.has(key));
  if (extraInLocal.length > 0) {
    console.log('ℹ️  Extra keys in .env (not in template):');
    extraInLocal.forEach(key => console.log(`   - ${key}`));
    console.log('');
  }

  const extraInDocker = [...docker.keys].filter(key => !template.keys.has(key));
  if (extraInDocker.length > 0) {
    console.log('ℹ️  Extra keys in .env.docker (not in template):');
    extraInDocker.forEach(key => console.log(`   - ${key}`));
    console.log('');
  }

  if (!hasIssues) {
    console.log('✅ All environment files are in sync!\n');
  } else {
    console.log('💡 Run `npm run env:sync` to automatically add missing keys\n');
    process.exit(1);
  }
}

// Sync missing keys from template to target file
function syncFile(targetPath, templateKeys, existingContent) {
  const { keys: existingKeys } = parseEnvFile(targetPath);
  const missingKeys = [...templateKeys].filter(key => !existingKeys.has(key));

  if (missingKeys.length === 0) {
    console.log(`✅ ${path.basename(targetPath)} is up to date`);
    return;
  }

  console.log(`📝 Adding ${missingKeys.length} missing keys to ${path.basename(targetPath)}:`);
  missingKeys.forEach(key => console.log(`   + ${key}`));

  // Read template to get comments and structure
  const templateContent = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
  const templateLines = templateContent.split('\n');

  let newContent = existingContent;
  let currentSection = '';
  let sectionContent = '';

  // Add a marker to show auto-added keys
  newContent += '\n# ============================================\n';
  newContent += '# AUTO-SYNCED FROM .env.example\n';
  newContent += `# Added: ${new Date().toISOString()}\n`;
  newContent += '# ============================================\n\n';

  templateLines.forEach(line => {
    const trimmed = line.trim();
    
    // Track sections
    if (trimmed.startsWith('# ===')) {
      if (sectionContent) {
        newContent += sectionContent;
        sectionContent = '';
      }
      currentSection = line;
      return;
    }

    // Check if this line has a key we need
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match && missingKeys.includes(match[1])) {
      // Add section header if we have one
      if (currentSection && !sectionContent) {
        sectionContent += currentSection + '\n';
        currentSection = '';
      }

      // Add comment lines that come before this key
      if (trimmed.startsWith('#') && !trimmed.startsWith('# ===')) {
        sectionContent += line + '\n';
      } else {
        // Add the key with a placeholder value
        sectionContent += `${match[1]}=\n`;
      }
    } else if (trimmed.startsWith('#') && !trimmed.startsWith('# ===') && sectionContent) {
      // Add comments within a section
      sectionContent += line + '\n';
    }
  });

  if (sectionContent) {
    newContent += sectionContent;
  }

  fs.writeFileSync(targetPath, newContent);
  console.log(`✅ ${path.basename(targetPath)} updated successfully\n`);
}

// Main sync function
function sync() {
  console.log('🔄 Synchronizing environment files...\n');

  const templateKeys = getTemplateKeys();
  
  // Sync .env
  if (fs.existsSync(ENV_LOCAL)) {
    const localContent = fs.readFileSync(ENV_LOCAL, 'utf-8');
    syncFile(ENV_LOCAL, templateKeys, localContent);
  } else {
    console.log('⚠️  .env file not found. Creating from template...');
    fs.copyFileSync(ENV_EXAMPLE, ENV_LOCAL);
    console.log('✅ Created .env from .env.example\n');
  }

  // Sync .env.docker
  if (fs.existsSync(ENV_DOCKER)) {
    const dockerContent = fs.readFileSync(ENV_DOCKER, 'utf-8');
    syncFile(ENV_DOCKER, templateKeys, dockerContent);
  } else {
    console.log('⚠️  .env.docker file not found. Creating from template...');
    fs.copyFileSync(ENV_EXAMPLE, ENV_DOCKER);
    console.log('✅ Created .env.docker from .env.example\n');
  }

  console.log('✅ Environment file synchronization complete!');
  console.log('⚠️  Remember to fill in the values for newly added keys\n');
}

// CLI
const command = process.argv[2];

if (command === 'check') {
  checkSync();
} else if (command === 'sync') {
  sync();
} else {
  console.log('Usage:');
  console.log('  npm run env:check  - Check if env files are in sync');
  console.log('  npm run env:sync   - Add missing keys to env files');
  process.exit(1);
}

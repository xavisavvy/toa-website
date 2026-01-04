#!/usr/bin/env node
/**
 * Pre-commit checks to catch common errors
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const errors = [];

// Common incorrect imports to check for
const commonMistakes = [
  {
    pattern: /import\s+.*useNavigate.*from\s+['"]wouter['"]/g,
    message: 'Wouter does not export useNavigate. Use useLocation instead.',
    fix: 'Replace: import { useNavigate } from "wouter"\nWith: import { useLocation } from "wouter"\nThen use: const [, setLocation] = useLocation();'
  },
  {
    pattern: /useNavigate\s*\(/g,
    file: /\.tsx?$/,
    message: 'useNavigate() is from react-router, not wouter. Use setLocation from useLocation() instead.'
  }
];

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  
  for (const mistake of commonMistakes) {
    if (mistake.pattern.test(content)) {
      errors.push({
        file: filePath,
        message: mistake.message,
        fix: mistake.fix
      });
    }
  }
}

function walkDir(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'build'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Check all TypeScript/JavaScript files
const files = walkDir('.');
files.forEach(checkFile);

if (errors.length > 0) {
  console.error('\n❌ Found common coding mistakes:\n');
  errors.forEach(({ file, message, fix }) => {
    console.error(`📁 ${file}`);
    console.error(`   ⚠️  ${message}`);
    if (fix) {
      console.error(`   💡 ${fix}`);
    }
    console.error('');
  });
  process.exit(1);
} else {
  console.log('✅ No common mistakes found');
}

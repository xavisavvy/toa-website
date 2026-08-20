#!/usr/bin/env node

/**
 * Create Admin User Script
 * 
 * Security: Creates admin accounts securely via CLI
 * Usage: npm run create-admin
 * 
 * This script:
 * - Prompts for email and password
 * - Validates input
 * - Hashes password with bcrypt
 * - Creates admin user in database
 */

import * as readline from 'readline';

import { createUser } from '../server/auth.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function questionHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(query);
    
    // Hide input
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char: string) => {
      char = char.toString();
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          // Enter key pressed
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          // Ctrl+C
          process.exit();
          break;
        case '\u007f':
        case '\b':
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          // Any other character
          password += char;
          stdout.write('*');
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}

async function main() {
  console.info('🔐 Create Admin User');
  console.info('===================\n');

  try {
    // Get email
    const email = await question('Admin email: ');
    
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    // Get password (hidden)
    const password = await questionHidden('Password (min 8 chars): ');
    
    if (!password || password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters');
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await questionHidden('Confirm password: ');

    // Not a secret-guessing comparison (both values are typed locally by the
    // same operator in this CLI session), so a constant-time check has no
    // security benefit here — plain equality is intentional.
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (password !== confirmPassword) {
      console.error('\n❌ Passwords do not match');
      process.exit(1);
    }

    console.info('\n⏳ Creating admin user...');

    // Create admin user
    const user = await createUser(email, password, 'admin');

    console.info('\n✅ Admin user created successfully!');
    console.info(`   Email: ${user.email}`);
    console.info(`   Role: ${user.role}`);
    console.info(`   ID: ${user.id}\n`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    rl.close();
    process.exit(1);
  }
}

main();

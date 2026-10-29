#!/usr/bin/env node

/**
 * Create Admin User - Direct PostgreSQL Connection
 * Works with local PostgreSQL (not Neon serverless)
 *
 * Usage: ADMIN_PASSWORD=... [ADMIN_EMAIL=...] npx tsx scripts/create-admin-direct.ts
 * Without ADMIN_PASSWORD a random password is generated and printed once.
 */

import { randomBytes } from 'crypto';

import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/toa_website';

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@talesofaneria.com';
  // Never hard-code this: the repository is public. Take it from the
  // environment, or generate a one-off password and print it once.
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString('base64url');
  if (password.length < 12) {
    console.error('❌ ADMIN_PASSWORD must be at least 12 characters');
    process.exit(1);
  }
  const role = 'admin';

  console.info('🔐 Creating Admin User...\n');
  console.info(`   Database: ${DATABASE_URL.split('@')[1]}\n`);

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    // Connect to database
    await client.connect();
    console.info('✅ Connected to database');

    // Hash password
    console.info('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    console.info('💾 Creating admin user...');
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 1, NOW(), NOW())
       RETURNING id, email, role, created_at`,
      [email.toLowerCase().trim(), passwordHash, role]
    );

    const user = result.rows[0];

    console.info('\n✅ Admin user created successfully!\n');
    console.info(`   Email: ${user.email}`);
    console.info(`   Role: ${user.role}`);
    console.info(`   ID: ${user.id}`);
    console.info(`   Created: ${user.created_at}\n`);
    if (generated) {
      console.info(`   Generated password (shown once): ${password}\n`);
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    
    if (error.code === '23505') {
      console.error('   User with this email already exists!\n');
    }
    
    await client.end();
    process.exit(1);
  }
}

main();

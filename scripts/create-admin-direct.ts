#!/usr/bin/env node

/**
 * Create Admin User - Direct PostgreSQL Connection
 * Works with local PostgreSQL (not Neon serverless)
 */

import pkg from 'pg';
const { Client } = pkg;
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/toa_website';

async function main() {
  const email = 'admin@talesofaneria.com';
  const password = 'X8w79LuizWuXj2DP8AX!';
  const role = 'admin';

  console.log('🔐 Creating Admin User...\n');
  console.log(`   Database: ${DATABASE_URL.split('@')[1]}\n`);

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    console.log('💾 Creating admin user...');
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 1, NOW(), NOW())
       RETURNING id, email, role, created_at`,
      [email.toLowerCase().trim(), passwordHash, role]
    );

    const user = result.rows[0];

    console.log('\n✅ Admin user created successfully!\n');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.created_at}\n`);

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

#!/usr/bin/env node

/**
 * Quick Admin User Creation (Non-interactive)
 * Usage: tsx scripts/create-admin-quick.ts
 */

import { createUser } from '../server/auth.js';

async function main() {
  const email = 'admin@talesofaneria.com';
  const password = 'X8w79LuizWuXj2DP8AX!';
  const role = 'admin';

  console.log('🔐 Creating Admin User...\n');

  try {
    const user = await createUser(email, password, role);

    console.log('✅ Admin user created successfully!\n');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

main();

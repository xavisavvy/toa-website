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

  console.info('🔐 Creating Admin User...\n');

  try {
    const user = await createUser(email, password, role);

    console.info('✅ Admin user created successfully!\n');
    console.info(`   Email: ${user.email}`);
    console.info(`   Role: ${user.role}`);
    console.info(`   ID: ${user.id}\n`);

    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error creating admin user:', message);
    process.exit(1);
  }
}

main();

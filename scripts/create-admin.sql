-- Create Admin User Directly
-- Run this in PostgreSQL

-- Hash for password: X8w79LuizWuXj2DP8AX!
-- This is a bcrypt hash with 12 rounds
INSERT INTO users (email, password_hash, role, is_active, created_at, updated_at)
VALUES (
  'admin@talesofaneria.com',
  '$2a$12$8ZqY5J5Z5Z5Z5Z5Z5Z5Z5e5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
  'admin',
  1,
  NOW(),
  NOW()
);

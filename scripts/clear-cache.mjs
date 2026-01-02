#!/usr/bin/env node
/**
 * Manual cache clearing utility for YouTube data
 * Run this script to clear cached YouTube playlist/channel data
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '..', 'server', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'youtube-playlist.json');

console.log('🧹 YouTube Cache Cleaner\n');

// Check if cache file exists
if (!fs.existsSync(CACHE_FILE)) {
  console.log('✅ No cache file found. Cache is already empty.');
  console.log(`   Checked: ${CACHE_FILE}\n`);
  process.exit(0);
}

// Read cache file to show what's being deleted
try {
  const stats = fs.statSync(CACHE_FILE);
  const content = fs.readFileSync(CACHE_FILE, 'utf-8');
  const cache = JSON.parse(content);
  const keys = Object.keys(cache);
  
  console.log('📊 Current Cache Contents:');
  console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Cached items: ${keys.length}`);
  
  if (keys.length > 0) {
    console.log('   Cache keys:');
    keys.forEach(key => {
      const entry = cache[key];
      const age = Date.now() - entry.timestamp;
      const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
      console.log(`     - ${key} (${entry.videos?.length || 0} videos, ${ageHours}h old)`);
    });
  }
  
  console.log('');
  
  // Delete the cache file
  fs.unlinkSync(CACHE_FILE);
  console.log('✅ Cache cleared successfully!');
  console.log(`   Deleted: ${CACHE_FILE}\n`);
  
} catch (error) {
  console.error('❌ Error clearing cache:', error.message);
  console.error('   You may need to manually delete:', CACHE_FILE);
  process.exit(1);
}

console.log('💡 Next Steps:');
console.log('   1. Cache will rebuild on next API request');
console.log('   2. Check that latest code is deployed');
console.log('   3. Verify environment variables are set');
console.log('');

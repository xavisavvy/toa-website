#!/usr/bin/env node
/**
 * YouTube API Quota Monitor
 * 
 * Estimates your daily YouTube API quota usage based on cache and traffic.
 * Run this to see if you're at risk of hitting quota limits.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, '..', 'server', 'cache', 'youtube-playlist.json');

// YouTube API v3 Quota Costs
const QUOTA_COSTS = {
  'search.list': 100,      // Channel search
  'videos.list': 1,        // Video details (per 50 videos)
  'playlistItems.list': 1, // Playlist items (per 50 videos)
};

const DAILY_QUOTA_LIMIT = 10000; // Default YouTube API quota

console.log('📊 YouTube API Quota Monitor\n');
console.log('═══════════════════════════════════════════════════\n');

// Check cache status
if (!fs.existsSync(CACHE_FILE)) {
  console.log('⚠️  No cache file found.');
  console.log('   Cache will be created on first API request.\n');
  
  console.log('📈 Estimated First Request Costs:');
  console.log(`   Channel search (1 request):  ${QUOTA_COSTS['search.list']} units`);
  console.log(`   Video details (1 request):   ${QUOTA_COSTS['videos.list']} units`);
  console.log(`   Total first request:         ${QUOTA_COSTS['search.list'] + QUOTA_COSTS['videos.list']} units`);
  console.log('');
  
  console.log('💡 With 24-hour caching, you\'ll make ~1-2 requests/day');
  console.log(`   Daily usage: ~${(QUOTA_COSTS['search.list'] + QUOTA_COSTS['videos.list']) * 2} units`);
  console.log(`   That's only ${((((QUOTA_COSTS['search.list'] + QUOTA_COSTS['videos.list']) * 2) / DAILY_QUOTA_LIMIT) * 100).toFixed(1)}% of your ${DAILY_QUOTA_LIMIT} daily quota!\n`);
  
  process.exit(0);
}

try {
  const stats = fs.statSync(CACHE_FILE);
  const content = fs.readFileSync(CACHE_FILE, 'utf-8');
  const cache = JSON.parse(content);
  const keys = Object.keys(cache);
  
  console.log('📦 Current Cache Status:');
  console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Cached items: ${keys.length}`);
  console.log('');
  
  let totalVideos = 0;
  
  keys.forEach(key => {
    const entry = cache[key];
    const age = Date.now() - entry.timestamp;
    const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
    const timeUntilExpiry = 24 - parseFloat(ageHours);
    const videos = entry.videos?.length || 0;
    totalVideos += videos;
    
    console.log(`   🔑 ${key}`);
    console.log(`      Videos: ${videos}`);
    console.log(`      Age: ${ageHours}h`);
    console.log(`      Expires in: ${timeUntilExpiry.toFixed(1)}h`);
    console.log('');
  });
  
  // Estimate costs
  console.log('💰 Quota Cost Breakdown:');
  console.log('');
  
  console.log('   Per API Request:');
  console.log(`   • Channel search:        ${QUOTA_COSTS['search.list']} units`);
  console.log(`   • Video details (${totalVideos} videos): ${Math.ceil(totalVideos / 50)} units`);
  console.log(`   • Total per refresh:     ${QUOTA_COSTS['search.list'] + Math.ceil(totalVideos / 50)} units`);
  console.log('');
  
  const quotaPerRefresh = QUOTA_COSTS['search.list'] + Math.ceil(totalVideos / 50);
  const estimatedDailyRequests = 2; // With 24h cache, usually 1-2 requests/day
  const estimatedDailyQuota = quotaPerRefresh * estimatedDailyRequests;
  const percentOfQuota = (estimatedDailyQuota / DAILY_QUOTA_LIMIT) * 100;
  
  console.log('   Daily Estimates (with 24h caching):');
  console.log(`   • API requests/day:      ~${estimatedDailyRequests}`);
  console.log(`   • Quota usage/day:       ~${estimatedDailyQuota} units`);
  console.log(`   • % of daily quota:      ${percentOfQuota.toFixed(1)}%`);
  console.log(`   • Remaining quota:       ${DAILY_QUOTA_LIMIT - estimatedDailyQuota} units`);
  console.log('');
  
  // Safety assessment
  console.log('🛡️  Security Assessment:');
  console.log('');
  
  if (percentOfQuota < 10) {
    console.log('   ✅ EXCELLENT - Very low quota usage');
    console.log('      Your caching strategy is working great!');
  } else if (percentOfQuota < 25) {
    console.log('   ✅ GOOD - Moderate quota usage');
    console.log('      Well within safe limits.');
  } else if (percentOfQuota < 50) {
    console.log('   ⚠️  MODERATE - Higher quota usage');
    console.log('      Consider increasing cache duration.');
  } else {
    console.log('   🚨 HIGH - Risky quota usage');
    console.log('      Increase cache duration or reduce requests!');
  }
  console.log('');
  
  // Recommendations
  console.log('💡 Recommendations:');
  console.log('');
  console.log('   1. ✅ Keep 24-hour caching enabled');
  console.log('   2. Set daily quota limit to 5,000 units in Google Cloud Console');
  console.log('   3. Set up alerts at 80% quota usage (4,000 units)');
  console.log('   4. Restrict API key to YouTube Data API v3 only');
  console.log('   5. Rotate API key every 90 days');
  console.log('');
  
  console.log('🔗 Quick Links:');
  console.log('   Google Cloud Console: https://console.cloud.google.com/apis/credentials');
  console.log('   Quota Usage: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas');
  console.log('');
  
} catch (error) {
  console.error('❌ Error reading cache:', error.message);
  process.exit(1);
}

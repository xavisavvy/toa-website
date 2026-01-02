#!/usr/bin/env node

/**
 * GitHub Actions Cache Cleanup Script
 * 
 * Deletes GitHub Actions caches to free up storage space.
 * 
 * Usage:
 *   node scripts/cleanup-github-caches.js [options]
 * 
 * Options:
 *   --all                Delete ALL caches (use with caution!)
 *   --older-than-days N  Delete caches older than N days (default: 1)
 *   --branch NAME        Delete caches from specific branch only
 *   --dry-run            Show what would be deleted without deleting
 *   --keep-latest N      Keep N most recent caches per branch (default: 2)
 * 
 * Examples:
 *   # Delete caches older than 1 day (safe default)
 *   node scripts/cleanup-github-caches.js
 * 
 *   # Delete all caches from last 24 hours (dry run)
 *   node scripts/cleanup-github-caches.js --older-than-days 1 --dry-run
 * 
 *   # Delete all caches except 2 most recent
 *   node scripts/cleanup-github-caches.js --all --keep-latest 2
 * 
 *   # Delete caches from specific branch
 *   node scripts/cleanup-github-caches.js --branch main --older-than-days 7
 * 
 * Requires:
 *   - GitHub CLI (gh) installed and authenticated
 *   OR
 *   - GITHUB_TOKEN environment variable set
 */

const { execSync } = require('child_process');
const { exit } = require('process');

// Parse command line arguments
const args = process.argv.slice(2);

function getArgValue(argName) {
  const index = args.indexOf(argName);
  if (index === -1 || index === args.length - 1) return null;
  const value = args[index + 1];
  if (value.startsWith('--')) return null;
  return value;
}

const options = {
  all: args.includes('--all'),
  dryRun: args.includes('--dry-run'),
  olderThanDays: parseFloat(getArgValue('--older-than-days')) || 1,
  branch: getArgValue('--branch'),
  keepLatest: parseInt(getArgValue('--keep-latest')) || 2,
};

console.log('🧹 GitHub Actions Cache Cleanup\n');
console.log('Options:', options, '\n');

// Check if GitHub CLI is available
let useGhCli = false;
try {
  execSync('gh --version', { stdio: 'ignore' });
  useGhCli = true;
  console.log('✅ Using GitHub CLI (gh)\n');
} catch (error) {
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ Error: GitHub CLI not found and GITHUB_TOKEN not set');
    console.error('');
    console.error('Please either:');
    console.error('  1. Install GitHub CLI: https://cli.github.com/');
    console.error('  2. Or set GITHUB_TOKEN environment variable');
    console.error('');
    console.error('Example:');
    console.error('  export GITHUB_TOKEN=ghp_your_token_here');
    console.error('  node scripts/cleanup-github-caches.js');
    exit(1);
  }
  console.log('⚠️  GitHub CLI not found, using API with GITHUB_TOKEN\n');
}

// Get repository info
let owner, repo;
try {
  const remoteUrl = execSync('git config --get remote.origin.url', { 
    encoding: 'utf8' 
  }).trim();
  
  const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  if (match) {
    owner = match[1];
    repo = match[2];
  } else {
    throw new Error('Could not parse repository info');
  }
} catch (error) {
  console.error('❌ Error: Could not determine repository info');
  console.error('Make sure you are in a git repository with GitHub remote');
  exit(1);
}

console.log(`📦 Repository: ${owner}/${repo}\n`);

/**
 * Fetch all caches using GitHub CLI
 */
function fetchCachesWithCLI() {
  const caches = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    try {
      const output = execSync(
        `gh api repos/${owner}/${repo}/actions/caches?per_page=${perPage}&page=${page}`,
        { encoding: 'utf8' }
      );
      
      const data = JSON.parse(output);
      
      if (!data.actions_caches || data.actions_caches.length === 0) {
        break;
      }
      
      caches.push(...data.actions_caches);
      console.log(`📄 Fetched page ${page}: ${data.actions_caches.length} caches`);
      page++;
      
      // Check if we've reached the last page
      if (data.actions_caches.length < perPage) {
        break;
      }
    } catch (error) {
      console.error('❌ Error fetching caches:', error.message);
      exit(1);
    }
  }
  
  return caches;
}

/**
 * Fetch all caches using GitHub API
 */
async function fetchCachesWithAPI() {
  const caches = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/caches?per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.actions_caches || data.actions_caches.length === 0) {
        break;
      }
      
      caches.push(...data.actions_caches);
      page++;
      
      // Check if we've reached the last page
      if (data.actions_caches.length < perPage) {
        break;
      }
    } catch (error) {
      console.error('❌ Error fetching caches:', error.message);
      exit(1);
    }
  }
  
  return caches;
}

/**
 * Delete a cache by ID
 */
function deleteCacheWithCLI(cacheId) {
  try {
    execSync(
      `gh api --method DELETE repos/${owner}/${repo}/actions/caches/${cacheId}`,
      { stdio: 'ignore' }
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete a cache by ID using API
 */
async function deleteCacheWithAPI(cacheId) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/caches/${cacheId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Main cleanup logic
 */
async function cleanupCaches() {
  // Fetch all caches
  console.log('📥 Fetching caches...\n');
  const caches = useGhCli 
    ? fetchCachesWithCLI() 
    : await fetchCachesWithAPI();
  
  if (caches.length === 0) {
    console.log('✨ No caches found!');
    return;
  }
  
  console.log(`📊 Found ${caches.length} total caches\n`);
  
  // Calculate total size
  const totalSize = caches.reduce((sum, cache) => sum + cache.size_in_bytes, 0);
  const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
  console.log(`💾 Total cache size: ${totalSizeGB} GB\n`);
  
  // Filter caches based on options
  let cachesToDelete = caches;
  
  // Filter by branch
  if (options.branch) {
    cachesToDelete = cachesToDelete.filter(cache => cache.ref === `refs/heads/${options.branch}`);
    console.log(`🔍 Filtered to branch '${options.branch}': ${cachesToDelete.length} caches\n`);
  }
  
  // Filter by age
  if (!options.all) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - options.olderThanDays);
    
    cachesToDelete = cachesToDelete.filter(cache => {
      const cacheDate = new Date(cache.created_at);
      return cacheDate < cutoffDate;
    });
    
    console.log(`📅 Filtered to caches older than ${options.olderThanDays} day(s): ${cachesToDelete.length} caches\n`);
  }
  
  // Keep N most recent caches per branch
  if (options.keepLatest > 0) {
    const cachesByBranch = new Map();
    
    // Group caches by branch
    caches.forEach(cache => {
      const branch = cache.ref;
      if (!cachesByBranch.has(branch)) {
        cachesByBranch.set(branch, []);
      }
      cachesByBranch.get(branch).push(cache);
    });
    
    // Sort each branch's caches by creation date (newest first)
    cachesByBranch.forEach((branchCaches, branch) => {
      branchCaches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });
    
    // Identify caches to keep
    const cachesToKeep = new Set();
    cachesByBranch.forEach((branchCaches, branch) => {
      branchCaches.slice(0, options.keepLatest).forEach(cache => {
        cachesToKeep.add(cache.id);
      });
    });
    
    // Filter out caches to keep
    cachesToDelete = cachesToDelete.filter(cache => !cachesToKeep.has(cache.id));
    
    console.log(`🔒 Keeping ${options.keepLatest} most recent cache(s) per branch\n`);
    console.log(`🗑️  ${cachesToDelete.length} caches will be deleted\n`);
  }
  
  if (cachesToDelete.length === 0) {
    console.log('✨ No caches to delete!');
    return;
  }
  
  // Show what will be deleted
  console.log('📋 Caches to be deleted:\n');
  cachesToDelete.forEach((cache, index) => {
    const sizeGB = (cache.size_in_bytes / 1024 / 1024 / 1024).toFixed(3);
    const age = Math.floor((Date.now() - new Date(cache.created_at)) / (1000 * 60 * 60 * 24));
    console.log(`  ${index + 1}. ${cache.key}`);
    console.log(`     Size: ${sizeGB} GB | Age: ${age} day(s) | Branch: ${cache.ref}`);
  });
  
  const deleteSizeGB = (
    cachesToDelete.reduce((sum, cache) => sum + cache.size_in_bytes, 0) / 1024 / 1024 / 1024
  ).toFixed(2);
  
  console.log(`\n💾 Total space to free: ${deleteSizeGB} GB\n`);
  
  // Dry run check
  if (options.dryRun) {
    console.log('🔍 DRY RUN - No caches were actually deleted');
    console.log('Remove --dry-run flag to perform actual deletion');
    return;
  }
  
  // Confirm deletion
  console.log('⚠️  WARNING: This will permanently delete the caches listed above!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Delete caches
  console.log('🗑️  Deleting caches...\n');
  
  let deleted = 0;
  let failed = 0;
  
  for (const cache of cachesToDelete) {
    const success = useGhCli 
      ? deleteCacheWithCLI(cache.id)
      : await deleteCacheWithAPI(cache.id);
    
    if (success) {
      deleted++;
      const sizeGB = (cache.size_in_bytes / 1024 / 1024 / 1024).toFixed(3);
      console.log(`✅ Deleted: ${cache.key} (${sizeGB} GB)`);
    } else {
      failed++;
      console.log(`❌ Failed: ${cache.key}`);
    }
    
    // Rate limiting: wait 100ms between deletions
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Deleted: ${deleted} caches`);
  console.log(`   ❌ Failed: ${failed} caches`);
  console.log(`   💾 Space freed: ${deleteSizeGB} GB (estimated)`);
  console.log(`\n✨ Cache cleanup complete!`);
}

// Run cleanup
cleanupCaches().catch(error => {
  console.error('❌ Fatal error:', error);
  exit(1);
});

#!/usr/bin/env node
/**
 * Clear AutoHeal Cache - Forces AI healing on next run
 *
 * This script deletes the persistent cache file to ensure
 * that your next test run will trigger AI healing and show
 * actual token usage in reports.
 */

const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, 'autoheal-cache');
const cacheFile = path.join(cacheDir, 'selectors.json');

console.log('🗑️  AutoHeal Cache Clearer');
console.log('=' .repeat(50));

try {
  if (fs.existsSync(cacheFile)) {
    fs.unlinkSync(cacheFile);
    console.log('✅ Deleted cache file:', cacheFile);
  } else {
    console.log('ℹ️  No cache file found at:', cacheFile);
  }

  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    if (files.length === 0) {
      console.log('✅ Cache directory is empty');
    } else {
      console.log(`ℹ️  ${files.length} file(s) remaining in cache directory`);
    }
  } else {
    console.log('ℹ️  No cache directory found');
  }

  console.log('\n✨ Cache cleared! Next test run will use AI healing.');
  console.log('   This will show actual token usage in reports.\n');
} catch (error) {
  console.error('❌ Error clearing cache:', error.message);
  process.exit(1);
}

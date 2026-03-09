/**
 * Playwright Parallel Test Suite for AutoHeal
 *
 * This test demonstrates:
 * 1. How AutoHeal handles parallel test execution
 * 2. Cache behavior with concurrent tests
 * 3. Performance with multiple tests running simultaneously
 *
 * Run with: npx playwright test tests/playwright-parallel.spec.ts --workers=3
 */

import { test, expect, Browser, Page } from '@playwright/test';
import { AutoHealLocator, ExecutionStrategy, CacheType } from '../src';

// Test configuration
const TEST_URL = 'https://www.saucedemo.com';
const USERNAME = 'standard_user';
const PASSWORD = 'secret_sauce';

/**
 * Test 1: Each test creates its own AutoHeal instance
 * CACHE ISOLATION: Each test has its own cache (no sharing)
 */
test.describe('Parallel Tests - Isolated Instances', () => {
  test('Test 1: Login with user 1 @parallel', async ({ page }) => {
    console.log(`🧪 [Test 1] Starting at ${new Date().toISOString()}`);

    // Create AutoHeal instance for this test
    const autoHeal = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withAIProvider('gemini')
      .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
      .withConfiguration({
        cache: {
          type: CacheType.MEMORY, // Memory cache - isolated per instance
          maxSize: 100,
          expireAfterWriteMs: 60000
        }
      })
      .build();

    await page.goto(TEST_URL);

    console.log(`🔍 [Test 1] Finding username field...`);
    const username = await autoHeal.find(
      page,
      page.locator('#user-name'),
      'Username input field'
    );
    await username.fill(USERNAME);

    console.log(`🔍 [Test 1] Finding password field...`);
    const password = await autoHeal.find(
      page,
      page.locator('#password'),
      'Password input field'
    );
    await password.fill(PASSWORD);

    console.log(`🔍 [Test 1] Finding login button...`);
    const loginBtn = await autoHeal.find(
      page,
      page.locator('#login-button'),
      'Login button'
    );
    await loginBtn.click();

    // Verify login success
    await expect(page).toHaveURL(/.*inventory.html/);

    // Show cache metrics
    const metrics = autoHeal.getCacheMetrics();
    console.log(`📊 [Test 1] Cache Metrics:`, {
      hits: metrics.hitCount,
      misses: metrics.missCount,
      hitRate: `${(metrics.hitRate * 100).toFixed(2)}%`
    });

    autoHeal.shutdown();
    console.log(`✅ [Test 1] Completed at ${new Date().toISOString()}`);
  });

  test('Test 2: Login with user 2 @parallel', async ({ page }) => {
    console.log(`🧪 [Test 2] Starting at ${new Date().toISOString()}`);

    const autoHeal = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withAIProvider('gemini')
      .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
      .withConfiguration({
        cache: {
          type: CacheType.MEMORY,
          maxSize: 100,
          expireAfterWriteMs: 60000
        }
      })
      .build();

    await page.goto(TEST_URL);

    console.log(`🔍 [Test 2] Finding username field...`);
    const username = await autoHeal.find(
      page,
      page.locator('#user-name'),
      'Username input field'
    );
    await username.fill(USERNAME);

    console.log(`🔍 [Test 2] Finding password field...`);
    const password = await autoHeal.find(
      page,
      page.locator('#password'),
      'Password input field'
    );
    await password.fill(PASSWORD);

    console.log(`🔍 [Test 2] Finding login button...`);
    const loginBtn = await autoHeal.find(
      page,
      page.locator('#login-button'),
      'Login button'
    );
    await loginBtn.click();

    await expect(page).toHaveURL(/.*inventory.html/);

    const metrics = autoHeal.getCacheMetrics();
    console.log(`📊 [Test 2] Cache Metrics:`, {
      hits: metrics.hitCount,
      misses: metrics.missCount,
      hitRate: `${(metrics.hitRate * 100).toFixed(2)}%`
    });

    autoHeal.shutdown();
    console.log(`✅ [Test 2] Completed at ${new Date().toISOString()}`);
  });

  test('Test 3: Browse products @parallel', async ({ page }) => {
    console.log(`🧪 [Test 3] Starting at ${new Date().toISOString()}`);

    const autoHeal = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withAIProvider('gemini')
      .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
      .withConfiguration({
        cache: {
          type: CacheType.MEMORY,
          maxSize: 100,
          expireAfterWriteMs: 60000
        }
      })
      .build();

    await page.goto(TEST_URL);

    // Login first
    console.log(`🔍 [Test 3] Logging in...`);
    const username = await autoHeal.find(page, page.locator('#user-name'), 'Username');
    await username.fill(USERNAME);

    const password = await autoHeal.find(page, page.locator('#password'), 'Password');
    await password.fill(PASSWORD);

    const loginBtn = await autoHeal.find(page, page.locator('#login-button'), 'Login button');
    await loginBtn.click();

    await page.waitForURL(/.*inventory.html/);

    // Browse products
    console.log(`🔍 [Test 3] Finding product title...`);
    const title = await autoHeal.find(
      page,
      page.locator('.title'),
      'Products page title'
    );
    await expect(title).toHaveText('Products');

    const metrics = autoHeal.getCacheMetrics();
    console.log(`📊 [Test 3] Cache Metrics:`, {
      hits: metrics.hitCount,
      misses: metrics.missCount,
      hitRate: `${(metrics.hitRate * 100).toFixed(2)}%`
    });

    autoHeal.shutdown();
    console.log(`✅ [Test 3] Completed at ${new Date().toISOString()}`);
  });
});

/**
 * Test 2: Shared AutoHeal instance with PERSISTENT FILE CACHE
 * CACHE SHARING: All tests share the same file cache
 * NOTE: This demonstrates potential cache collision issues
 */
test.describe('Parallel Tests - Shared File Cache', () => {
  let sharedAutoHeal: AutoHealLocator;

  test.beforeAll(async ({ browser }) => {
    console.log('\n🔧 Setting up SHARED AutoHeal with FILE cache...\n');

    // Create a temporary page for initialization
    const context = await browser.newContext();
    const page = await context.newPage();

    sharedAutoHeal = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withAIProvider('gemini')
      .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
      .withConfiguration({
        cache: {
          type: CacheType.PERSISTENT_FILE, // SHARED file cache
          cacheDirectory: './autoheal-cache-parallel-test',
          maxSize: 1000,
          expireAfterWriteMs: 300000 // 5 minutes
        }
      })
      .build();

    // Clear cache before tests
    sharedAutoHeal.clearCache();
    console.log('🗑️  Cache cleared before parallel tests\n');

    await context.close();
  });

  test.afterAll(() => {
    if (sharedAutoHeal) {
      const metrics = sharedAutoHeal.getCacheMetrics();
      console.log('\n📊 FINAL SHARED CACHE METRICS:', {
        totalEntries: metrics.totalEntries,
        hits: metrics.hitCount,
        misses: metrics.missCount,
        hitRate: `${(metrics.hitRate * 100).toFixed(2)}%`
      });
      sharedAutoHeal.shutdown();
    }
  });

  test('Shared Test 1: Login flow @shared', async ({ page }) => {
    console.log(`🧪 [Shared-1] Starting at ${new Date().toISOString()}`);
    await page.goto(TEST_URL);

    const username = await sharedAutoHeal.find(page, page.locator('#user-name'), 'Username shared');
    await username.fill(USERNAME);

    const password = await sharedAutoHeal.find(page, page.locator('#password'), 'Password shared');
    await password.fill(PASSWORD);

    const loginBtn = await sharedAutoHeal.find(page, page.locator('#login-button'), 'Login shared');
    await loginBtn.click();

    await expect(page).toHaveURL(/.*inventory.html/);
    console.log(`✅ [Shared-1] Completed at ${new Date().toISOString()}`);
  });

  test('Shared Test 2: Another login @shared', async ({ page }) => {
    console.log(`🧪 [Shared-2] Starting at ${new Date().toISOString()}`);
    await page.goto(TEST_URL);

    // Same elements - should hit cache!
    const username = await sharedAutoHeal.find(page, page.locator('#user-name'), 'Username shared');
    await username.fill(USERNAME);

    const password = await sharedAutoHeal.find(page, page.locator('#password'), 'Password shared');
    await password.fill(PASSWORD);

    const loginBtn = await sharedAutoHeal.find(page, page.locator('#login-button'), 'Login shared');
    await loginBtn.click();

    await expect(page).toHaveURL(/.*inventory.html/);
    console.log(`✅ [Shared-2] Completed at ${new Date().toISOString()}`);
  });

  test('Shared Test 3: Third login @shared', async ({ page }) => {
    console.log(`🧪 [Shared-3] Starting at ${new Date().toISOString()}`);
    await page.goto(TEST_URL);

    const username = await sharedAutoHeal.find(page, page.locator('#user-name'), 'Username shared');
    await username.fill(USERNAME);

    const password = await sharedAutoHeal.find(page, page.locator('#password'), 'Password shared');
    await password.fill(PASSWORD);

    const loginBtn = await sharedAutoHeal.find(page, page.locator('#login-button'), 'Login shared');
    await loginBtn.click();

    await expect(page).toHaveURL(/.*inventory.html/);
    console.log(`✅ [Shared-3] Completed at ${new Date().toISOString()}`);
  });
});

/**
 * Test 3: Performance comparison - Cache disabled vs enabled
 */
test.describe('Performance Tests - Cache Impact', () => {
  test('No Cache: Login test @nocache', async ({ page }) => {
    console.log(`🧪 [No-Cache] Starting at ${new Date().toISOString()}`);
    const startTime = Date.now();

    const autoHeal = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withAIProvider('gemini')
      .withStrategy(ExecutionStrategy.DOM_ONLY)
      .withConfiguration({
        cache: {
          type: CacheType.MEMORY,
          maxSize: 0, // Effectively disabling cache
          expireAfterWriteMs: 1
        }
      })
      .build();

    await page.goto(TEST_URL);

    const username = await autoHeal.find(page, page.locator('#user-name'), 'Username nocache');
    await username.fill(USERNAME);

    const password = await autoHeal.find(page, page.locator('#password'), 'Password nocache');
    await password.fill(PASSWORD);

    const loginBtn = await autoHeal.find(page, page.locator('#login-button'), 'Login nocache');
    await loginBtn.click();

    await expect(page).toHaveURL(/.*inventory.html/);

    const duration = Date.now() - startTime;
    console.log(`⏱️  [No-Cache] Duration: ${duration}ms`);

    autoHeal.shutdown();
  });

  test('With Cache: Login test @withcache', async ({ page }) => {
    console.log(`🧪 [With-Cache] Starting at ${new Date().toISOString()}`);
    const startTime = Date.now();

    const autoHeal = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withAIProvider('gemini')
      .withStrategy(ExecutionStrategy.DOM_ONLY)
      .withConfiguration({
        cache: {
          type: CacheType.MEMORY,
          maxSize: 1000,
          expireAfterWriteMs: 60000
        }
      })
      .build();

    await page.goto(TEST_URL);

    // First attempt - will cache
    const username = await autoHeal.find(page, page.locator('#user-name'), 'Username withcache');
    await username.fill(USERNAME);

    const password = await autoHeal.find(page, page.locator('#password'), 'Password withcache');
    await password.fill(PASSWORD);

    const loginBtn = await autoHeal.find(page, page.locator('#login-button'), 'Login withcache');
    await loginBtn.click();

    await expect(page).toHaveURL(/.*inventory.html/);

    const duration = Date.now() - startTime;
    const metrics = autoHeal.getCacheMetrics();
    console.log(`⏱️  [With-Cache] Duration: ${duration}ms`);
    console.log(`📊 [With-Cache] Metrics:`, metrics);

    autoHeal.shutdown();
  });
});

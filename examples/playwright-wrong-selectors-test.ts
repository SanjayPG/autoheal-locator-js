/**
 * Example: Testing AutoHeal with Intentionally Wrong Selectors
 *
 * This demonstrates how AutoHeal automatically fixes broken selectors
 */

import { chromium, Browser, Page, expect } from '@playwright/test';
import { AutoHealLocator, ExecutionStrategy } from '../src';

async function main() {
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  // Create AutoHeal instance for Playwright
  const autoHeal = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withAIProvider('gemini') // Using Gemini for AI healing
    .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL) // DOM first, fallback to Visual
    .build();

  // Clear cache to force AI healing
  console.log('🗑️  Clearing cache to force AI healing...');
  autoHeal.clearCache();

  try {
    // Navigate to test site
    await page.goto('https://www.saucedemo.com');

    console.log('\n=== Test 1: Wrong ID selector (will be healed) ===');
    // WRONG: #username-field (doesn't exist)
    // RIGHT: #user-name
    const usernameLocator = await autoHeal.find(
      page,
      '#username-field', // ❌ WRONG selector on purpose!
      'Username input field'
    );
    // Use the healed locator with Playwright's expect
    await expect(usernameLocator).toBeVisible();
    await usernameLocator.fill('standard_user');
    console.log('✅ Username field found and filled!');

    console.log('\n=== Test 2: Wrong class selector (will be healed) ===');
    // WRONG: .password-input (doesn't exist)
    // RIGHT: #password
    const passwordLocator = await autoHeal.find(
      page,
      '.password-input', // ❌ WRONG selector on purpose!
      'Password input field'
    );
    await expect(passwordLocator).toBeVisible();
    await passwordLocator.fill('secret_sauce');
    console.log('✅ Password field found and filled!');

    console.log('\n=== Test 3: Wrong button selector (will be healed) ===');
    // WRONG: button.submit-btn (doesn't exist)
    // RIGHT: #login-button
    const submitButton = await autoHeal.find(
      page,
      'button.submit-btn', // ❌ WRONG selector on purpose!
      'Login submit button'
    );
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    console.log('✅ Submit button found and clicked!');

    // Wait for navigation
    await page.waitForTimeout(2000);

    console.log('\n=== Test 4: Wrong heading selector (will be healed) ===');
    // WRONG: h1.page-title (doesn't exist)
    // RIGHT: .title
    const heading = await autoHeal.find(
      page,
      'h1.page-title', // ❌ WRONG selector on purpose!
      'Products page heading'
    );
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Products');
    console.log('✅ Heading found and verified!');

    console.log('\n=== Test 5: Wrong checkbox/button selector (will be healed) ===');
    // WRONG: input[type="checkbox"][name="subscribe"] (doesn't exist)
    // RIGHT: [data-test="add-to-cart-sauce-labs-backpack"]
    const addToCartButton = await autoHeal.find(
      page,
      'button.add-to-cart-backpack', // ❌ WRONG selector on purpose!
      'Add to cart button for Backpack product'
    );
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
    console.log('✅ Add to cart button found and clicked!');

    console.log('\n=== Test 6: Verify cart badge updated ===');
    const cartBadge = await autoHeal.find(
      page,
      '.cart-count', // ❌ WRONG selector (actual: .shopping_cart_badge)
      'Shopping cart badge showing item count'
    );
    await expect(cartBadge).toBeVisible();
    await expect(cartBadge).toHaveText('1');
    console.log('✅ Cart badge verified!');

    // Display cache and healing metrics
    console.log('\n=== Cache Metrics ===');
    const metrics = autoHeal.getCacheMetrics();
    console.log(`Hit Rate: ${(metrics.hitRate * 100).toFixed(2)}%`);
    console.log(`Total Entries: ${metrics.totalEntries}`);
    console.log(`Hits: ${metrics.hitCount}, Misses: ${metrics.missCount}`);

    console.log('\n✅ All tests passed! AutoHeal successfully healed all broken selectors!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    autoHeal.shutdown();
  }
}

// Run the example
main().catch(console.error);

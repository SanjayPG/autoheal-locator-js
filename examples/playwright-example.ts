/**
 * Example: Using AutoHeal with Playwright (JavaScript/TypeScript)
 *
 * This demonstrates how to use AutoHeal with Playwright for self-healing tests
 */

import { chromium, Browser, Page } from 'playwright';
import { AutoHealLocator, ExecutionStrategy } from '../src';

async function main() {
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  // Create AutoHeal instance for Playwright
  const autoHeal = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withAIProvider('gemini') // or 'openai', 'anthropic'
    .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
    .build();

  try {
    // Navigate to test site
    await page.goto('https://www.saucedemo.com');

    console.log('=== Example 1: Simple selector ===');
    // Find username input - AutoHeal will try original selector first,
    // then cache, then AI healing if needed
    const usernameLocator = await autoHeal.find(page, '#user-name', 'Username input field');
    await usernameLocator.fill('standard_user');

    console.log('=== Example 2: Password field ===');
    const passwordLocator = await autoHeal.find(page, '#password123', 'Password input field');
    await passwordLocator.fill('secret_sauce');

    console.log('=== Example 3: Submit button ===');
    const loginButton = await autoHeal.find(page, '#login-button', 'Login button');
    await loginButton.click();

    // Wait for navigation
    await page.waitForTimeout(2000);

    console.log('=== Example 4: Product title ===');
    // This selector might break in the future - AutoHeal will fix it automatically
    const productTitle = await autoHeal.find(page, '.title', 'Products page title');
    const titleText = await productTitle.textContent();
    console.log(`Found title: ${titleText}`);

    console.log('=== Example 5: Add to cart button ===');
    // Find "Add to cart" button for first product
    const addToCartButton = await autoHeal.find(
      page,
      '[data-test="add-to-cart-sauce-labs-backpack"]',
      'Add to cart button for Backpack'
    );
    await addToCartButton.click();

    console.log('=== Example 6: Shopping cart badge ===');
    const cartBadge = await autoHeal.find(page, '.shopping_cart_badge', 'Shopping cart badge');
    const badgeText = await cartBadge.textContent();
    console.log(`Cart items: ${badgeText}`);

    // Display cache metrics
    console.log('\n=== Cache Metrics ===');
    const metrics = autoHeal.getCacheMetrics();
    console.log(`Hit Rate: ${(metrics.hitRate * 100).toFixed(2)}%`);
    console.log(`Total Entries: ${metrics.totalEntries}`);
    console.log(`Hits: ${metrics.hitCount}, Misses: ${metrics.missCount}`);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    autoHeal.shutdown();
  }
}

// Run the example
main().catch(console.error);

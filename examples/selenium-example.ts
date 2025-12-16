/**
 * Example: Using AutoHeal with Selenium WebDriver (JavaScript/TypeScript)
 *
 * This demonstrates how to use AutoHeal with Selenium for self-healing tests
 */

import { Builder, WebDriver } from 'selenium-webdriver';
import { AutoHealLocator, ExecutionStrategy } from '../src';

async function main() {
  const driver: WebDriver = await new Builder().forBrowser('chrome').build();

  // Create AutoHeal instance for Selenium
  const autoHeal = AutoHealLocator.builder()
    .withSeleniumDriver(driver)
    .withAIProvider('gemini') // Default: gemini-1.5-flash-latest
    // Switch to Groq: .withAIProvider('groq')
    // Override model: .withAIProvider('gemini', undefined, 'gemini-2.0-flash-exp')
    .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
    .build();

  // Clear cache to force AI healing (useful for testing token usage)
  console.log('🗑️  Clearing cache to force AI healing...');
  autoHeal.clearCache();

  try {
    // Navigate to test site
    await driver.get('https://www.saucedemo.com');

    console.log('=== Example 1: Find by ID (auto-detected) ===');
    // AutoHeal auto-detects that 'user-name' is an ID
    const usernameElement = await autoHeal.findElement('user-name', 'Username input field');
    await usernameElement.sendKeys('standard_user');

    console.log('=== Example 2: Find by CSS selector ===');
    const passwordElement = await autoHeal.findElement('#password123', 'Password input field');
    await passwordElement.sendKeys('secret_sauce');

    console.log('=== Example 3: Find by ID for button ===');
    const loginButton = await autoHeal.findElement('login-button', 'Login button');
    await loginButton.click();

    // Wait for page load
    await driver.sleep(2000);

    console.log('=== Example 4: Find by CSS selector ===');
    // This selector might break - AutoHeal will heal it automatically
    const productTitle = await autoHeal.findElement('.title', 'Products page title');
    const titleText = await productTitle.getText();
    console.log(`Found title: ${titleText}`);

    console.log('=== Example 5: Find by data attribute ===');
    const addToCartButton = await autoHeal.findElement(
      '[data-test="add-to-cart-sauce-labs-backpack"]',
      'Add to cart button'
    );
    await addToCartButton.click();

    console.log('=== Example 6: Find multiple elements ===');
    const productNames = await autoHeal.findElements('.inventory_item_name', 'Product names');
    console.log(`Found ${productNames.length} products`);
    for (const product of productNames.slice(0, 3)) {
      const name = await product.getText();
      console.log(`  - ${name}`);
    }

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
    await driver.quit();
    autoHeal.shutdown();
  }
}

// Run the example
main().catch(console.error);

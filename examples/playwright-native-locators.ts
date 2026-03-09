/**
 * Example: Using AutoHeal with Playwright's Native Locators
 *
 * This demonstrates how to use Playwright's getByRole(), getByText(), etc.
 * directly with AutoHeal for automatic healing
 */

import { chromium, Browser, Page } from 'playwright';
import { AutoHealLocator, ExecutionStrategy } from '../src';

async function main() {
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  // Create AutoHeal instance for Playwright
  const autoHeal = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withAIProvider('gemini')
    .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
    .build();

     // Clear cache to force AI healing (useful for testing token usage)
  console.log('🗑️  Clearing cache to force AI healing...');
  autoHeal.clearCache();

  try {
    // Navigate to test site
    await page.goto('https://www.saucedemo.com');

    console.log('\n=== Example 1: Using getByRole() with AutoHeal ===');
    // Pass Playwright's native Locator object directly!
    const usernameLocator = await autoHeal.find(
      page,
      page.getByRole('textbox', { name: 'Username' }),  // ✅ Native Playwright Locator
      'Username input field'
    );
    await usernameLocator.fill('standard_user');
    console.log('✅ Username field found!');

    console.log('\n=== Example 2: Using getByPlaceholder() with AutoHeal ===');
    const passwordLocator = await autoHeal.find(
      page,
      page.getByRole('textbox', { name: 'Password1234' }),  // ✅ Native Playwright Locator (intentionally wrong name)
      'Password input field'
    );
    await passwordLocator.fill('secret_sauce');
    console.log('✅ Password field found!');

    console.log('\n=== Example 3: Using getByRole() for button ===');
    const loginButton = await autoHeal.find(
      page,
      page.getByRole('button', { name: 'submit' }),  // ✅ Native Playwright Locator
      'Login submit button'
    );
    await loginButton.click();
    console.log('✅ Login button found and clicked!');

    // Wait for navigation
    await page.waitForTimeout(2000);

    console.log('\n=== Example 4: Using getByText() ===');
    const productsText = await autoHeal.find(
      page,
      page.getByText('Products'),  // ✅ Native Playwright Locator
      'Products page heading'
    );
    const textContent = await productsText.textContent();
    console.log(`✅ Products heading found: "${textContent}"`);

    // console.log('\n=== Example 5: Using CSS selector (still works) ===');
    // const addToCartButton = await autoHeal.find(
    //   page,
    //   '[data-test="add-to-cart-sauce-labs-backpack"]',  // ✅ String selector also works
    //   'Add to cart button'
    // );
    // await addToCartButton.click();
    // console.log('✅ Add to cart button found!');

    // console.log('\n=== Example 6: Using cart badge ===');
    // const cartBadge = await autoHeal.find(
    //   page,
    //   page.locator('.shopping_cart_badge'),  // ✅ Any Playwright locator method works
    //   'Shopping cart badge'
    // );
    // const badgeText = await cartBadge.textContent();
    // console.log(`✅ Cart badge verified: ${badgeText}`);

    console.log('\n✅ All tests passed! AutoHeal works with native Playwright locators!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    autoHeal.shutdown();
  }
}

// Run the example
main().catch(console.error);

/**
 * Example: Using AutoHeal with Playwright Native Locators
 *
 * This demonstrates how to use AutoHeal with Playwright's native locator methods
 * like getByRole, getByText, getByTestId, etc.
 */

import { chromium, Browser, Page } from 'playwright';
import { AutoHealLocator, ExecutionStrategy } from '../src';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  // Create AutoHeal instance for Playwright
  const autoHeal = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withAIProvider('gemini') // or 'openai', 'anthropic'
    .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
    .build();

  // Clear cache to force AI healing (useful for testing token usage)
  console.log('🗑️  Clearing cache to force AI healing...');
  autoHeal.clearCache();

  try {
    // Navigate to test site
    console.log('\n=== Navigating to Rahul Shetty Academy Login Page ===');
    await page.goto('https://rahulshettyacademy.com/loginpagePractise/');

    console.log('\n=== Test 1: Finding username field using getByRole (with wrong role name) ===');
    // Using Playwright's native getByRole locator wrapped with AutoHeal
    // Note: The role name 'email' is intentionally wrong to demonstrate AutoHeal
    const username = await autoHeal.find(
      page,
      page.getByRole('textbox', { name: 'email' }),
      'username input field'
    );
    await username.fill('testuser');
    console.log('✅ Username field found and filled!');

    console.log('\n=== Test 2: Finding password field using getByRole (with wrong role name) ===');
    const password = await autoHeal.find(
      page,
      page.getByRole('textbox', { name: 'Password123' }),
      'Password input field'
    );
    await password.fill('testpass');
    console.log('✅ Password field found and filled!');

    console.log('\n=== Test 3: Finding sign in button using getByRole (with wrong button name) ===');
    const signInButton = await autoHeal.find(
      page,
      page.getByRole('button', { name: 'Log In' }),
      'Sign In button'
    );
    await signInButton.click();
    console.log('✅ Sign in button found and clicked!');

    // Allow any client-side response
    await page.waitForTimeout(1000);

    // Verify we're still on the login page (invalid credentials)
    const currentUrl = page.url();
    if (currentUrl.includes('loginpagePractise')) {
      console.log('✅ Test passed: Remained on login page as expected (invalid credentials)');
    } else {
      console.log(`❌ Unexpected navigation to: ${currentUrl}`);
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
    await browser.close();
    // Generate AutoHeal reports
    autoHeal.shutdown('./autoheal-reports');
    console.log('📊 AutoHeal reports generated in ./autoheal-reports');
  }
}

// Run the example
main().catch(console.error);

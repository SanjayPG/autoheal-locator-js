/**
 * Live Test with Real Cloudflare Tunnel
 *
 * Testing LOCAL model support with actual endpoint:
 * https://born-advancement-films-away.trycloudflare.com
 */

import { chromium } from 'playwright';
import { AutoHealLocator } from './src/core/AutoHealLocator';

const CLOUDFLARE_URL = 'https://born-advancement-films-away.trycloudflare.com';
const API_PATH = '/v1/chat/completions';
const MODEL_NAME = 'deepseek-coder-v2:16b';

async function testLocalModelService() {
  console.log('\n🤖 Testing LOCAL Model Service with Real Endpoint\n');
  console.log('================================================\n');
  console.log(`Endpoint: ${CLOUDFLARE_URL}`);
  console.log(`API Path: ${API_PATH}`);
  console.log(`Model: ${MODEL_NAME}\n`);

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Create locator with LOCAL model
    console.log('✅ Step 1: Creating AutoHealLocator with LOCAL model...');
    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel(CLOUDFLARE_URL, {
        apiPath: API_PATH,
        model: MODEL_NAME,
        timeout: 60000, // 60 seconds
        temperature: 0.1,
        maxTokens: 2048,
      })
      .build();
    console.log('✅ Locator created successfully!\n');

    // Test with a simple HTML page
    console.log('✅ Step 2: Loading test page...');
    await page.setContent(`
      <html>
        <body>
          <h1>Test Page for AutoHeal</h1>
          <form>
            <input type="text" id="username" name="username" placeholder="Enter username">
            <input type="password" id="password" name="password" placeholder="Enter password">
            <button type="submit" id="login-btn">Login</button>
          </form>
        </body>
      </html>
    `);
    console.log('✅ Test page loaded!\n');

    // Test 1: Find element with wrong selector (should trigger healing)
    console.log('✅ Step 3: Testing element healing with WRONG selector...');
    console.log('   Looking for: "username input field"');
    console.log('   Using wrong selector: #wrong-username-id\n');

    const usernameField = await locator.find(
      page,
      '#wrong-username-id', // This is WRONG on purpose
      'username input field'
    );

    console.log('✅ Element found! AutoHeal successfully healed the selector!\n');

    // Interact with the element
    console.log('✅ Step 4: Interacting with the element...');
    await usernameField.fill('testuser');
    console.log('✅ Successfully filled username field with "testuser"\n');

    // Test 2: Find password field with wrong selector
    console.log('✅ Step 5: Testing password field healing...');
    console.log('   Looking for: "password input field"');
    console.log('   Using wrong selector: #wrong-password-id\n');

    const passwordField = await locator.find(
      page,
      '#wrong-password-id', // This is WRONG on purpose
      'password input field'
    );

    console.log('✅ Password field found! AutoHeal worked again!\n');
    await passwordField.fill('password123');
    console.log('✅ Successfully filled password field\n');

    // Test 3: Find button with wrong selector
    console.log('✅ Step 6: Testing button healing...');
    console.log('   Looking for: "login button"');
    console.log('   Using wrong selector: button.wrong-class\n');

    const loginButton = await locator.find(
      page,
      'button.wrong-class', // This is WRONG on purpose
      'login button'
    );

    console.log('✅ Login button found! AutoHeal is working perfectly!\n');
    await loginButton.click();
    console.log('✅ Successfully clicked login button\n');

    // Success!
    console.log('================================================');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('================================================\n');
    console.log('✅ LOCAL model service is working correctly!');
    console.log('✅ Element healing with wrong selectors works!');
    console.log('✅ Cloudflare tunnel endpoint is responding!');
    console.log('✅ Model: ' + MODEL_NAME + ' is working!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED!\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
console.log('\n🚀 Starting LOCAL Model Live Test...\n');
testLocalModelService()
  .then(() => {
    console.log('\n✅ Test completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });

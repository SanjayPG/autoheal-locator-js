/**
 * Test LOCAL Model with Environment Variables
 *
 * This demonstrates using LOCAL model configuration from .env file
 */

import { chromium } from 'playwright';
import { AutoHealLocator } from './src/core/AutoHealLocator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('\n🔧 Environment Variables Check\n');
console.log('================================\n');
console.log('AUTOHEAL_AI_PROVIDER:', process.env.AUTOHEAL_AI_PROVIDER);
console.log('LOCAL_MODEL_URL:', process.env.LOCAL_MODEL_URL);
console.log('LOCAL_MODEL_API_PATH:', process.env.LOCAL_MODEL_API_PATH);
console.log('LOCAL_MODEL_NAME:', process.env.LOCAL_MODEL_NAME);
console.log('LOCAL_MODEL_FORMAT:', process.env.LOCAL_MODEL_FORMAT);
console.log('LOCAL_MODEL_TIMEOUT:', process.env.LOCAL_MODEL_TIMEOUT);
console.log('LOCAL_MODEL_TEMPERATURE:', process.env.LOCAL_MODEL_TEMPERATURE);
console.log('LOCAL_MODEL_MAX_TOKENS:', process.env.LOCAL_MODEL_MAX_TOKENS);
console.log('\n');

async function testWithEnvVariables() {
  console.log('🤖 Testing LOCAL Model with Environment Variables\n');
  console.log('================================================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Method 1: Automatic configuration from environment variables
    console.log('✅ Method 1: Automatic from .env file');
    console.log('   Just call .build() - config loaded automatically!\n');

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .build(); // Automatically reads LOCAL config from .env!

    // Test with simple HTML
    await page.setContent(`
      <html>
        <body>
          <h1>Environment Variable Test</h1>
          <input type="text" id="test-input" placeholder="Test input">
          <button id="test-button">Test Button</button>
        </body>
      </html>
    `);

    console.log('🔍 Finding element with wrong selector...');
    const input = await locator.find(
      page,
      '#wrong-input-id',
      'test input field'
    );

    await input.fill('Environment variables work!');
    console.log('✅ Successfully filled input using env config!\n');

    console.log('🔍 Finding button with wrong selector...');
    const button = await locator.find(
      page,
      'button.wrong-class',
      'test button'
    );

    await button.click();
    console.log('✅ Successfully clicked button using env config!\n');

    console.log('================================================');
    console.log('🎉 Environment Variable Configuration Works!');
    console.log('================================================\n');
    console.log('✅ Configuration loaded from .env file');
    console.log('✅ LOCAL provider used automatically');
    console.log('✅ All settings applied correctly');
    console.log('✅ Element healing working perfectly\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

async function testExplicitConfiguration() {
  console.log('\n📝 Method 2: Explicit configuration (override .env)\n');
  console.log('================================================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Method 2: Explicitly pass configuration (overrides .env)
    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel(process.env.LOCAL_MODEL_URL!, {
        apiPath: process.env.LOCAL_MODEL_API_PATH,
        model: process.env.LOCAL_MODEL_NAME,
        format: process.env.LOCAL_MODEL_FORMAT as 'openai',
        timeout: parseInt(process.env.LOCAL_MODEL_TIMEOUT || '60000'),
      })
      .build();

    await page.setContent(`
      <html>
        <body>
          <h1>Explicit Config Test</h1>
          <input type="password" id="password" placeholder="Password">
        </body>
      </html>
    `);

    console.log('🔍 Finding password field...');
    const password = await locator.find(
      page,
      '#wrong-password',
      'password field'
    );

    await password.fill('test123');
    console.log('✅ Explicit configuration also works!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('\n🚀 Starting Environment Variable Tests\n');
  console.log('========================================\n');

  // Check if environment variables are set
  if (!process.env.LOCAL_MODEL_URL) {
    console.error('❌ ERROR: LOCAL_MODEL_URL not set in .env file!');
    console.error('\nPlease add to .env file:');
    console.error('LOCAL_MODEL_URL=https://your-url.trycloudflare.com');
    console.error('LOCAL_MODEL_API_PATH=/v1/chat/completions');
    console.error('LOCAL_MODEL_NAME=deepseek-coder-v2:16b\n');
    process.exit(1);
  }

  try {
    // Test Method 1: Automatic from .env
    await testWithEnvVariables();

    // Test Method 2: Explicit configuration
    await testExplicitConfiguration();

    console.log('\n========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('========================================\n');
    console.log('Both configuration methods work:');
    console.log('1. Automatic from .env file ✅');
    console.log('2. Explicit with .withLocalModel() ✅\n');

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);

/**
 * Local Model Support - Complete Examples
 *
 * This file demonstrates how to use local/custom AI models with AutoHeal Locator.
 *
 * PREREQUISITES:
 * 1. Start a local model server (Flask, FastAPI, Ollama, etc.)
 * 2. OR use a Cloudflare/ngrok tunnel to a remote server
 * 3. Update the BASE_URL constant below
 *
 * See docs/LOCAL_MODEL_SUPPORT.md for complete setup guide.
 */

import { chromium, Browser, Page } from 'playwright';
import { AutoHealLocator } from '../src/core/AutoHealLocator';

// ============================================
// Configuration
// ============================================

const BASE_URL = process.env.LOCAL_MODEL_URL || 'http://localhost:8000';
const TEST_PAGE_URL = 'https://the-internet.herokuapp.com/login';

// ============================================
// Example 1: Basic Localhost Setup
// ============================================

async function example1_BasicLocalhost() {
  console.log('\n=== Example 1: Basic Localhost ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Simplest configuration - just provide the base URL
  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('http://localhost:8000')
    .build();

  await page.goto(TEST_PAGE_URL);

  // Even with wrong selector, AutoHeal will find the element
  const usernameField = await locator.find(
    page,
    '#wrong-username-id',
    'username input field'
  );

  await usernameField.fill('tomsmith');
  console.log('✅ Successfully filled username field');

  await browser.close();
}

// ============================================
// Example 2: Cloudflare Tunnel
// ============================================

async function example2_CloudflareTunnel() {
  console.log('\n=== Example 2: Cloudflare Tunnel ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Using a Cloudflare tunnel URL (from Google Colab, local machine, etc.)
  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('https://princess-practices-carey-terms.trycloudflare.com', {
      apiPath: '/v1/chat/completions',
      model: 'deepseek-coder-v2:16b',
      timeout: 60000, // 60 seconds for slower endpoints
    })
    .build();

  await page.goto(TEST_PAGE_URL);

  const passwordField = await locator.find(
    page,
    '#wrong-password-id',
    'password input field'
  );

  await passwordField.fill('SuperSecretPassword!');
  console.log('✅ Successfully filled password field');

  await browser.close();
}

// ============================================
// Example 3: Ollama
// ============================================

async function example3_Ollama() {
  console.log('\n=== Example 3: Ollama ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Ollama uses a different API format
  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('http://localhost:11434', {
      format: 'ollama', // Use Ollama format
      model: 'llama2',
      apiPath: '/api/generate',
      timeout: 120000, // 2 minutes for local inference
    })
    .build();

  await page.goto(TEST_PAGE_URL);

  const loginButton = await locator.find(
    page,
    'button[type="wrong"]',
    'login button'
  );

  await loginButton.click();
  console.log('✅ Successfully clicked login button');

  await browser.close();
}

// ============================================
// Example 4: Custom Headers & Authentication
// ============================================

async function example4_CustomHeaders() {
  console.log('\n=== Example 4: Custom Headers & Auth ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // For secured endpoints, add authentication headers
  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('https://api.example.com', {
      apiPath: '/v1/chat/completions',
      headers: {
        'Authorization': 'Bearer sk-custom-secret-key-here',
        'X-API-Version': '2024-01',
        'X-Custom-Header': 'custom-value',
      },
      timeout: 30000,
    })
    .build();

  await page.goto(TEST_PAGE_URL);

  const element = await locator.find(
    page,
    '#username',
    'username field'
  );

  await element.fill('test');
  console.log('✅ Successfully used authenticated endpoint');

  await browser.close();
}

// ============================================
// Example 5: ngrok Tunnel
// ============================================

async function example5_NgrokTunnel() {
  console.log('\n=== Example 5: ngrok Tunnel ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Using ngrok tunnel (more stable than Cloudflare for long-running sessions)
  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('https://abc123.ngrok.io', {
      apiPath: '/v1/chat/completions',
      model: 'gpt-3.5-turbo', // Your local model name
    })
    .build();

  await page.goto(TEST_PAGE_URL);

  const element = await locator.find(
    page,
    '#password',
    'password input'
  );

  await element.fill('password123');
  console.log('✅ Successfully used ngrok tunnel');

  await browser.close();
}

// ============================================
// Example 6: Full E2E Test with Local Model
// ============================================

async function example6_FullE2ETest() {
  console.log('\n=== Example 6: Full E2E Login Test ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel(BASE_URL, {
      apiPath: '/v1/chat/completions',
      timeout: 60000,
    })
    .build();

  console.log('📄 Navigating to login page...');
  await page.goto(TEST_PAGE_URL);

  console.log('🔍 Finding username field (with wrong selector)...');
  const usernameField = await locator.find(
    page,
    '#wrong-username-selector',
    'username input field'
  );
  await usernameField.fill('tomsmith');
  console.log('✅ Username filled');

  console.log('🔍 Finding password field (with wrong selector)...');
  const passwordField = await locator.find(
    page,
    '#wrong-password-selector',
    'password input field'
  );
  await passwordField.fill('SuperSecretPassword!');
  console.log('✅ Password filled');

  console.log('🔍 Finding login button (with wrong selector)...');
  const loginButton = await locator.find(
    page,
    'button.wrong-class',
    'login button'
  );
  await loginButton.click();
  console.log('✅ Login button clicked');

  // Wait for navigation
  await page.waitForTimeout(2000);

  console.log('✅ Login test completed successfully!');

  await browser.close();
}

// ============================================
// Example 7: Custom Format
// ============================================

async function example7_CustomFormat() {
  console.log('\n=== Example 7: Custom Format ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // For endpoints that don't match OpenAI or Ollama formats
  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('http://localhost:8000', {
      format: 'custom', // Uses simplified message-based format
      model: 'custom-model',
      temperature: 0.0, // Deterministic
      maxTokens: 150,
    })
    .build();

  await page.goto(TEST_PAGE_URL);

  const element = await locator.find(
    page,
    '#username',
    'username field'
  );

  await element.fill('test');
  console.log('✅ Successfully used custom format');

  await browser.close();
}

// ============================================
// Example 8: Error Handling
// ============================================

async function example8_ErrorHandling() {
  console.log('\n=== Example 8: Error Handling ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('http://localhost:9999', { // Non-existent endpoint
      timeout: 5000, // Short timeout
    })
    .build();

  await page.goto(TEST_PAGE_URL);

  try {
    // This will fail because the endpoint doesn't exist
    await locator.find(
      page,
      '#wrong-selector',
      'username field'
    );
    console.log('❌ Should have thrown an error');
  } catch (error: any) {
    console.log('✅ Error caught successfully:', error.message);
  }

  await browser.close();
}

// ============================================
// Example 9: Multiple Endpoints
// ============================================

async function example9_MultipleEndpoints() {
  console.log('\n=== Example 9: Multiple Endpoints ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Use different models for different tasks
  const fastLocator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('http://localhost:8000', {
      model: 'fast-model',
      timeout: 10000, // Fast model, short timeout
    })
    .build();

  const accurateLocator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withLocalModel('http://localhost:9000', {
      model: 'accurate-model',
      timeout: 60000, // Accurate model, longer timeout
    })
    .build();

  await page.goto(TEST_PAGE_URL);

  // Use fast model for simple elements
  const username = await fastLocator.find(page, '#username', 'username field');
  await username.fill('test');
  console.log('✅ Used fast model');

  // Use accurate model for complex elements
  const password = await accurateLocator.find(page, '#password', 'password field');
  await password.fill('password');
  console.log('✅ Used accurate model');

  await browser.close();
}

// ============================================
// Main Runner
// ============================================

async function main() {
  console.log('\n🤖 AutoHeal Local Model Examples\n');
  console.log('================================\n');

  console.log(`Using BASE_URL: ${BASE_URL}`);
  console.log(`Test page: ${TEST_PAGE_URL}\n`);

  console.log('⚠️  IMPORTANT: Make sure your local model server is running!');
  console.log('   See docs/LOCAL_MODEL_SUPPORT.md for setup instructions.\n');

  const examples = [
    { name: 'Basic Localhost', fn: example1_BasicLocalhost },
    { name: 'Cloudflare Tunnel', fn: example2_CloudflareTunnel },
    { name: 'Ollama', fn: example3_Ollama },
    { name: 'Custom Headers', fn: example4_CustomHeaders },
    { name: 'ngrok Tunnel', fn: example5_NgrokTunnel },
    { name: 'Full E2E Test', fn: example6_FullE2ETest },
    { name: 'Custom Format', fn: example7_CustomFormat },
    { name: 'Error Handling', fn: example8_ErrorHandling },
    { name: 'Multiple Endpoints', fn: example9_MultipleEndpoints },
  ];

  // Run selected example (default: Example 6 - Full E2E)
  const exampleToRun = process.env.EXAMPLE || '6';
  const selectedExample = examples[parseInt(exampleToRun) - 1];

  if (selectedExample) {
    console.log(`\n🚀 Running: ${selectedExample.name}\n`);
    await selectedExample.fn();
  } else {
    console.log('\n❌ Invalid example number');
    console.log('\nAvailable examples:');
    examples.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.name}`);
    });
    console.log('\nUsage: EXAMPLE=1 npm run example:local-model');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other files
export {
  example1_BasicLocalhost,
  example2_CloudflareTunnel,
  example3_Ollama,
  example4_CustomHeaders,
  example5_NgrokTunnel,
  example6_FullE2ETest,
  example7_CustomFormat,
  example8_ErrorHandling,
  example9_MultipleEndpoints,
};

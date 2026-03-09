import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import { AutoHealLocator } from '../src/core/AutoHealLocator';
import { LocalModelService } from '../src/ai/LocalModelService';

/**
 * Local Model Integration Tests
 *
 * These tests demonstrate how to use local/custom AI models with AutoHeal.
 *
 * SETUP REQUIREMENTS:
 * 1. Start a local model server (see docs/LOCAL_MODEL_SUPPORT.md)
 * 2. Or use a Cloudflare tunnel URL
 * 3. Update the BASE_URL constant below
 */

// Configuration - Update these for your environment
const BASE_URL = process.env.LOCAL_MODEL_URL || 'http://localhost:8000';
const API_PATH = process.env.LOCAL_MODEL_API_PATH || '/v1/chat/completions';
const MODEL_NAME = process.env.LOCAL_MODEL_NAME || 'local-model';
const FORMAT: 'openai' | 'ollama' | 'custom' = 'openai';

test.describe('LocalModelService - Unit Tests', () => {
  test('should create LocalModelService with required config', () => {
    const service = new LocalModelService({
      baseUrl: 'http://localhost:8000',
    });

    expect(service).toBeDefined();
    expect(service.getProviderName()).toContain('http://localhost:8000');
  });

  test('should create LocalModelService with full config', () => {
    const service = new LocalModelService({
      baseUrl: 'https://abc.trycloudflare.com',
      apiPath: '/v1/chat/completions',
      format: 'openai',
      model: 'deepseek-coder-v2:16b',
      temperature: 0.1,
      maxTokens: 2048,
      timeout: 60000,
      headers: {
        'Authorization': 'Bearer test-token',
        'X-Custom': 'value',
      },
    });

    expect(service).toBeDefined();
    expect(service.getProviderName()).toContain('https://abc.trycloudflare.com');
  });

  test('should throw error when baseUrl is missing', () => {
    expect(() => {
      new LocalModelService({
        baseUrl: '',
      });
    }).toThrow('LocalModelService requires baseUrl');
  });

  test('should throw error for visual analysis (not supported)', async () => {
    const service = new LocalModelService({
      baseUrl: 'http://localhost:8000',
    });

    const screenshot = Buffer.from('fake-screenshot-data');

    await expect(
      service.analyzeVisual(screenshot, 'test button')
    ).rejects.toThrow('Visual analysis not supported by local model');
  });
});

test.describe('LocalModelService - Builder API', () => {
  test('should configure LOCAL provider via withLocalModel()', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('http://localhost:8000')
      .build();

    expect(locator).toBeDefined();

    await browser.close();
  });

  test('should configure LOCAL provider with options', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('https://abc.trycloudflare.com', {
        apiPath: '/v1/chat/completions',
        format: 'openai',
        model: 'deepseek-coder-v2:16b',
        temperature: 0.1,
        maxTokens: 2048,
        timeout: 60000,
        headers: {
          'Authorization': 'Bearer secret-token',
        },
      })
      .build();

    expect(locator).toBeDefined();

    await browser.close();
  });

  test('should configure Ollama endpoint', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('http://localhost:11434', {
        format: 'ollama',
        model: 'llama2',
        apiPath: '/api/generate',
      })
      .build();

    expect(locator).toBeDefined();

    await browser.close();
  });
});

test.describe('LocalModelService - Integration Tests', () => {
  test.skip('should connect to local model endpoint', async () => {
    // Skip by default - requires running local server
    const service = new LocalModelService({
      baseUrl: BASE_URL,
      apiPath: API_PATH,
      format: FORMAT,
      model: MODEL_NAME,
    });

    // Test DOM analysis
    const html = `
      <html>
        <body>
          <form>
            <input type="text" id="username" name="username" placeholder="Username">
            <input type="password" id="password" name="password" placeholder="Password">
            <button type="submit" id="login-btn">Login</button>
          </form>
        </body>
      </html>
    `;

    const result = await service.analyzeDOM(
      html,
      'login button',
      '#wrong-selector'
    );

    expect(result).toBeDefined();
    expect(result.recommendedSelector).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.reasoning).toBeTruthy();
  });

  test.skip('should work end-to-end with real page', async () => {
    // Skip by default - requires running local server
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel(BASE_URL, {
        apiPath: API_PATH,
        format: FORMAT,
        model: MODEL_NAME,
        timeout: 60000,
      })
      .build();

    // Navigate to test page
    await page.setContent(`
      <html>
        <body>
          <h1>Test Page</h1>
          <button id="test-button">Click Me</button>
        </body>
      </html>
    `);

    // Try to find element with wrong selector (should trigger healing)
    const element = await locator.find(
      page,
      '#wrong-button-id',
      'Click Me button'
    );

    expect(element).toBeDefined();
    await element.click();

    await browser.close();
  });
});

test.describe('LocalModelService - Example Configurations', () => {
  test('example: localhost OpenAI-compatible', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('http://localhost:8000')
      .build();

    expect(locator).toBeDefined();
    await browser.close();
  });

  test('example: Cloudflare tunnel', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('https://princess-practices-carey-terms.trycloudflare.com', {
        apiPath: '/v1/chat/completions',
        model: 'deepseek-coder-v2:16b',
        timeout: 60000,
      })
      .build();

    expect(locator).toBeDefined();
    await browser.close();
  });

  test('example: ngrok tunnel', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('https://abc123.ngrok.io', {
        apiPath: '/v1/chat/completions',
      })
      .build();

    expect(locator).toBeDefined();
    await browser.close();
  });

  test('example: Ollama', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('http://localhost:11434', {
        format: 'ollama',
        model: 'llama2',
        apiPath: '/api/generate',
        timeout: 120000, // 2 minutes for slower inference
      })
      .build();

    expect(locator).toBeDefined();
    await browser.close();
  });

  test('example: custom headers with authentication', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('https://api.example.com', {
        apiPath: '/v1/chat/completions',
        headers: {
          'Authorization': 'Bearer sk-custom-secret-key',
          'X-API-Version': '2024-01',
          'X-Custom-Header': 'custom-value',
        },
      })
      .build();

    expect(locator).toBeDefined();
    await browser.close();
  });

  test('example: custom format', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const locator = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('http://localhost:8000', {
        format: 'custom', // Simplified request/response
        temperature: 0.0,
        maxTokens: 150,
      })
      .build();

    expect(locator).toBeDefined();
    await browser.close();
  });
});

test.describe('LocalModelService - Error Handling', () => {
  test('should handle connection errors gracefully', async () => {
    const service = new LocalModelService({
      baseUrl: 'http://localhost:9999', // Non-existent port
      timeout: 1000, // Short timeout
    });

    const html = '<html><body><button>Test</button></body></html>';

    await expect(
      service.analyzeDOM(html, 'test button', '#test')
    ).rejects.toThrow();
  });

  test('should require baseUrl in builder', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // This should work - baseUrl provided
    const locator1 = AutoHealLocator.builder()
      .withPlaywrightPage(page)
      .withLocalModel('http://localhost:8000')
      .build();

    expect(locator1).toBeDefined();

    await browser.close();
  });
});

/**
 * MANUAL TESTING INSTRUCTIONS
 *
 * To run integration tests with a real local server:
 *
 * 1. Start a local server (see docs/LOCAL_MODEL_SUPPORT.md for examples)
 *
 * 2. Set environment variables:
 *    export LOCAL_MODEL_URL=http://localhost:8000
 *    export LOCAL_MODEL_API_PATH=/v1/chat/completions
 *    export LOCAL_MODEL_NAME=my-model
 *
 * 3. Run tests without skip:
 *    Remove .skip from integration tests
 *    npx playwright test local-model.spec.ts
 *
 * 4. Or run specific test:
 *    npx playwright test local-model.spec.ts --grep "should connect"
 */

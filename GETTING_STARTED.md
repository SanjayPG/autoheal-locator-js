# Getting Started with AutoHeal Locator (JavaScript/TypeScript)

## Prerequisites

1. **Node.js**: Version 16 or higher
2. **npm**: Comes with Node.js
3. **AI API Key**: Google Gemini API key (free at https://makersuite.google.com/app/apikey)

---

## Installation & Setup

### Step 1: Navigate to Project
```bash
cd C:\Backup\autoheal-locator-js
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build the Project
```bash
npm run build
```

### Step 4: Set Up Environment Variables
Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your-actual-api-key-here
AUTOHEAL_AI_PROVIDER=GOOGLE_GEMINI
AUTOHEAL_EXECUTION_STRATEGY=SMART_SEQUENTIAL
AUTOHEAL_CACHE_TYPE=PERSISTENT_FILE
```

---

## Running the Examples

### Option 1: Playwright Example (Recommended)

1. Make sure Chromium is installed:
```bash
npx playwright install chromium
```

2. Run the example:
```bash
node dist/examples/playwright-example.js
```

**What it does:**
- Opens https://www.saucedemo.com
- Uses AutoHeal to find and interact with:
  - Username field
  - Password field
  - Login button
  - Product title
  - Add to cart button
  - Shopping cart badge
- Displays cache metrics at the end

### Option 2: Selenium Example

1. Make sure ChromeDriver is available on your PATH, or:
```bash
npm install -g chromedriver
```

2. Run the example:
```bash
node dist/examples/selenium-example.js
```

**What it does:**
- Opens https://www.saucedemo.com
- Uses AutoHeal to find elements with auto-detected locator types
- Demonstrates CSS, ID, and data-attribute selectors
- Shows finding multiple elements
- Displays cache metrics

---

## Using in Your Own Project

### Installation

If you want to use this in another project (after publishing to npm):

```bash
npm install autoheal-locator-js playwright
# or
npm install autoheal-locator-js selenium-webdriver
```

### Playwright Usage

Create a file `my-test.ts`:

```typescript
import { chromium } from 'playwright';
import { AutoHealLocator, ExecutionStrategy } from 'autoheal-locator-js';

async function runTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Create AutoHeal instance
  const autoHeal = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withAIProvider('gemini')
    .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
    .build();

  try {
    // Your test code here
    await page.goto('https://your-website.com');

    const loginButton = await autoHeal.find(page, '#login-btn', 'Login button');
    await loginButton.click();

    console.log('✅ Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    autoHeal.shutdown();
  }
}

runTest();
```

Run it:
```bash
npx ts-node my-test.ts
```

### Selenium Usage

Create a file `my-selenium-test.ts`:

```typescript
import { Builder } from 'selenium-webdriver';
import { AutoHealLocator, ExecutionStrategy } from 'autoheal-locator-js';

async function runTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  const autoHeal = AutoHealLocator.builder()
    .withSeleniumDriver(driver)
    .withAIProvider('gemini')
    .withStrategy(ExecutionStrategy.DOM_ONLY)
    .build();

  try {
    await driver.get('https://your-website.com');

    // AutoHeal auto-detects locator types
    const username = await autoHeal.findElement('username', 'Username field'); // ID
    await username.sendKeys('testuser');

    const submitBtn = await autoHeal.findElement('#submit', 'Submit button'); // CSS
    await submitBtn.click();

    console.log('✅ Test passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await driver.quit();
    autoHeal.shutdown();
  }
}

runTest();
```

---

## Configuration Options

### Execution Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| `DOM_ONLY` | Uses only DOM analysis | Fast, stable UIs. Cheapest option. |
| `SMART_SEQUENTIAL` | Tries DOM first, then Visual | **RECOMMENDED**. Good balance. |
| `PARALLEL` | Runs DOM + Visual together | When speed > cost |
| `VISUAL_FIRST` | Tries Visual first, then DOM | Complex UIs, visual elements |
| `SEQUENTIAL` | Tries DOM, then Visual | Comprehensive coverage |

### Cache Types

| Type | Description | When to Use |
|------|-------------|-------------|
| `MEMORY` | In-memory LRU cache | Fast, but lost on restart |
| `PERSISTENT_FILE` | JSON file on disk | Survives restarts, shareable |

### Example Configuration

```typescript
const autoHeal = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withConfiguration({
    ai: {
      provider: AIProvider.GOOGLE_GEMINI,
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash-exp',
      timeout: 30000,
    },
    cache: {
      type: CacheType.PERSISTENT_FILE,
      maxSize: 5000,
      expireAfterWriteMs: 24 * 60 * 60 * 1000, // 24 hours
      cacheDirectory: './my-cache',
    },
    performance: {
      executionStrategy: ExecutionStrategy.SMART_SEQUENTIAL,
      elementTimeoutMs: 30000,
    },
  })
  .build();
```

---

## Troubleshooting

### Issue: "AI API key is required"
**Solution**: Make sure `.env` file exists with `GEMINI_API_KEY=your-key`

### Issue: "Cannot find module 'playwright'"
**Solution**: Install Playwright: `npm install playwright`

### Issue: "ChromeDriver not found"
**Solution**: Install ChromeDriver: `npm install -g chromedriver`

### Issue: Build errors
**Solution**:
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Examples not working
**Solution**: Check that:
1. You've run `npm run build`
2. Your API key is set
3. You have internet connection
4. The test website (saucedemo.com) is accessible

---

## Verifying Installation

Run this quick test:

```typescript
import { AutoHealLocator } from './src';

console.log('✅ AutoHeal imported successfully!');
console.log('Builder available:', typeof AutoHealLocator.builder === 'function');
```

Save as `test-import.ts` and run:
```bash
npx ts-node test-import.ts
```

---

## Next Steps

1. ✅ Run the provided examples
2. ✅ Try with your own test website
3. ✅ Experiment with different strategies
4. ✅ Monitor cache hit rates
5. ✅ Integrate into your test suite

---

## Support

- **Documentation**: See README.md
- **Examples**: Check `examples/` directory
- **Java Version**: https://github.com/SanjayPG/autoheal-locator
- **Issues**: Create an issue in the repository

---

## Quick Reference Card

```typescript
// Playwright
const autoHeal = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIProvider('gemini')
  .build();

const locator = await autoHeal.find(page, selector, description);

// Selenium
const autoHeal = AutoHealLocator.builder()
  .withSeleniumDriver(driver)
  .withAIProvider('gemini')
  .build();

const element = await autoHeal.findElement(selector, description);
const elements = await autoHeal.findElements(selector, description);

// Utility
autoHeal.clearCache();
const metrics = autoHeal.getCacheMetrics();
autoHeal.shutdown();
```

---

**Happy Testing! 🚀**

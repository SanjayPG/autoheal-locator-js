# Environment Variable Configuration for LOCAL Models

## Overview

The LOCAL model support can be configured in three ways:
1. **Environment Variables** (Recommended for teams)
2. **Builder API** (Code-based configuration)
3. **Configuration Object** (Advanced usage)

This document focuses on environment variable configuration.

---

## Supported Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `LOCAL_MODEL_URL` | Base URL of your endpoint | `https://xyz.trycloudflare.com` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `LOCAL_MODEL_API_PATH` | `/v1/chat/completions` | API endpoint path |
| `LOCAL_MODEL_NAME` | `local-model` | Model name |
| `LOCAL_MODEL_FORMAT` | `openai` | Format: `openai`, `ollama`, `custom` |
| `LOCAL_MODEL_TIMEOUT` | `60000` | Timeout in milliseconds |
| `LOCAL_MODEL_TEMPERATURE` | `0.1` | Temperature (0.0 - 1.0) |
| `LOCAL_MODEL_MAX_TOKENS` | `2048` | Maximum tokens |

### Alternative Prefixes

All variables support alternative prefixes:
- `LOCAL_MODEL_*` (Recommended - short and clear)
- `AUTOHEAL_LOCAL_MODEL_*` (Namespaced)
- `LOCAL_AI_*` (Alternative)

**Examples:**
```bash
# These are all equivalent:
LOCAL_MODEL_URL=https://example.com
AUTOHEAL_LOCAL_MODEL_URL=https://example.com
LOCAL_AI_URL=https://example.com
```

---

## Configuration Methods

### Method 1: Automatic Configuration (Recommended)

The simplest way - just set environment variables and call `.build()`:

**Step 1: Create `.env` file:**
```bash
# .env file
AUTOHEAL_AI_PROVIDER=LOCAL
LOCAL_MODEL_URL=https://born-advancement-films-away.trycloudflare.com
LOCAL_MODEL_API_PATH=/v1/chat/completions
LOCAL_MODEL_NAME=deepseek-coder-v2:16b
LOCAL_MODEL_FORMAT=openai
LOCAL_MODEL_TIMEOUT=60000
```

**Step 2: Use in code:**
```typescript
import { AutoHealLocator } from '@sdetsanjay/autoheal-locator';
import * as dotenv from 'dotenv';

dotenv.config(); // Load .env file

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .build(); // Automatically uses LOCAL config from .env!

// That's it! No need to specify any LOCAL configuration
```

### Method 2: Builder API (Override .env)

Use `.withLocalModel()` to override environment variables:

```typescript
import { AutoHealLocator } from '@sdetsanjay/autoheal-locator';

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel(process.env.LOCAL_MODEL_URL!, {
    apiPath: process.env.LOCAL_MODEL_API_PATH,
    model: process.env.LOCAL_MODEL_NAME,
    timeout: parseInt(process.env.LOCAL_MODEL_TIMEOUT || '60000'),
  })
  .build();
```

### Method 3: Mixed Configuration

Combine environment variables with code overrides:

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel(process.env.LOCAL_MODEL_URL!, {
    // Override timeout for this specific instance
    timeout: 120000, // 2 minutes
    // Other settings come from environment
  })
  .build();
```

---

## Example .env Files

### Localhost OpenAI-Compatible

```bash
# .env
AUTOHEAL_AI_PROVIDER=LOCAL
LOCAL_MODEL_URL=http://localhost:8000
LOCAL_MODEL_API_PATH=/v1/chat/completions
LOCAL_MODEL_NAME=gpt-3.5-turbo
LOCAL_MODEL_FORMAT=openai
LOCAL_MODEL_TIMEOUT=30000
```

### Cloudflare Tunnel

```bash
# .env
AUTOHEAL_AI_PROVIDER=LOCAL
LOCAL_MODEL_URL=https://born-advancement-films-away.trycloudflare.com
LOCAL_MODEL_API_PATH=/v1/chat/completions
LOCAL_MODEL_NAME=deepseek-coder-v2:16b
LOCAL_MODEL_FORMAT=openai
LOCAL_MODEL_TIMEOUT=60000
LOCAL_MODEL_TEMPERATURE=0.1
LOCAL_MODEL_MAX_TOKENS=2048
```

### Ollama

```bash
# .env
AUTOHEAL_AI_PROVIDER=LOCAL
LOCAL_MODEL_URL=http://localhost:11434
LOCAL_MODEL_API_PATH=/api/generate
LOCAL_MODEL_NAME=llama2
LOCAL_MODEL_FORMAT=ollama
LOCAL_MODEL_TIMEOUT=120000
```

### ngrok

```bash
# .env
AUTOHEAL_AI_PROVIDER=LOCAL
LOCAL_MODEL_URL=https://abc123.ngrok.io
LOCAL_MODEL_API_PATH=/v1/chat/completions
LOCAL_MODEL_NAME=custom-model
LOCAL_MODEL_FORMAT=openai
LOCAL_MODEL_TIMEOUT=45000
```

---

## Usage Patterns

### Pattern 1: Team Configuration

Share the same configuration across the team:

**`.env.example` (Committed to git):**
```bash
# Copy to .env and fill in your endpoint
LOCAL_MODEL_URL=https://your-team-endpoint.example.com
LOCAL_MODEL_API_PATH=/v1/chat/completions
LOCAL_MODEL_NAME=team-model
```

**`.env` (Not committed, personal):**
```bash
LOCAL_MODEL_URL=https://born-advancement-films-away.trycloudflare.com
LOCAL_MODEL_API_PATH=/v1/chat/completions
LOCAL_MODEL_NAME=deepseek-coder-v2:16b
```

**Code (Same for everyone):**
```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .build(); // Everyone uses their own .env
```

### Pattern 2: Multi-Environment

Different configurations for dev/staging/prod:

**`.env.development`:**
```bash
LOCAL_MODEL_URL=http://localhost:8000
LOCAL_MODEL_TIMEOUT=30000
```

**`.env.staging`:**
```bash
LOCAL_MODEL_URL=https://staging-model.example.com
LOCAL_MODEL_TIMEOUT=60000
```

**`.env.production`:**
```bash
LOCAL_MODEL_URL=https://prod-model.example.com
LOCAL_MODEL_TIMEOUT=45000
```

**Load based on environment:**
```typescript
import * as dotenv from 'dotenv';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .build();
```

### Pattern 3: Fallback to Cloud Provider

Use LOCAL model if available, fallback to cloud:

```bash
# .env
# Try LOCAL first, fallback to Gemini
LOCAL_MODEL_URL=https://born-advancement-films-away.trycloudflare.com
GEMINI_API_KEY=your-gemini-key-here
```

```typescript
const hasLocalModel = process.env.LOCAL_MODEL_URL;

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page);

if (hasLocalModel) {
  console.log('Using LOCAL model (FREE)');
  locator.withLocalModel(process.env.LOCAL_MODEL_URL!);
} else {
  console.log('Using Gemini (Paid)');
  locator.withAIProvider('gemini');
}

const finalLocator = locator.build();
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests with LOCAL Model

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2

      - name: Install dependencies
        run: npm install

      - name: Run tests with LOCAL model
        env:
          LOCAL_MODEL_URL: ${{ secrets.LOCAL_MODEL_URL }}
          LOCAL_MODEL_API_PATH: /v1/chat/completions
          LOCAL_MODEL_NAME: deepseek-coder-v2:16b
          LOCAL_MODEL_TIMEOUT: 60000
        run: npm test
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  variables:
    LOCAL_MODEL_URL: $CI_LOCAL_MODEL_URL
    LOCAL_MODEL_API_PATH: /v1/chat/completions
    LOCAL_MODEL_NAME: deepseek-coder-v2:16b
  script:
    - npm install
    - npm test
```

### Docker

```dockerfile
# Dockerfile
FROM node:18

WORKDIR /app
COPY . .
RUN npm install

# Environment variables can be passed at runtime
ENV LOCAL_MODEL_URL=""
ENV LOCAL_MODEL_API_PATH="/v1/chat/completions"

CMD ["npm", "test"]
```

**Run with environment:**
```bash
docker run -e LOCAL_MODEL_URL=https://your-url.trycloudflare.com myapp
```

---

## Verification

### Check Environment Variables

```typescript
import * as dotenv from 'dotenv';

dotenv.config();

console.log('Environment Variables:');
console.log('LOCAL_MODEL_URL:', process.env.LOCAL_MODEL_URL);
console.log('LOCAL_MODEL_API_PATH:', process.env.LOCAL_MODEL_API_PATH);
console.log('LOCAL_MODEL_NAME:', process.env.LOCAL_MODEL_NAME);
console.log('LOCAL_MODEL_FORMAT:', process.env.LOCAL_MODEL_FORMAT);
console.log('LOCAL_MODEL_TIMEOUT:', process.env.LOCAL_MODEL_TIMEOUT);
```

### Test Configuration

```bash
# Run test file
npx ts-node test-local-model-env.ts
```

---

## Troubleshooting

### Problem: Variables not loaded

**Solution:**
1. Ensure `.env` file is in project root
2. Call `dotenv.config()` before creating locator
3. Check file is not named `.env.txt` or similar

### Problem: Wrong endpoint used

**Solution:**
1. Check `AUTOHEAL_AI_PROVIDER=LOCAL` is set
2. Verify `LOCAL_MODEL_URL` is defined
3. Check no typos in variable names

### Problem: Timeout too short

**Solution:**
```bash
# Increase timeout for slow endpoints
LOCAL_MODEL_TIMEOUT=120000
```

---

## Best Practices

### ✅ DO

- Use environment variables for configuration
- Commit `.env.example` with documentation
- Add `.env` to `.gitignore`
- Use descriptive model names
- Set appropriate timeouts based on your endpoint

### ❌ DON'T

- Commit `.env` files with secrets to git
- Hardcode URLs in source code
- Use same timeout for all endpoints
- Expose public endpoints without authentication

---

## Security

### Protecting Cloudflare Tunnels

If using public Cloudflare tunnels, add authentication:

```bash
# .env
LOCAL_MODEL_URL=https://your-url.trycloudflare.com
LOCAL_MODEL_HEADERS='{"Authorization":"Bearer secret-token"}'
```

**Note:** Environment variable for headers is not currently supported.
Use builder API instead:

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel(process.env.LOCAL_MODEL_URL!, {
    headers: {
      'Authorization': 'Bearer secret-token',
    },
  })
  .build();
```

---

## Complete Example

```typescript
// test-with-env.ts
import { chromium } from 'playwright';
import { AutoHealLocator } from '@sdetsanjay/autoheal-locator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Automatic configuration from .env
  const locator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .build();

  await page.goto('https://example.com');

  // Use it!
  const element = await locator.find(page, '#selector', 'description');
  await element.click();

  await browser.close();
}

main().catch(console.error);
```

---

## Summary

✅ **Easiest:** Set `LOCAL_MODEL_URL` in `.env` and call `.build()`
✅ **Flexible:** Override specific settings with `.withLocalModel()`
✅ **Team-Friendly:** Share configuration via `.env.example`
✅ **CI/CD Ready:** Use environment variables in pipelines
✅ **Secure:** Keep credentials out of source code

**Next Steps:**
1. Copy `.env.example` to `.env`
2. Fill in your `LOCAL_MODEL_URL`
3. Run tests with `npx ts-node test-local-model-env.ts`
4. Enjoy FREE AI-powered testing! 🚀

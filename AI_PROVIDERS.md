# AI Provider Support in AutoHeal Locator

AutoHeal now supports multiple AI providers for element healing! This document covers how to configure and use different AI providers.

## Supported AI Providers

| Provider | Status | Default Model | API Documentation |
|----------|--------|---------------|-------------------|
| Google Gemini | ✅ Production Ready | `gemini-2.0-flash-exp` | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| OpenAI | ✅ Production Ready | `gpt-4o` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Anthropic (Claude) | ✅ Production Ready | `claude-3-5-sonnet-20241022` | [Anthropic Console](https://console.anthropic.com/) |
| DeepSeek | ✅ Production Ready | `deepseek-chat` | [DeepSeek Platform](https://platform.deepseek.com/) |
| Grok (xAI) | ✅ Production Ready | `grok-beta` | [xAI Console](https://console.x.ai/) |
| Local/Custom | 🔧 Custom Implementation | N/A | Custom implementation required |

---

## Quick Start

### 1. Install Dependencies

No additional dependencies required! All AI providers use the existing `axios` package.

### 2. Get API Keys

Choose your preferred provider and get an API key:
- **Gemini**: https://makersuite.google.com/app/apikey (Free tier available)
- **OpenAI**: https://platform.openai.com/api-keys (Paid)
- **Anthropic**: https://console.anthropic.com/ (Paid)
- **DeepSeek**: https://platform.deepseek.com/ (Paid)
- **Grok**: https://console.x.ai/ (Paid)

### 3. Configure Environment Variables

Create or update your `.env` file:

```bash
# Choose one or more providers
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
GROK_API_KEY=your_grok_key_here

# Set the active provider
AUTOHEAL_AI_PROVIDER=OPENAI  # or GOOGLE_GEMINI, ANTHROPIC, DEEPSEEK, GROK

# Optional: Override default model
AUTOHEAL_AI_MODEL=gpt-4o
AUTOHEAL_AI_TIMEOUT=30000
```

---

## Configuration Methods

### Method 1: Environment Variables (Recommended)

This is the simplest method for switching between providers:

```bash
# .env file
AUTOHEAL_AI_PROVIDER=OPENAI
OPENAI_API_KEY=sk-...
```

```typescript
import { AutoHealLocator } from 'autoheal-locator-js';
import { Page } from 'playwright';

const page: Page = // ... your page
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .build(); // Automatically uses OPENAI from .env

const element = await locator.find(page, '#selector', 'element description');
```

### Method 2: Builder API

Specify the provider programmatically:

```typescript
import { AutoHealLocator } from 'autoheal-locator-js';

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIProvider('openai', 'sk-your-api-key') // provider name and optional API key
  .build();
```

Supported provider names:
- `'gemini'` or `'GOOGLE_GEMINI'`
- `'openai'` or `'OPENAI'`
- `'anthropic'` or `'ANTHROPIC'`
- `'deepseek'` or `'DEEPSEEK'`
- `'grok'` or `'GROK'`

### Method 3: Configuration Object

Full control over all settings:

```typescript
import { AutoHealLocator, AIProvider } from 'autoheal-locator-js';

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withConfiguration({
    ai: {
      provider: AIProvider.ANTHROPIC,
      apiKey: 'your-api-key',
      model: 'claude-3-5-sonnet-20241022',
      timeout: 30000,
      maxRetries: 3,
      visualAnalysisEnabled: true,
    },
  })
  .build();
```

### Method 4: Custom AI Service

For advanced use cases or custom implementations:

```typescript
import { AutoHealLocator, OpenAIService } from 'autoheal-locator-js';

const customAIService = new OpenAIService(
  'your-api-key',
  'gpt-4o', // custom model
  60000     // custom timeout
);

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIService(customAIService)
  .build();
```

---

## Provider-Specific Details

### Google Gemini

**Best for**: Free tier, fast responses, good multimodal support

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIProvider('gemini', process.env.GEMINI_API_KEY)
  .build();
```

**Models**:
- `gemini-2.0-flash-exp` (default) - Latest experimental, fast
- `gemini-1.5-pro` - More capable, slower
- `gemini-1.5-flash` - Balanced speed/quality

**API Endpoint**: `https://generativelanguage.googleapis.com/v1beta`

---

### OpenAI

**Best for**: Highest quality responses, great reasoning

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIProvider('openai', process.env.OPENAI_API_KEY)
  .build();
```

**Models**:
- `gpt-4o` (default) - Best for multimodal tasks
- `gpt-4-turbo` - Fast and capable
- `gpt-3.5-turbo` - Budget option

**API Endpoint**: `https://api.openai.com/v1`

**Features**:
- JSON mode enabled by default for structured responses
- Vision API support for screenshot analysis

---

### Anthropic (Claude)

**Best for**: Long context, careful reasoning, ethical AI

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIProvider('anthropic', process.env.ANTHROPIC_API_KEY)
  .build();
```

**Models**:
- `claude-3-5-sonnet-20241022` (default) - Most capable
- `claude-3-opus-20240229` - Highest intelligence
- `claude-3-haiku-20240307` - Fastest, most cost-effective

**API Endpoint**: `https://api.anthropic.com/v1`

**Features**:
- Excellent at understanding complex HTML structures
- Strong visual analysis capabilities
- High token limits for large DOM trees

---

### DeepSeek

**Best for**: Cost-effective, competitive performance

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIProvider('deepseek', process.env.DEEPSEEK_API_KEY)
  .build();
```

**Models**:
- `deepseek-chat` (default) - General purpose
- `deepseek-coder` - Optimized for code understanding

**API Endpoint**: `https://api.deepseek.com/v1`

---

### Grok (xAI)

**Best for**: Latest xAI technology

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withAIProvider('grok', process.env.GROK_API_KEY)
  .build();
```

**Models**:
- `grok-beta` (default) - Latest Grok model

**API Endpoint**: `https://api.x.ai/v1`

---

## Complete Example

Here's a complete example showing how to switch between providers:

```typescript
import { AutoHealLocator, AIProvider, ExecutionStrategy } from 'autoheal-locator-js';
import { Page } from 'playwright';
import * as dotenv from 'dotenv';

dotenv.config();

async function example(page: Page) {
  // Example 1: Using Gemini (default)
  const geminiLocator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withAIProvider('gemini')
    .withStrategy(ExecutionStrategy.SMART_SEQUENTIAL)
    .build();

  // Example 2: Using OpenAI
  const openaiLocator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withConfiguration({
      ai: {
        provider: AIProvider.OPENAI,
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o',
        timeout: 30000,
      },
    })
    .build();

  // Example 3: Using Anthropic
  const claudeLocator = AutoHealLocator.builder()
    .withPlaywrightPage(page)
    .withAIProvider('anthropic', process.env.ANTHROPIC_API_KEY)
    .build();

  // Use any locator
  const element = await openaiLocator.find(
    page,
    '#wrong-selector',
    'Login button'
  );

  await element.click();
}
```

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required for Gemini |
| `OPENAI_API_KEY` | OpenAI API key | Required for OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required for Anthropic |
| `DEEPSEEK_API_KEY` | DeepSeek API key | Required for DeepSeek |
| `GROK_API_KEY` | Grok API key | Required for Grok |
| `AUTOHEAL_AI_PROVIDER` | Active provider | `GOOGLE_GEMINI` |
| `AUTOHEAL_AI_MODEL` | Model override | Provider default |
| `AUTOHEAL_AI_TIMEOUT` | Request timeout (ms) | `30000` |

---

## Cost Comparison

Approximate costs for 1,000 healing operations (estimated):

| Provider | Model | Cost per 1K operations | Speed |
|----------|-------|------------------------|-------|
| Gemini | gemini-2.0-flash-exp | Free (quota limits) | Fast |
| OpenAI | gpt-4o | $5-10 | Medium |
| OpenAI | gpt-3.5-turbo | $1-2 | Fast |
| Anthropic | claude-3-5-sonnet | $6-12 | Medium |
| Anthropic | claude-3-haiku | $1-2 | Fast |
| DeepSeek | deepseek-chat | $0.50-1 | Fast |
| Grok | grok-beta | $5-10 | Medium |

*Note: Costs vary based on DOM size, screenshot analysis, and actual usage patterns.*

---

## Troubleshooting

### Provider Not Found Error

```
Error: Unsupported AI provider: SOME_PROVIDER
```

**Solution**: Check that you're using one of the supported provider names:
- `GOOGLE_GEMINI`
- `OPENAI`
- `ANTHROPIC`
- `DEEPSEEK`
- `GROK`

### API Key Not Found Error

```
Error: AI API key is required for OPENAI
```

**Solution**:
1. Check your `.env` file exists and is loaded
2. Verify the environment variable name matches: `{PROVIDER}_API_KEY`
3. Ensure the API key is valid and not expired

### Rate Limiting

If you encounter rate limit errors:
1. Add retry logic (built-in with `maxRetries` config)
2. Use a different provider temporarily
3. Upgrade your API plan
4. Implement request throttling

### Model Not Available

If a specific model is unavailable:
1. Check the provider's documentation for current models
2. Use a different model for that provider
3. Update the default model in your configuration

---

## Best Practices

1. **Use Environment Variables**: Keep API keys secure and out of source control
2. **Set Appropriate Timeouts**: DOM analysis is usually fast (< 5s), visual analysis can take longer (10-30s)
3. **Monitor Costs**: Track token usage with the `tokensUsed` field in `AIAnalysisResult`
4. **Cache Aggressively**: AutoHeal's cache reduces AI calls by 70-90% after initial runs
5. **Choose the Right Provider**:
   - Development: Use Gemini (free tier)
   - Production: Consider cost vs. quality trade-offs
   - High-accuracy needs: OpenAI GPT-4o or Claude Sonnet

---

## Migration Guide

### From Gemini-only to Multi-Provider

If you're migrating from a Gemini-only setup:

**Before**:
```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .build(); // Always used Gemini
```

**After** (same code works, but now you can configure):
```bash
# .env
AUTOHEAL_AI_PROVIDER=OPENAI  # Switch to OpenAI
OPENAI_API_KEY=your-key
```

```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .build(); // Now uses OpenAI
```

No code changes required! Just update environment variables.

---

## Contributing

To add a new AI provider:

1. Create a new service class implementing `AIService` interface
2. Add the provider to the `AIProvider` enum
3. Update `createDefaultAIService()` in `AutoHealLocator.ts`
4. Add default model to `getDefaultModel()`
5. Export the service from `index.ts`
6. Add documentation to this file

See existing implementations in `src/ai/` for reference.

---

## License

All AI provider implementations are licensed under MIT, same as AutoHeal Locator.

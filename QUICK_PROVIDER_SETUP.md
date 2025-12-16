# Quick Provider Setup Guide

## 1-Minute Setup

### Choose Provider & Get API Key

| Provider | Get API Key | Cost |
|----------|-------------|------|
| Gemini | https://makersuite.google.com/app/apikey | FREE |
| OpenAI | https://platform.openai.com/api-keys | Paid |
| Claude | https://console.anthropic.com/ | Paid |
| DeepSeek | https://platform.deepseek.com/ | Paid |
| Grok | https://console.x.ai/ | Paid |

### Set Environment Variable

```bash
# Linux/Mac
export OPENAI_API_KEY="your-key-here"
export AUTOHEAL_AI_PROVIDER="OPENAI"

# Windows CMD
set OPENAI_API_KEY=your-key-here
set AUTOHEAL_AI_PROVIDER=OPENAI

# Windows PowerShell
$env:OPENAI_API_KEY="your-key-here"
$env:AUTOHEAL_AI_PROVIDER="OPENAI"

# Or add to .env file
echo "OPENAI_API_KEY=your-key-here" >> .env
echo "AUTOHEAL_AI_PROVIDER=OPENAI" >> .env
```

### Use in Code

```typescript
import { AutoHealLocator } from 'autoheal-locator-js';

// That's it! No code changes needed
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .build(); // Uses OPENAI from environment
```

## Provider Quick Reference

### Gemini (FREE)
```bash
GEMINI_API_KEY=AIzaSy...
AUTOHEAL_AI_PROVIDER=GOOGLE_GEMINI
```

### OpenAI
```bash
OPENAI_API_KEY=sk-proj-...
AUTOHEAL_AI_PROVIDER=OPENAI
AUTOHEAL_AI_MODEL=gpt-4o  # optional
```

### Claude
```bash
ANTHROPIC_API_KEY=sk-ant-...
AUTOHEAL_AI_PROVIDER=ANTHROPIC
AUTOHEAL_AI_MODEL=claude-3-5-sonnet-20241022  # optional
```

### DeepSeek
```bash
DEEPSEEK_API_KEY=sk-...
AUTOHEAL_AI_PROVIDER=DEEPSEEK
```

### Grok
```bash
GROK_API_KEY=xai-...
AUTOHEAL_AI_PROVIDER=GROK
```

## Switching Providers

Just change the environment variable:

```bash
# Today: Use Gemini (free)
AUTOHEAL_AI_PROVIDER=GOOGLE_GEMINI

# Tomorrow: Switch to OpenAI
AUTOHEAL_AI_PROVIDER=OPENAI
```

No code changes! 🎉

## Full Documentation

See [AI_PROVIDERS.md](./AI_PROVIDERS.md) for complete details.

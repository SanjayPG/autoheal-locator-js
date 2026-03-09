# Local & Custom AI Model Support

## Overview

AutoHeal-Locator-JS supports local and custom AI model endpoints, allowing you to use:
- 🏠 Localhost models (http://localhost:8000)
- ☁️ Cloudflare tunnels (https://xyz.trycloudflare.com)
- 🌐 ngrok tunnels (https://xyz.ngrok.io)
- 📓 Google Colab endpoints
- 🔧 Any custom OpenAI-compatible API
- 🦙 Ollama (http://localhost:11434)

## Quick Start

### Localhost (OpenAI-compatible)
```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('http://localhost:8000')
  .build();
```

### Cloudflare Tunnel
```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('https://abc.trycloudflare.com', {
    apiPath: '/v1/chat/completions',
    model: 'deepseek-coder-v2:16b',
    timeout: 60000
  })
  .build();
```

### Ollama
```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('http://localhost:11434', {
    format: 'ollama',
    model: 'llama2',
    apiPath: '/api/generate'
  })
  .build();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | string | Required | Base URL of your endpoint |
| `apiPath` | string | `/v1/chat/completions` | API endpoint path |
| `format` | string | `openai` | Request format: `openai`, `ollama`, `custom` |
| `model` | string | `local-model` | Model name |
| `temperature` | number | `0.1` | Temperature (0-1) |
| `maxTokens` | number | `2048` | Maximum tokens |
| `timeout` | number | `30000` | Timeout in milliseconds |
| `headers` | object | `{}` | Custom HTTP headers |

## Request Formats

### OpenAI Format (Default)
Your endpoint should accept:
```json
POST /v1/chat/completions
{
  "model": "local-model",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.1,
  "max_tokens": 2048,
  "response_format": { "type": "json_object" }
}
```

Expected response:
```json
{
  "choices": [{
    "message": {
      "content": "{\"selector\":\"#username\",\"confidence\":0.95,\"reasoning\":\"Found input with stable id='username' attribute\",\"alternatives\":[]}"
    }
  }]
}
```

### Ollama Format
Your endpoint should accept:
```json
POST /api/generate
{
  "model": "llama2",
  "prompt": "...",
  "stream": false,
  "options": {
    "temperature": 0.1,
    "num_predict": 2048
  }
}
```

Expected response:
```json
{
  "response": "{\"selector\":\"#username\",\"confidence\":0.95,\"reasoning\":\"...\",\"alternatives\":[]}"
}
```

### Custom Format
For custom endpoints, the library tries multiple response fields:
- `choices[0].message.content` (OpenAI)
- `response` (Ollama)
- `content`
- `message`
- `text`

## Server Implementation Examples

### Python Flask (Localhost)

```python
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    data = request.json

    # Extract the user's message
    messages = data.get('messages', [])
    user_message = messages[-1]['content'] if messages else ''

    # Your AI model inference here
    # For this example, we'll use a simple mock response
    result = {
        "selector": "#username",
        "confidence": 0.95,
        "reasoning": "Found input with stable id='username' attribute",
        "alternatives": ["input[name='username']"]
    }

    # Return in OpenAI format
    return jsonify({
        "choices": [{
            "message": {
                "content": json.dumps(result)
            }
        }],
        "usage": {
            "total_tokens": 150
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

**Run:**
```bash
pip install flask
python server.py
# Server running at http://localhost:8000
```

### Python FastAPI

```python
from fastapi import FastAPI
from pydantic import BaseModel
import json

app = FastAPI()

class ChatRequest(BaseModel):
    model: str
    messages: list
    temperature: float = 0.1
    max_tokens: int = 2048

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    # Extract user message
    user_message = request.messages[-1]['content'] if request.messages else ''

    # Your AI model inference here
    result = {
        "selector": "#username",
        "confidence": 0.95,
        "reasoning": "Found input with stable id='username' attribute",
        "alternatives": ["input[name='username']"]
    }

    return {
        "choices": [{
            "message": {
                "content": json.dumps(result)
            }
        }],
        "usage": {
            "total_tokens": 150
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Run:**
```bash
pip install fastapi uvicorn
python server.py
```

### Google Colab + Cloudflare Tunnel

```python
# In Google Colab cell:

# 1. Install dependencies
!pip install flask pyngrok

# 2. Create Flask server
from flask import Flask, request, jsonify
import json
import threading

app = Flask(__name__)

@app.route('/v1/chat/completions', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])
    user_message = messages[-1]['content'] if messages else ''

    # Your model inference here
    result = {
        "selector": "#submit",
        "confidence": 0.90,
        "reasoning": "Found submit button",
        "alternatives": ["button[type='submit']"]
    }

    return jsonify({
        "choices": [{
            "message": {"content": json.dumps(result)}
        }]
    })

# 3. Start server in background
def run_server():
    app.run(host='0.0.0.0', port=8000)

server_thread = threading.Thread(target=run_server)
server_thread.start()

# 4. Create Cloudflare tunnel
!wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
!chmod +x cloudflared-linux-amd64
!./cloudflared-linux-amd64 tunnel --url http://localhost:8000
```

**Output:** `https://xyz.trycloudflare.com`

**Use in AutoHeal:**
```typescript
.withLocalModel('https://xyz.trycloudflare.com')
```

### Ollama Setup

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull a model
ollama pull llama2

# 3. Start Ollama server (runs on localhost:11434)
ollama serve
```

**Use in AutoHeal:**
```typescript
.withLocalModel('http://localhost:11434', {
  format: 'ollama',
  model: 'llama2',
  apiPath: '/api/generate'
})
```

## Response Format Requirements

Your local model must return JSON in this structure:

```json
{
  "selector": "#username",
  "confidence": 0.95,
  "reasoning": "Found input with stable id='username' attribute",
  "alternatives": ["input[name='username']", "[name='username']"]
}
```

**Required Fields:**
- `selector` (string) - The CSS selector or Playwright locator string
- `confidence` (number) - Confidence score between 0.0 and 1.0
- `reasoning` (string) - Explanation of why this selector was chosen

**Optional Fields:**
- `alternatives` (string[]) - Alternative selectors

## Usage Examples

### Example 1: Basic Localhost
```typescript
import { AutoHealLocator } from '@sdetsanjay/autoheal-locator';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('http://localhost:8000')
  .build();

await page.goto('https://example.com');
const element = await locator.find('#login', 'login button');
await element.click();
```

### Example 2: Cloudflare Tunnel with Custom Headers
```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('https://abc.trycloudflare.com', {
    apiPath: '/v1/chat/completions',
    model: 'deepseek-coder-v2:16b',
    timeout: 60000,
    headers: {
      'Authorization': 'Bearer secret-token',
      'X-Custom-Header': 'value'
    }
  })
  .build();
```

### Example 3: Ollama with Custom Model
```typescript
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('http://localhost:11434', {
    format: 'ollama',
    model: 'codellama:13b',
    apiPath: '/api/generate',
    timeout: 120000 // 2 minutes for slower local inference
  })
  .build();
```

### Example 4: ngrok Tunnel
```typescript
// First, start ngrok: ngrok http 8000
const locator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('https://abc123.ngrok.io', {
    apiPath: '/v1/chat/completions'
  })
  .build();
```

## Troubleshooting

### Connection Refused
```bash
# Check if server is running
curl http://localhost:8000/v1/chat/completions

# For Cloudflare tunnels
curl https://your-url.trycloudflare.com/v1/chat/completions
```

**Solution:**
- Ensure your server is running on the correct port
- Check firewall settings
- For tunnels, verify the tunnel is active

### Timeout Errors
```typescript
// Increase timeout for slow local models
.withLocalModel('http://localhost:8000', {
  timeout: 90000 // 90 seconds
})
```

### Invalid Response Format
**Error:** "Unable to extract content from response"

**Solution:**
- Ensure your server returns one of the supported response formats
- Check that the response contains valid JSON
- Verify the JSON structure matches requirements

### Invalid JSON in Response
**Error:** "Failed to parse AI response"

**Solution:**
- Ensure your model returns valid JSON
- Check for extra text before/after JSON
- The library can extract JSON from markdown code blocks

## Security Considerations

### Localhost
- ✅ Completely secure (no network exposure)
- ✅ Perfect for development
- ❌ Can't access from other machines

### Cloudflare Tunnel
- ⚠️ Public URL (anyone can access)
- ✅ Temporary URL (changes on restart)
- 💡 **Recommendation:** Add authentication headers

```typescript
.withLocalModel('https://xyz.trycloudflare.com', {
  headers: {
    'Authorization': 'Bearer secret-token-here'
  }
})
```

**Server-side validation:**
```python
@app.route('/v1/chat/completions', methods=['POST'])
def chat():
    auth = request.headers.get('Authorization')
    if auth != 'Bearer secret-token-here':
        return jsonify({'error': 'Unauthorized'}), 401
    # ... rest of code
```

### ngrok
- ⚠️ Public URL (paid plans have auth built-in)
- ✅ More stable than Cloudflare tunnels
- 💰 Free tier has limitations

## Performance Comparison

| Endpoint Type | Latency | Cost | Availability |
|---------------|---------|------|--------------|
| Localhost | 10-100ms | $0 | 100% (local) |
| Cloudflare Tunnel | 200-1000ms | $0 | ~95% (tunnel) |
| ngrok | 100-500ms | $0-$8/mo | ~95% (tunnel) |
| Custom Cloud | Varies | Varies | Varies |

## Benefits of Local Models

| Benefit | Description |
|---------|-------------|
| 💰 **Free** | No API costs - run unlimited tests |
| 🔒 **Private** | Data never leaves your control |
| ⚡ **Fast** | No internet latency (localhost) |
| 🎨 **Custom** | Use any model you want |
| 📴 **Offline** | Works without internet (localhost) |
| 🔧 **Control** | Full control over inference parameters |

## When to Use Local Models

**Use Local Models:**
- 💰 Minimizing costs (free forever)
- 🔒 Data privacy is critical
- 🚀 Experimenting with custom/fine-tuned models
- 📊 Need full control over model behavior
- 🏠 Working offline or in restricted networks

**Use Cloud APIs (OpenAI, Groq, etc.):**
- ⚡ Need highest accuracy
- 🌐 Need 99.9% uptime
- 🔧 Don't want to manage infrastructure
- 📈 Need automatic scaling

## Advanced Configuration

### Custom Request Format
```typescript
// For endpoints that don't match OpenAI or Ollama formats
.withLocalModel('https://custom-api.com', {
  format: 'custom',
  apiPath: '/analyze',
  headers: {
    'X-API-Key': 'your-key',
    'Content-Type': 'application/json'
  }
})
```

### Multiple Instances
```typescript
// Use different local models for different test suites
const fastLocator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('http://localhost:8000', {
    model: 'fast-model',
    timeout: 10000
  })
  .build();

const accurateLocator = AutoHealLocator.builder()
  .withPlaywrightPage(page)
  .withLocalModel('http://localhost:9000', {
    model: 'accurate-model',
    timeout: 60000
  })
  .build();
```

## Supported Models

Any model that can:
1. Accept text prompts describing HTML analysis tasks
2. Return JSON with selector, confidence, and reasoning
3. Understand CSS selectors or Playwright locator syntax

**Examples:**
- OpenAI GPT models (via local inference)
- Llama models (via Ollama)
- DeepSeek Coder
- CodeLlama
- Fine-tuned models
- Custom trained models

## FAQ

### Q: What models work best for local inference?
**A:** Models fine-tuned for code understanding work best:
- DeepSeek Coder (7B-33B)
- CodeLlama (7B-34B)
- Llama 2/3 (7B-70B)
- GPT-4 (via local inference servers)

### Q: How much RAM do I need?
**A:** Depends on model size:
- 7B models: 8-16GB RAM
- 13B models: 16-32GB RAM
- 33B+ models: 32GB+ RAM

### Q: Can I use GPU acceleration?
**A:** Yes! Most local inference servers (Ollama, vLLM, etc.) support GPU acceleration for faster inference.

### Q: Do local models work as well as cloud APIs?
**A:** Depends on the model. Large models (33B+) can match GPT-3.5 quality, but may be slower. Smaller models (7B-13B) are faster but less accurate.

### Q: Can I use multiple local models simultaneously?
**A:** Yes! Create separate AutoHealLocator instances with different baseUrls.

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/sdetsanjay/autoheal-locator-js
- Documentation: https://github.com/sdetsanjay/autoheal-locator-js/blob/main/README.md

---

**Implementation Status:** ✅ Production Ready

**Last Updated:** March 2026

import axios, { AxiosInstance } from 'axios';
import { AIService, AIAnalysisResult } from '../core/AIService';
import { AutomationFramework } from '../models/AutomationFramework';

/**
 * Configuration for local/custom model endpoints
 */
export interface LocalModelConfig {
  baseUrl: string;
  apiPath?: string;
  format?: 'openai' | 'ollama' | 'custom';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Local/Custom Model Service implementation
 *
 * Supports:
 * - Localhost endpoints (http://localhost:8000)
 * - Cloudflare tunnels (https://xyz.trycloudflare.com)
 * - ngrok tunnels (https://xyz.ngrok.io)
 * - Any OpenAI-compatible API
 * - Ollama endpoints
 */
export class LocalModelService implements AIService {
  private readonly config: Required<LocalModelConfig>;
  private readonly axiosInstance: AxiosInstance;

  constructor(config: LocalModelConfig) {
    // Validate baseUrl
    if (!config.baseUrl) {
      throw new Error('LocalModelService requires baseUrl');
    }

    // Set defaults
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''), // Remove trailing slash
      apiPath: config.apiPath || '/v1/chat/completions',
      format: config.format || 'openai',
      model: config.model || 'local-model',
      temperature: config.temperature ?? 0.1,
      maxTokens: config.maxTokens || 2048,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
    };

    // Create axios instance
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
    });
  }

  async analyzeDOM(
    html: string,
    description: string,
    originalSelector: string,
    framework: AutomationFramework = AutomationFramework.SELENIUM
  ): Promise<AIAnalysisResult> {
    const prompt = this.buildDOMPrompt(html, description, originalSelector, framework);

    try {
      const requestBody = this.buildRequestBody(prompt);
      const response = await this.axiosInstance.post(this.config.apiPath, requestBody);

      const content = this.extractContent(response.data);
      return this.parseAIResponse(content, framework);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      console.error('Local model DOM analysis failed:', errorMsg);
      throw new Error(`Local model DOM analysis failed: ${errorMsg}`);
    }
  }

  async analyzeVisual(_screenshot: Buffer, _description: string): Promise<AIAnalysisResult> {
    // Visual analysis is optional for local models
    // Most local models don't support vision
    throw new Error('Visual analysis not supported by local model. Use analyzeDOM instead.');
  }

  async selectBestMatchingElement(elements: any[], _description: string): Promise<any> {
    if (elements.length === 1) {
      return elements[0];
    }

    // For simplicity, return the first element
    // In production, you could use the local model to disambiguate
    console.warn(
      `Multiple elements found (${elements.length}), returning first. Consider using AI disambiguation.`
    );
    return elements[0];
  }

  getProviderName(): string {
    return `LOCAL (${this.config.baseUrl})`;
  }

  /**
   * Build request body based on format
   */
  private buildRequestBody(prompt: string): any {
    if (this.config.format === 'openai') {
      return {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in web automation test selector generation. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' },
      };
    } else if (this.config.format === 'ollama') {
      return {
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      };
    } else {
      // Custom format - simple message-based
      return {
        message: prompt,
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      };
    }
  }

  /**
   * Extract content from response based on format
   */
  private extractContent(data: any): string {
    // Try OpenAI format first
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    // Try Ollama format
    if (data.response) {
      return data.response;
    }

    // Try custom formats
    if (data.content) {
      return data.content;
    }

    if (data.message) {
      return data.message;
    }

    if (data.text) {
      return data.text;
    }

    throw new Error('Unable to extract content from response. Unsupported response format.');
  }

  private buildDOMPrompt(
    html: string,
    description: string,
    originalSelector: string,
    framework: AutomationFramework
  ): string {
    const truncatedHtml = html.length > 15000 ? html.substring(0, 15000) + '...' : html;

    if (framework === AutomationFramework.PLAYWRIGHT) {
      return `You are an expert in Playwright test automation. Analyze this HTML and find the SIMPLEST, most ROBUST selector.

**CRITICAL RULES:**
1. You MUST respond with ONLY a JSON object
2. Return Playwright selector engine syntax that works with page.locator()
3. **CONTEXT-AWARE selector priority** - Choose based on element type and DOM simplicity:

   **For simple DOM with stable attributes (id, name, type), ALWAYS prefer:**
   a) ID: #element-id or id=element-id
   b) Type attribute: input[type='password'], input[type='submit'], input[type='text'], button[type='button']
   c) Name attribute: input[name='username'], [name='fieldname']
   d) data-testid: data-testid=value or [data-testid='value']

   **For complex UI or when stable attributes are missing:**
   e) role selectors: role=button[name="Submit"]
   f) placeholder: placeholder="Enter text"
   g) text content: text=Exact Text

4. **CRITICAL: For INPUT elements** - Check id, name, type attributes FIRST before considering role selectors
5. **CRITICAL: For BUTTON/SUBMIT elements** - Check id, type='submit', type='button', value attributes FIRST before role selectors
6. Ensure selector is UNIQUE (finds exactly ONE element in the HTML)
7. AVOID fragile selectors: generated IDs (like btn_123_xyz), complex class names, nth-child, long paths
8. **Simple DOM = Simple selector** - Don't over-complicate with role selectors when a simple CSS selector with stable attributes works perfectly

**Analysis Steps:**
Step 1: Check if element has stable id attribute → Use #id or id=id
Step 2: Check if element is INPUT/BUTTON with type attribute → Use input[type='X'] or button[type='X']
Step 3: Check if element has stable name attribute → Use [name='X']
Step 4: Check if element has data-testid → Use data-testid=X
Step 5: Only then consider role selectors or text-based selectors

**Element to find:** ${description}
**Original selector that failed:** ${originalSelector}

**HTML:**
${truncatedHtml}

**Required JSON Response Format:**
{
  "selector": "#username",
  "confidence": 0.95,
  "reasoning": "Found input with stable id='username' attribute",
  "alternatives": ["input[name='username']", "input[type='text'][name='username']"]
}

**Example Responses for simple DOMs:**
- Password field: {"selector": "input[type='password']", "confidence": 0.95, "reasoning": "Unique password input with type attribute"}
- Submit button: {"selector": "input[type='submit']", "confidence": 0.95, "reasoning": "Unique submit button with type attribute"}
- Button with ID: {"selector": "#signInBtn", "confidence": 0.98, "reasoning": "Stable ID attribute"}
- Input with name: {"selector": "input[name='email']", "confidence": 0.95, "reasoning": "Stable name attribute"}

Respond with ONLY valid JSON:`;
    } else {
      // Selenium format
      return `You are an expert in Selenium WebDriver test automation. Analyze this HTML and find the best CSS selector or XPath.

**CRITICAL RULES:**
1. You MUST respond with ONLY a JSON object
2. Prefer CSS selectors over XPath (faster and more reliable)
3. Use stable attributes: id, data-testid, data-test, name
4. Avoid fragile selectors: class names, nth-child, complex paths
5. Ensure selector is unique and specific

**Element to find:** ${description}
**Original selector that failed:** ${originalSelector}

**HTML:**
${truncatedHtml}

**Required JSON Response Format:**
{
  "selector": "#submit-btn",
  "confidence": 0.95,
  "reasoning": "Found stable ID attribute",
  "alternatives": ["[data-testid='submit']", "button[type='submit']"]
}

Respond with ONLY valid JSON:`;
    }
  }

  private parseAIResponse(
    text: string,
    _framework: AutomationFramework = AutomationFramework.SELENIUM,
    tokensUsed: number = 1500
  ): AIAnalysisResult {
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(jsonText);

      return {
        recommendedSelector: parsed.selector,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'AI-generated selector',
        alternativeSelectors: parsed.alternatives || [],
        tokensUsed: tokensUsed,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', text);
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }
}

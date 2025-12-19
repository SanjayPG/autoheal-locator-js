import axios, { AxiosInstance } from 'axios';
import { AIService, AIAnalysisResult } from '../core/AIService';
import { AutomationFramework } from '../models/AutomationFramework';

/**
 * Google Gemini AI Service implementation
 */
export class GeminiAIService implements AIService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;

  constructor(
    apiKey: string,
    model: string = 'gemini-2.0-flash-exp',
    timeout: number = 30000
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.timeout = timeout;

    this.axiosInstance = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
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
      const response = await this.makeRequestWithRetry(
        `/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }
      );

      const text = response.data.candidates[0].content.parts[0].text;
      const tokensUsed = response.data.usageMetadata?.totalTokenCount || 0;
      return this.parseAIResponse(text, framework, tokensUsed);
    } catch (error: any) {
      console.error('Gemini DOM analysis failed:', error.message);
      if (error.response?.data) {
        console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Error status:', error.response?.status);

      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        const errorData = error.response?.data;
        throw new Error(`Rate limit exceeded: ${JSON.stringify(errorData) || 'Please wait and try again'}`);
      }

      throw new Error(`AI DOM analysis failed: ${error.message || error}`);
    }
  }

  async analyzeVisual(screenshot: Buffer, description: string): Promise<AIAnalysisResult> {
    const base64Image = screenshot.toString('base64');
    const prompt = this.buildVisualPrompt(description);

    try {
      const response = await this.makeRequestWithRetry(
        `/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/png',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }
      );

      const text = response.data.candidates[0].content.parts[0].text;
      const tokensUsed = response.data.usageMetadata?.totalTokenCount || 0;
      return this.parseAIResponse(text, AutomationFramework.SELENIUM, tokensUsed);
    } catch (error: any) {
      console.error('Gemini visual analysis failed:', error);

      // Check if it's a rate limit error
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again or check your API quota.');
      }

      throw new Error(`AI visual analysis failed: ${error.message || error}`);
    }
  }

  async selectBestMatchingElement(elements: any[], _description: string): Promise<any> {
    if (elements.length === 1) {
      return elements[0];
    }

    // For simplicity, return the first element
    // In production, you'd use AI to disambiguate
    console.warn(
      `Multiple elements found (${elements.length}), returning first. Consider using AI disambiguation.`
    );
    return elements[0];
  }

  getProviderName(): string {
    return 'Google Gemini';
  }

  /**
   * Make HTTP request with retry logic and exponential backoff for rate limits
   */
  private async makeRequestWithRetry(url: string, data: any, maxRetries: number = 3): Promise<any> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.axiosInstance.post(url, data);
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (error.response?.status === 429) {
          // Calculate exponential backoff delay (1s, 2s, 4s, etc.)
          const delayMs = Math.pow(2, attempt) * 1000;

          console.warn(`Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})...`);

          // Only retry if we have attempts left
          if (attempt < maxRetries - 1) {
            await this.sleep(delayMs);
            continue;
          }
        }

        // For non-rate-limit errors, don't retry
        throw error;
      }
    }

    // If we exhausted all retries, throw the last error
    throw lastError;
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  private buildVisualPrompt(description: string): string {
    return `You are an expert in web UI automation. Analyze this screenshot and find the element.

**CRITICAL RULES:**
1. You MUST respond with ONLY a JSON object
2. Describe the element's position, appearance, and context
3. Provide a CSS selector or XPath to locate it
4. Consider visual hierarchy and element relationships

**Element to find:** ${description}

**Required JSON Response Format:**
{
  "selector": "#element-selector",
  "confidence": 0.85,
  "reasoning": "Element located at top-right, blue button with white text",
  "alternatives": ["[data-testid='element']", ".btn-primary"]
}

Respond with ONLY valid JSON:`;
  }

  private parseAIResponse(
    text: string,
    _framework: AutomationFramework = AutomationFramework.SELENIUM,
    tokensUsed: number = 0
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

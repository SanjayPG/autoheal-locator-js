import axios, { AxiosInstance } from 'axios';
import { AIService, AIAnalysisResult } from '../core/AIService';
import { AutomationFramework } from '../models/AutomationFramework';

/**
 * Anthropic (Claude) AI Service implementation
 */
export class AnthropicService implements AIService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly axiosInstance: AxiosInstance;

  constructor(
    apiKey: string,
    model: string = 'claude-3-5-sonnet-20241022',
    timeout: number = 30000
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.timeout = timeout;

    this.axiosInstance = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
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
      const response = await this.axiosInstance.post('/messages', {
        model: this.model,
        max_tokens: 2048,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const text = response.data.content[0].text;
      const tokensUsed = response.data.usage?.input_tokens + response.data.usage?.output_tokens || 1500;
      return this.parseAIResponse(text, framework, tokensUsed);
    } catch (error: any) {
      console.error('Anthropic DOM analysis failed:', error.response?.data || error.message);
      throw new Error(`AI DOM analysis failed: ${error.message}`);
    }
  }

  async analyzeVisual(screenshot: Buffer, description: string): Promise<AIAnalysisResult> {
    const base64Image = screenshot.toString('base64');
    const prompt = this.buildVisualPrompt(description);

    try {
      const response = await this.axiosInstance.post('/messages', {
        model: this.model,
        max_tokens: 2048,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      const text = response.data.content[0].text;
      const tokensUsed = response.data.usage?.input_tokens + response.data.usage?.output_tokens || 1500;
      return this.parseAIResponse(text, AutomationFramework.SELENIUM, tokensUsed);
    } catch (error: any) {
      console.error('Anthropic visual analysis failed:', error.response?.data || error.message);
      throw new Error(`AI visual analysis failed: ${error.message}`);
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
    return 'Anthropic (Claude)';
  }

  private buildDOMPrompt(
    html: string,
    description: string,
    originalSelector: string,
    framework: AutomationFramework
  ): string {
    const truncatedHtml = html.length > 15000 ? html.substring(0, 15000) + '...' : html;

    if (framework === AutomationFramework.PLAYWRIGHT) {
      return `You are an expert in Playwright test automation. Analyze this HTML and find the best Playwright selector.

**CRITICAL RULES:**
1. You MUST respond with ONLY a JSON object
2. Return Playwright selector engine syntax that works with page.locator()
3. **Prefer built-in Playwright selector engines over CSS selectors** in this order:
   - data-testid=value - for data-testid attributes. Example: data-testid=login-button
   - role=button[name="Submit"] - for accessible roles. Example: role=button[name="Login"]
   - text=Welcome - for exact text content. Example: text=Login
   - placeholder="Enter username" - for input placeholders
   - CSS selector as last resort. Example: #user-name or [data-test='username']
4. For role selectors, use accessible roles: button, link, textbox, checkbox, radio, heading, etc.
5. For role selectors with name, use format: role=button[name="Text"]
6. Ensure selector is unique and specific
7. Avoid fragile selectors: complex class names, nth-child, long paths

**Element to find:** ${description}
**Original selector that failed:** ${originalSelector}

**HTML:**
${truncatedHtml}

**Required JSON Response Format:**
{
  "selector": "data-testid=directions",
  "confidence": 0.95,
  "reasoning": "Found button with data-testid attribute",
  "alternatives": ["role=button[name='Directions']", "[data-testid='directions']"]
}

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

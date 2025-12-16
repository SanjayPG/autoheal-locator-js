import type { Page, Locator as PlaywrightLocator } from 'playwright';
import type { WebDriver, WebElement } from 'selenium-webdriver';
import { WebAutomationAdapter } from './WebAutomationAdapter';
import { AIService } from './AIService';
import { SelectorCache } from './SelectorCache';
import { PlaywrightAdapter } from '../adapters/PlaywrightAdapter';
import { SeleniumAdapter } from '../adapters/SeleniumAdapter';
import { GeminiAIService } from '../ai/GeminiAIService';
import { OpenAIService } from '../ai/OpenAIService';
import { AnthropicService } from '../ai/AnthropicService';
import { DeepSeekService } from '../ai/DeepSeekService';
import { GrokService } from '../ai/GrokService';
import { GroqAIService } from '../ai/GroqAIService';
import { MemoryCache } from '../cache/MemoryCache';
import { FileCache } from '../cache/FileCache';
import {
  AutoHealConfiguration,
  loadConfiguration,
  CacheType,
  ExecutionStrategy,
} from '../config/AutoHealConfiguration';
import { AIProvider } from '../models/AIProvider';
import { LocatorRequest, defaultLocatorOptions } from '../models/LocatorRequest';
import { LocatorResult } from '../models/LocatorResult';
import { LocatorStrategy } from '../models/LocatorStrategy';
import { CachedSelector } from '../models/CachedSelector';
import { AutoHealReporter } from '../reporting/AutoHealReporter';
// import { AutomationFramework } from '../models/AutomationFramework'; // Unused but kept for future use

/**
 * Main AutoHeal Locator facade for JavaScript/TypeScript
 *
 * Provides AI-powered self-healing element location for both
 * Playwright and Selenium WebDriver
 */
export class AutoHealLocator {
  private adapter: WebAutomationAdapter;
  private aiService: AIService;
  private cache: SelectorCache;
  private config: AutoHealConfiguration;
  private reporter: AutoHealReporter;

  constructor(
    adapter: WebAutomationAdapter,
    aiService: AIService,
    cache: SelectorCache,
    config: AutoHealConfiguration
  ) {
    this.adapter = adapter;
    this.aiService = aiService;
    this.cache = cache;
    this.config = config;
    this.reporter = new AutoHealReporter(config.ai);
  }

  /**
   * Create a new AutoHealLocator builder
   */
  static builder(): AutoHealLocatorBuilder {
    return new AutoHealLocatorBuilder();
  }

  // ==================== SELENIUM API ====================

  /**
   * Find element with Selenium WebDriver and auto-healing
   *
   * @param selector CSS selector, XPath, ID, or other selector string
   * @param description Human-readable description for AI healing
   * @returns WebElement
   */
  async findElement(selector: string, description: string): Promise<WebElement> {
    if (!(this.adapter instanceof SeleniumAdapter)) {
      throw new Error('findElement() requires Selenium adapter. Use find() for Playwright.');
    }

    const result = await this.locateElementWithHealing({
      selector,
      description,
      options: defaultLocatorOptions,
      framework: 'selenium',
    });

    return result.element as WebElement;
  }

  /**
   * Find multiple elements with Selenium WebDriver and auto-healing
   */
  async findElements(selector: string, description: string): Promise<WebElement[]> {
    if (!(this.adapter instanceof SeleniumAdapter)) {
      throw new Error('findElements() requires Selenium adapter');
    }

    // First find one element to validate the selector
    await this.findElement(selector, description);

    // Then find all elements with the successful selector
    const successfulSelector = await this.getLastSuccessfulSelector(selector, description);
    return await this.adapter.findElements(successfulSelector);
  }

  // ==================== PLAYWRIGHT API ====================

  /**
   * Find element with Playwright and auto-healing
   *
   * @param page Playwright Page object
   * @param locatorOrSelector Playwright Locator object OR CSS selector string
   * @param description Human-readable description for AI healing
   * @returns Playwright Locator
   */
  async find(page: Page, locatorOrSelector: PlaywrightLocator | string, description: string): Promise<PlaywrightLocator> {
    if (!(this.adapter instanceof PlaywrightAdapter)) {
      throw new Error('find() requires Playwright adapter. Use findElement() for Selenium.');
    }

    const startTime = Date.now();

    try {
      // Determine if input is a Locator object or string selector
      const isLocatorObject = typeof locatorOrSelector !== 'string';
      const originalLocator = isLocatorObject
        ? (locatorOrSelector as PlaywrightLocator)
        : page.locator(locatorOrSelector as string);

      // Get selector string in JavaScript format (for display)
      const displaySelector = isLocatorObject
        ? await this.extractSelectorFromLocator(locatorOrSelector as PlaywrightLocator)
        : (locatorOrSelector as string);

      // Convert to selector engine format for internal use (caching, AI healing)
      const selectorString = this.convertToSelectorEngineFormat(displaySelector);

      // Step 1: Try original locator
      const count = await originalLocator.count();

      if (count === 1) {
        console.log(`Original locator worked: ${displaySelector}`);
        this.cacheSuccess(selectorString, description, selectorString);
        const elementDesc = await this.getPlaywrightElementDescription(originalLocator);
        this.reporter.recordSelectorUsage(
          displaySelector,  // Display in JavaScript format
          description,
          LocatorStrategy.ORIGINAL_SELECTOR,
          Date.now() - startTime,
          true,
          displaySelector,  // Display in JavaScript format
          elementDesc,
          'Original locator worked'
        );
        return originalLocator;
      }

      // Step 2: Check cache
      const cacheKey = this.generateCacheKey(selectorString, description);
      const cached = this.cache.get(cacheKey);

      if (cached && cached.getCurrentSuccessRate() > 0.7) {
        const cachedLocator = page.locator(cached.selector);
        const cachedCount = await cachedLocator.count();

        if (cachedCount === 1) {
          console.log(`Cache hit: ${displaySelector} -> ${cached.selector}`);
          this.cache.updateSuccess(cacheKey, true);
          const elementDesc = await this.getPlaywrightElementDescription(cachedLocator);
          // Convert cached selector back to JavaScript format for display
          const cachedDisplaySelector = this.convertToJavaScriptFormat(cached.selector);
          this.reporter.recordSelectorUsage(
            displaySelector,  // Display original in JavaScript format
            description,
            LocatorStrategy.CACHED,
            Date.now() - startTime,
            true,
            cachedDisplaySelector,  // Display healed in JavaScript format
            elementDesc,
            'Retrieved from cache'
          );
          return cachedLocator;
        } else {
          this.cache.updateSuccess(cacheKey, false);
        }
      }

      // Step 3: AI Healing
      console.log(`Performing AI healing for: ${description}`);
      const aiResult = await this.performAIHealingWithTokens(selectorString, description);

      const healedLocator = page.locator(aiResult.selector);
      const healedCount = await healedLocator.count();

      if (healedCount === 1) {
        console.log(`AI healing successful: ${displaySelector} -> ${aiResult.selector}`);
        this.cacheSuccess(selectorString, description, aiResult.selector);
        const elementDesc = await this.getPlaywrightElementDescription(healedLocator);
        // Convert healed selector back to JavaScript format for display
        const healedDisplaySelector = this.convertToJavaScriptFormat(aiResult.selector);
        this.reporter.recordSelectorUsage(
          displaySelector,  // Display original in JavaScript format
          description,
          aiResult.strategy,
          Date.now() - startTime,
          true,
          healedDisplaySelector,  // Display healed in JavaScript format
          elementDesc,
          'AI healed selector',
          aiResult.tokensUsed
        );
        return healedLocator;
      }

      const duration = Date.now() - startTime;
      this.reporter.recordSelectorUsage(
        displaySelector,  // Display in JavaScript format
        description,
        aiResult.strategy,
        duration,
        false,
        '',
        '',
        'Could not find element even after healing'
      );
      throw new Error(`Could not find element even after healing: ${description}`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Playwright find() failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // ==================== CORE HEALING LOGIC ====================

  private async locateElementWithHealing(request: LocatorRequest): Promise<LocatorResult> {
    const startTime = Date.now();

    // Step 1: Try original selector
    try {
      const elements = await this.adapter.findElements(request.selector);
      if (elements.length > 0) {
        const element = elements.length === 1 ? elements[0] : await this.disambiguate(elements, request.description);

        this.cacheSuccess(request.selector, request.description, request.selector);

        const result: LocatorResult = {
          element,
          actualSelector: request.selector,
          strategy: LocatorStrategy.ORIGINAL_SELECTOR,
          executionTimeMs: Date.now() - startTime,
          fromCache: false,
          confidence: 1.0,
          reasoning: 'Original selector worked',
        };

        // Record to reporter
        const elementDesc = await this.getElementDescription(element);
        this.reporter.recordSelectorUsage(
          request.selector,
          request.description,
          LocatorStrategy.ORIGINAL_SELECTOR,
          result.executionTimeMs,
          true,
          request.selector,
          elementDesc,
          'Original selector worked',
          0
        );

        return result;
      }
    } catch (error) {
      console.debug(`Original selector failed: ${request.selector}`);
    }

    // Step 2: Try cache
    const cacheKey = this.generateCacheKey(request.selector, request.description);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.getCurrentSuccessRate() > 0.7) {
      try {
        const elements = await this.adapter.findElements(cached.selector);
        if (elements.length > 0) {
          const element = elements.length === 1 ? elements[0] : await this.disambiguate(elements, request.description);

          this.cache.updateSuccess(cacheKey, true);

          const result: LocatorResult = {
            element,
            actualSelector: cached.selector,
            strategy: LocatorStrategy.CACHED,
            executionTimeMs: Date.now() - startTime,
            fromCache: true,
            confidence: cached.getCurrentSuccessRate(),
            reasoning: 'Retrieved from cache',
          };

          // Record to reporter
          const elementDesc = await this.getElementDescription(element);
          this.reporter.recordSelectorUsage(
            request.selector,
            request.description,
            LocatorStrategy.CACHED,
            result.executionTimeMs,
            true,
            cached.selector,
            elementDesc,
            'Retrieved from cache',
            0
          );

          return result;
        }
      } catch (error) {
        this.cache.updateSuccess(cacheKey, false);
      }
    }

    // Step 3: AI Healing
    try {
      const aiResult = await this.performAIHealingWithTokens(request.selector, request.description);
      const elements = await this.adapter.findElements(aiResult.selector);

      if (elements.length === 0) {
        // Record failure
        this.reporter.recordSelectorUsage(
          request.selector,
          request.description,
          aiResult.strategy,
          Date.now() - startTime,
          false,
          aiResult.selector,
          '',
          'Could not find element even after AI healing',
          aiResult.tokensUsed
        );
        throw new Error(`Could not find element even after AI healing: ${request.description}`);
      }

      const element = elements.length === 1 ? elements[0] : await this.disambiguate(elements, request.description);
      this.cacheSuccess(request.selector, request.description, aiResult.selector);

      const result: LocatorResult = {
        element,
        actualSelector: aiResult.selector,
        strategy: aiResult.strategy,
        executionTimeMs: Date.now() - startTime,
        fromCache: false,
        confidence: 0.85,
        reasoning: 'AI healed selector',
        tokensUsed: aiResult.tokensUsed,
      };

      // Record to reporter
      const elementDesc = await this.getElementDescription(element);
      this.reporter.recordSelectorUsage(
        request.selector,
        request.description,
        aiResult.strategy,
        result.executionTimeMs,
        true,
        aiResult.selector,
        elementDesc,
        'AI healed selector',
        aiResult.tokensUsed
      );

      return result;
    } catch (error) {
      // Record failure if not already recorded
      if (!(error instanceof Error && error.message.includes('Could not find element even after AI healing'))) {
        this.reporter.recordSelectorUsage(
          request.selector,
          request.description,
          LocatorStrategy.DOM_ANALYSIS,
          Date.now() - startTime,
          false,
          '',
          '',
          `Error during healing: ${error}`,
          0
        );
      }
      throw error;
    }
  }

  private async getElementDescription(element: any): Promise<string> {
    try {
      // For Selenium WebDriver elements
      if (element && typeof element.getTagName === 'function') {
        const tagName = await element.getTagName();
        const id = await element.getAttribute('id');
        const className = await element.getAttribute('class');
        const name = await element.getAttribute('name');
        const type = await element.getAttribute('type');

        let desc = `<${tagName}`;
        if (id) desc += ` id="${id}"`;
        if (name) desc += ` name="${name}"`;
        if (type) desc += ` type="${type}"`;
        if (className) {
          const classes = className.split(' ').slice(0, 2).join(' ');
          desc += ` class="${classes}${className.split(' ').length > 2 ? '...' : ''}"`;
        }
        desc += '>';

        return desc;
      }
      // For Playwright locators
      return 'Element';
    } catch (error) {
      return 'Element';
    }
  }

  /**
   * Extract selector string from Playwright Locator object
   * Returns in JavaScript API format (e.g., getByTestId('login'))
   */
  private async extractSelectorFromLocator(locator: PlaywrightLocator): Promise<string> {
    try {
      // Try to get the locator's string representation
      const locatorString = locator.toString();

      // Playwright Locators toString() returns something like "Locator@getByTestId('directions123')"
      // Extract the selector part (keep in JavaScript format for display)
      if (locatorString.includes('Locator@')) {
        return locatorString.split('Locator@')[1] || locatorString;
      }

      return locatorString;
    } catch (error) {
      // Fallback: generate a generic selector based on the element
      try {
        const elementInfo = await locator.evaluate((el: any) => {
          const tagName = el.tagName?.toLowerCase() || 'element';
          const id = el.id || '';
          const className = el.className || '';

          if (id) return `#${id}`;
          if (className) return `.${className.split(' ')[0]}`;
          return tagName;
        });

        return elementInfo;
      } catch (err) {
        return 'unknown-selector';
      }
    }
  }

  /**
   * Convert Playwright selector engine format to JavaScript API syntax
   * Examples:
   * - data-testid=login -> getByTestId('login')
   * - role=button[name="Submit"] -> getByRole('button', { name: 'Submit' })
   * - text=Welcome -> getByText('Welcome')
   */
  private convertToJavaScriptFormat(selectorEngine: string): string {
    // If it's already in JavaScript format or CSS selector, return as-is
    if (selectorEngine.includes('getBy') || selectorEngine.includes('locator(') ||
        selectorEngine.startsWith('#') || selectorEngine.startsWith('.') ||
        selectorEngine.startsWith('//') || selectorEngine.startsWith('xpath=')) {
      return selectorEngine;
    }

    // data-testid=value -> getByTestId('value')
    let match = selectorEngine.match(/^data-testid=(.+)$/);
    if (match) {
      return `getByTestId('${match[1]}')`;
    }

    // role=button[name="Submit"] -> getByRole('button', { name: 'Submit' })
    match = selectorEngine.match(/^role=([^[]+)\[name="([^"]+)"\]$/);
    if (match) {
      return `getByRole('${match[1]}', { name: '${match[2]}' })`;
    }

    // role=button -> getByRole('button')
    match = selectorEngine.match(/^role=(.+)$/);
    if (match) {
      return `getByRole('${match[1]}')`;
    }

    // text=Welcome -> getByText('Welcome')
    match = selectorEngine.match(/^text=(.+)$/);
    if (match) {
      return `getByText('${match[1]}')`;
    }

    // placeholder="Enter name" -> getByPlaceholder('Enter name')
    match = selectorEngine.match(/^placeholder="(.+)"$/);
    if (match) {
      return `getByPlaceholder('${match[1]}')`;
    }

    // label="Username" -> getByLabel('Username')
    match = selectorEngine.match(/^label="(.+)"$/);
    if (match) {
      return `getByLabel('${match[1]}')`;
    }

    // alt="Logo" -> getByAltText('Logo')
    match = selectorEngine.match(/^alt="(.+)"$/);
    if (match) {
      return `getByAltText('${match[1]}')`;
    }

    // title="Tooltip" -> getByTitle('Tooltip')
    match = selectorEngine.match(/^title="(.+)"$/);
    if (match) {
      return `getByTitle('${match[1]}')`;
    }

    // If no match, return as-is (might be CSS selector)
    return selectorEngine;
  }

  /**
   * Convert Playwright JavaScript API syntax to selector engine format
   * Examples:
   * - getByTestId('login') -> data-testid=login
   * - getByRole('button', { name: 'Submit' }) -> role=button[name="Submit"]
   * - getByText('Welcome') -> text=Welcome
   * - getByPlaceholder('Enter name') -> placeholder="Enter name"
   * - locator('#login-button') -> #login-button
   */
  private convertToSelectorEngineFormat(apiSyntax: string): string {
    // Handle locator() with CSS/XPath selectors
    // locator('#selector') or locator('xpath=//button')
    // Match everything between the outer quotes, handling internal quotes
    let match = apiSyntax.match(/^locator\(['"](.+)['"]\)$/);
    if (match) {
      return match[1];
    }

    // If it's already in selector engine format (no getBy or locator), return as-is
    if (!apiSyntax.includes('getBy') && !apiSyntax.includes('locator(')) {
      return apiSyntax;
    }

    // getByTestId('value') -> data-testid=value
    match = apiSyntax.match(/getByTestId\(['"]([^'"]+)['"]\)/);
    if (match) {
      return `data-testid=${match[1]}`;
    }

    // getByRole('role', { name: 'value', ...other options }) -> role=role[name="value"]
    // Match with any additional options (exact, checked, etc.)
    match = apiSyntax.match(/getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]/);
    if (match) {
      return `role=${match[1]}[name="${match[2]}"]`;
    }

    // getByRole('role') -> role=role
    match = apiSyntax.match(/getByRole\(['"]([^'"]+)['"]\)/);
    if (match) {
      return `role=${match[1]}`;
    }

    // getByText('value', { exact: true }) or getByText('value') -> text=value
    match = apiSyntax.match(/getByText\(['"]([^'"]+)['"]/);
    if (match) {
      return `text=${match[1]}`;
    }

    // getByPlaceholder('value') -> placeholder="value"
    match = apiSyntax.match(/getByPlaceholder\(['"]([^'"]+)['"]\)/);
    if (match) {
      return `placeholder="${match[1]}"`;
    }

    // getByLabel('value') -> label="value"
    match = apiSyntax.match(/getByLabel\(['"]([^'"]+)['"]\)/);
    if (match) {
      return `label="${match[1]}"`;
    }

    // getByAltText('value') -> alt="value"
    match = apiSyntax.match(/getByAltText\(['"]([^'"]+)['"]\)/);
    if (match) {
      return `alt="${match[1]}"`;
    }

    // getByTitle('value') -> title="value"
    match = apiSyntax.match(/getByTitle\(['"]([^'"]+)['"]\)/);
    if (match) {
      return `title="${match[1]}"`;
    }

    // If no match, return the original
    return apiSyntax;
  }

  /**
   * Get element description from Playwright Locator
   */
  private async getPlaywrightElementDescription(locator: PlaywrightLocator): Promise<string> {
    try {
      const elementInfo = await locator.evaluate((el: any) => {
        const tagName = el.tagName?.toLowerCase() || 'element';
        const id = el.id || '';
        const className = el.className || '';
        const name = el.name || '';
        const type = el.type || '';

        return { tagName, id, className, name, type };
      });

      let desc = `<${elementInfo.tagName}`;
      if (elementInfo.id) desc += ` id="${elementInfo.id}"`;
      if (elementInfo.name) desc += ` name="${elementInfo.name}"`;
      if (elementInfo.type) desc += ` type="${elementInfo.type}"`;
      if (elementInfo.className) {
        const classes = elementInfo.className.split(' ').slice(0, 2).join(' ');
        desc += ` class="${classes}${elementInfo.className.split(' ').length > 2 ? '...' : ''}"`;
      }
      desc += '>';

      return desc;
    } catch (error) {
      return 'Playwright Locator';
    }
  }

  /**
   * Perform AI healing with automatic fallback from DOM to Visual
   */
  private async performAIHealingWithTokens(originalSelector: string, description: string): Promise<{ selector: string; tokensUsed: number; strategy: LocatorStrategy }> {
    const strategy = this.config.performance.executionStrategy;

    if (strategy === ExecutionStrategy.VISUAL_FIRST) {
      // Try Visual first, fallback to DOM
      return await this.tryVisualThenDOM(originalSelector, description);
    } else if (strategy === ExecutionStrategy.PARALLEL) {
      // For now, use Visual (in future, run both in parallel)
      const screenshot = await this.adapter.takeScreenshot();
      const result = await this.aiService.analyzeVisual(screenshot, description);
      return {
        selector: result.recommendedSelector || originalSelector,
        tokensUsed: result.tokensUsed || 0,
        strategy: LocatorStrategy.VISUAL_ANALYSIS
      };
    } else if (strategy === ExecutionStrategy.DOM_ONLY) {
      // DOM only, no fallback
      const html = await this.adapter.getPageSource();
      const result = await this.aiService.analyzeDOM(
        html,
        description,
        originalSelector,
        this.adapter.getFrameworkType()
      );
      return {
        selector: result.recommendedSelector || originalSelector,
        tokensUsed: result.tokensUsed || 0,
        strategy: LocatorStrategy.DOM_ANALYSIS
      };
    } else {
      // SMART_SEQUENTIAL or SEQUENTIAL: Try DOM first, fallback to Visual
      return await this.tryDOMThenVisual(originalSelector, description);
    }
  }

  /**
   * Try DOM analysis first, fallback to Visual if DOM selector doesn't work
   */
  private async tryDOMThenVisual(originalSelector: string, description: string): Promise<{ selector: string; tokensUsed: number; strategy: LocatorStrategy }> {
    // Step 1: Try DOM analysis
    const html = await this.adapter.getPageSource();
    const domResult = await this.aiService.analyzeDOM(
      html,
      description,
      originalSelector,
      this.adapter.getFrameworkType()
    );

    const domSelector = domResult.recommendedSelector || originalSelector;

    // Step 2: Verify DOM selector works
    try {
      const elements = await this.adapter.findElements(domSelector);
      if (elements.length > 0) {
        console.log(`[DOM-AI] Found element with DOM analysis: ${domSelector}`);
        return {
          selector: domSelector,
          tokensUsed: domResult.tokensUsed || 0,
          strategy: LocatorStrategy.DOM_ANALYSIS
        };
      }
    } catch (error) {
      console.warn(`[DOM-AI] DOM selector failed: ${domSelector}`);
    }

    // Step 3: Fallback to Visual analysis
    console.log(`[VISUAL-AI] DOM failed, falling back to Visual analysis...`);
    try {
      const screenshot = await this.adapter.takeScreenshot();
      const visualResult = await this.aiService.analyzeVisual(screenshot, description);
      const visualSelector = visualResult.recommendedSelector || originalSelector;

      return {
        selector: visualSelector,
        tokensUsed: (domResult.tokensUsed || 0) + (visualResult.tokensUsed || 0),
        strategy: LocatorStrategy.VISUAL_ANALYSIS
      };
    } catch (error) {
      console.error(`[VISUAL-AI] Visual analysis also failed`);
      // Return DOM result even if it failed (for error reporting)
      return {
        selector: domSelector,
        tokensUsed: domResult.tokensUsed || 0,
        strategy: LocatorStrategy.DOM_ANALYSIS
      };
    }
  }

  /**
   * Try Visual analysis first, fallback to DOM if Visual selector doesn't work
   */
  private async tryVisualThenDOM(originalSelector: string, description: string): Promise<{ selector: string; tokensUsed: number; strategy: LocatorStrategy }> {
    // Step 1: Try Visual analysis
    const screenshot = await this.adapter.takeScreenshot();
    const visualResult = await this.aiService.analyzeVisual(screenshot, description);
    const visualSelector = visualResult.recommendedSelector || originalSelector;

    // Step 2: Verify Visual selector works
    try {
      const elements = await this.adapter.findElements(visualSelector);
      if (elements.length > 0) {
        console.log(`[VISUAL-AI] Found element with Visual analysis: ${visualSelector}`);
        return {
          selector: visualSelector,
          tokensUsed: visualResult.tokensUsed || 0,
          strategy: LocatorStrategy.VISUAL_ANALYSIS
        };
      }
    } catch (error) {
      console.warn(`[VISUAL-AI] Visual selector failed: ${visualSelector}`);
    }

    // Step 3: Fallback to DOM analysis
    console.log(`[DOM-AI] Visual failed, falling back to DOM analysis...`);
    try {
      const html = await this.adapter.getPageSource();
      const domResult = await this.aiService.analyzeDOM(
        html,
        description,
        originalSelector,
        this.adapter.getFrameworkType()
      );
      const domSelector = domResult.recommendedSelector || originalSelector;

      return {
        selector: domSelector,
        tokensUsed: (visualResult.tokensUsed || 0) + (domResult.tokensUsed || 0),
        strategy: LocatorStrategy.DOM_ANALYSIS
      };
    } catch (error) {
      console.error(`[DOM-AI] DOM analysis also failed`);
      // Return Visual result even if it failed (for error reporting)
      return {
        selector: visualSelector,
        tokensUsed: visualResult.tokensUsed || 0,
        strategy: LocatorStrategy.VISUAL_ANALYSIS
      };
    }
  }

  private async disambiguate(elements: any[], description: string): Promise<any> {
    if (elements.length === 1) {
      return elements[0];
    }

    console.warn(`Multiple elements found (${elements.length}), using AI to select best match`);
    return await this.aiService.selectBestMatchingElement(elements, description);
  }

  private cacheSuccess(originalSelector: string, description: string, successfulSelector: string): void {
    const cacheKey = this.generateCacheKey(originalSelector, description);
    const cached = new CachedSelector(successfulSelector);
    this.cache.put(cacheKey, cached);
  }

  private generateCacheKey(selector: string, description: string): string {
    return `${selector}|${description}`;
  }

  private async getLastSuccessfulSelector(originalSelector: string, description: string): Promise<string> {
    const cacheKey = this.generateCacheKey(originalSelector, description);
    const cached = this.cache.get(cacheKey);
    return cached?.selector || originalSelector;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all cached selectors
   */
  clearCache(): void {
    this.cache.clearAll();
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    return this.cache.getMetrics();
  }

  /**
   * Shutdown and cleanup resources, generate reports
   */
  shutdown(outputDir: string = './autoheal-reports'): void {
    this.reporter.printSummary();

    if (this.config.reporting?.enabled) {
      if (this.config.reporting.generateHTML) {
        this.reporter.generateHTMLReport(outputDir);
      }
      if (this.config.reporting.generateJSON) {
        this.reporter.generateJSONReport(outputDir);
      }
      if (this.config.reporting.generateText) {
        this.reporter.generateTextReport(outputDir);
      }
    }

    console.log('AutoHealLocator shutdown completed');
  }

  /**
   * Get the reporter instance for manual report generation
   */
  getReporter(): AutoHealReporter {
    return this.reporter;
  }
}

/**
 * Builder for AutoHealLocator
 */
export class AutoHealLocatorBuilder {
  private adapter?: WebAutomationAdapter;
  private aiService?: AIService;
  private cache?: SelectorCache;
  private customConfig?: Partial<AutoHealConfiguration>;

  /**
   * Use Playwright Page
   */
  withPlaywrightPage(page: Page): this {
    this.adapter = new PlaywrightAdapter(page);
    return this;
  }

  /**
   * Use Selenium WebDriver
   */
  withSeleniumDriver(driver: WebDriver): this {
    this.adapter = new SeleniumAdapter(driver);
    return this;
  }

  /**
   * Use custom WebAutomationAdapter
   */
  withAdapter(adapter: WebAutomationAdapter): this {
    this.adapter = adapter;
    return this;
  }

  /**
   * Use custom AI service
   */
  withAIService(aiService: AIService): this {
    this.aiService = aiService;
    return this;
  }

  /**
   * Use custom cache
   */
  withCache(cache: SelectorCache): this {
    this.cache = cache;
    return this;
  }

  /**
   * Set AI provider by name
   * @param provider - Provider name (e.g., 'groq', 'gemini', 'openai')
   * @param apiKey - Optional API key (will use environment variable if not provided)
   * @param model - Optional model name (will use default for provider if not specified)
   */
  withAIProvider(provider: string, apiKey?: string, model?: string): this {
    // Map user-friendly provider names to AIProvider enum values
    const providerMap: Record<string, AIProvider> = {
      'gemini': AIProvider.GOOGLE_GEMINI,
      'google': AIProvider.GOOGLE_GEMINI,
      'google-gemini': AIProvider.GOOGLE_GEMINI,
      'GOOGLE_GEMINI': AIProvider.GOOGLE_GEMINI,
      'openai': AIProvider.OPENAI,
      'OPENAI': AIProvider.OPENAI,
      'anthropic': AIProvider.ANTHROPIC,
      'claude': AIProvider.ANTHROPIC,
      'ANTHROPIC': AIProvider.ANTHROPIC,
      'deepseek': AIProvider.DEEPSEEK,
      'DEEPSEEK': AIProvider.DEEPSEEK,
      'grok': AIProvider.GROK,
      'GROK': AIProvider.GROK,
      'groq': AIProvider.GROQ,
      'GROQ': AIProvider.GROQ,
      'local': AIProvider.LOCAL,
      'LOCAL': AIProvider.LOCAL,
    };

    const mappedProvider = providerMap[provider.toLowerCase()] || providerMap[provider];
    if (!mappedProvider) {
      throw new Error(`Unknown AI provider: ${provider}. Supported: gemini, openai, anthropic, deepseek, grok, groq, local`);
    }

    // This will be used during build()
    if (!this.customConfig) {
      this.customConfig = {};
    }

    // Use provided model or default model for this provider
    const modelToUse = model || this.getDefaultModelForProvider(mappedProvider);

    this.customConfig.ai = {
      provider: mappedProvider,
      apiKey,
      model: modelToUse,
      timeout: 30000,
      maxRetries: 3,
      visualAnalysisEnabled: true,
    };
    return this;
  }

  /**
   * Get default model for a provider (helper for withAIProvider)
   */
  private getDefaultModelForProvider(provider: AIProvider): string {
    switch (provider) {
      case AIProvider.GOOGLE_GEMINI:
        return 'gemini-2.0-flash-exp';
      case AIProvider.OPENAI:
        return 'gpt-4o';
      case AIProvider.ANTHROPIC:
        return 'claude-3-5-sonnet-20241022';
      case AIProvider.DEEPSEEK:
        return 'deepseek-chat';
      case AIProvider.GROK:
        return 'grok-beta';
      case AIProvider.GROQ:
        return 'llama-3.3-70b-versatile';
      default:
        return 'gemini-2.0-flash-exp';
    }
  }

  /**
   * Set execution strategy
   */
  withStrategy(strategy: ExecutionStrategy): this {
    if (!this.customConfig) {
      this.customConfig = {};
    }
    if (!this.customConfig.performance) {
      this.customConfig.performance = {} as any;
    }
    this.customConfig.performance!.executionStrategy = strategy;
    return this;
  }

  /**
   * Set custom configuration
   */
  withConfiguration(config: Partial<AutoHealConfiguration>): this {
    this.customConfig = config;
    return this;
  }

  /**
   * Build the AutoHealLocator instance
   */
  build(): AutoHealLocator {
    if (!this.adapter) {
      throw new Error('WebAutomationAdapter is required. Use withPlaywrightPage() or withSeleniumDriver()');
    }

    // Load configuration
    const config = loadConfiguration(this.customConfig);

    // Initialize AI service
    const aiService = this.aiService || this.createDefaultAIService(config);

    // Initialize cache
    const cache = this.cache || this.createDefaultCache(config);

    return new AutoHealLocator(this.adapter, aiService, cache, config);
  }

  private createDefaultAIService(config: AutoHealConfiguration): AIService {
    const provider = config.ai.provider;
    let apiKey = config.ai.apiKey;

    // Get API key from environment if not provided in config
    if (!apiKey) {
      switch (provider) {
        case AIProvider.GOOGLE_GEMINI:
          apiKey = process.env.GEMINI_API_KEY;
          break;
        case AIProvider.OPENAI:
          apiKey = process.env.OPENAI_API_KEY;
          break;
        case AIProvider.ANTHROPIC:
          apiKey = process.env.ANTHROPIC_API_KEY;
          break;
        case AIProvider.DEEPSEEK:
          apiKey = process.env.DEEPSEEK_API_KEY;
          break;
        case AIProvider.GROK:
          apiKey = process.env.GROK_API_KEY;
          break;
        case AIProvider.GROQ:
          apiKey = process.env.GROQ_API_KEY;
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    }

    if (!apiKey) {
      throw new Error(
        `AI API key is required for ${provider}. Set ${provider}_API_KEY environment variable or provide apiKey in config`
      );
    }

    // Set default models if not specified
    const model = config.ai.model || this.getDefaultModel(provider);
    const timeout = config.ai.timeout || 30000;

    // Create appropriate service based on provider
    switch (provider) {
      case AIProvider.GOOGLE_GEMINI:
        return new GeminiAIService(apiKey, model, timeout);
      case AIProvider.OPENAI:
        return new OpenAIService(apiKey, model, timeout);
      case AIProvider.ANTHROPIC:
        return new AnthropicService(apiKey, model, timeout);
      case AIProvider.DEEPSEEK:
        return new DeepSeekService(apiKey, model, timeout);
      case AIProvider.GROK:
        return new GrokService(apiKey, model, timeout);
      case AIProvider.GROQ:
        return new GroqAIService(apiKey, model, timeout);
      case AIProvider.LOCAL:
        throw new Error('LOCAL provider requires custom AIService implementation via withAIService()');
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private getDefaultModel(provider: AIProvider): string {
    switch (provider) {
      case AIProvider.GOOGLE_GEMINI:
        return 'gemini-2.0-flash-exp';
      case AIProvider.OPENAI:
        return 'gpt-4o';
      case AIProvider.ANTHROPIC:
        return 'claude-3-5-sonnet-20241022';
      case AIProvider.DEEPSEEK:
        return 'deepseek-chat';
      case AIProvider.GROK:
        return 'grok-beta';
      case AIProvider.GROQ:
        return 'llama-3.3-70b-versatile';
      default:
        return 'gemini-2.0-flash-exp';
    }
  }

  private createDefaultCache(config: AutoHealConfiguration): SelectorCache {
    if (config.cache.type === CacheType.PERSISTENT_FILE) {
      return new FileCache(
        config.cache.cacheDirectory || './autoheal-cache',
        config.cache.maxSize,
        config.cache.expireAfterWriteMs
      );
    } else {
      return new MemoryCache(config.cache.maxSize, config.cache.expireAfterWriteMs);
    }
  }
}

import type { WebDriver, WebElement, By } from 'selenium-webdriver';
import { WebAutomationAdapter } from '../core/WebAutomationAdapter';
import { AutomationFramework } from '../models/AutomationFramework';
import { ElementContext } from '../models/ElementContext';
import { Position } from '../models/Position';

/**
 * Selenium WebDriver adapter implementation for JavaScript/TypeScript
 */
export class SeleniumAdapter implements WebAutomationAdapter {
  constructor(private driver: WebDriver) {}

  getFrameworkType(): AutomationFramework {
    return AutomationFramework.SELENIUM;
  }

  async findElements(selector: string): Promise<WebElement[]> {
    try {
      const by = this.autoDetectBy(selector);
      const elements = await this.driver.findElements(by);
      return elements;
    } catch (error) {
      console.debug(`Failed to find elements with selector: ${selector}`, error);
      return [];
    }
  }

  /**
   * Auto-detect the By locator type from selector string
   */
  private autoDetectBy(selector: string): By {
    // Lazy import to avoid circular dependency
    const { By: SeleniumBy } = require('selenium-webdriver');

    // XPath detection
    if (selector.startsWith('/') || selector.startsWith('(')) {
      return SeleniumBy.xpath(selector);
    }

    // CSS selector patterns
    if (selector.startsWith('#')) {
      return SeleniumBy.css(selector);
    }

    if (selector.startsWith('.')) {
      return SeleniumBy.css(selector);
    }

    if (selector.includes('[') || selector.includes('>') || selector.includes('+')) {
      return SeleniumBy.css(selector);
    }

    // Try as ID first (most common)
    if (!/[\s\.\[\]#>+~]/.test(selector)) {
      return SeleniumBy.id(selector);
    }

    // Default to CSS selector
    return SeleniumBy.css(selector);
  }

  async getPageSource(): Promise<string> {
    return await this.driver.getPageSource();
  }

  async takeScreenshot(): Promise<Buffer> {
    const base64Screenshot = await this.driver.takeScreenshot();
    return Buffer.from(base64Screenshot, 'base64');
  }

  async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  async getElementContext(element: WebElement): Promise<ElementContext> {
    try {
      // Get element properties
      const tagName = await element.getTagName();
      const id = await element.getAttribute('id');
      const className = await element.getAttribute('class');
      const text = await element.getText();

      // Get element rectangle for position
      const rect = await element.getRect();
      const position: Position = {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };

      // Extract common attributes
      const attributes: Record<string, string> = {};
      const commonAttrs = ['id', 'class', 'name', 'type', 'value', 'href', 'src', 'data-testid'];

      for (const attr of commonAttrs) {
        const value = await element.getAttribute(attr);
        if (value) {
          attributes[attr] = value;
        }
      }

      // Get parent container using JavaScript executor
      const parentContainer = await this.driver.executeScript<string>(
        `
        const el = arguments[0];
        const parent = el.parentElement;
        if (!parent) return 'unknown';
        const parentClass = parent.className ? '.' + parent.className.split(' ')[0] : '';
        const parentId = parent.id ? '#' + parent.id : '';
        return parent.tagName.toLowerCase() + parentId + parentClass;
      `,
        element
      );

      // Get sibling elements
      const siblingElements = await this.driver.executeScript<string[]>(
        `
        const el = arguments[0];
        const siblings = Array.from(el.parentElement?.children || []);
        return siblings.slice(0, 5).map(sib => sib.tagName.toLowerCase());
      `,
        element
      );

      return {
        element,
        fingerprint: {
          tagName,
          id: id || undefined,
          className: className || undefined,
          text: text || undefined,
          position,
          parentContainer,
          siblingElements,
        },
        pageUrl: await this.getCurrentUrl(),
        parentContainer,
        relativePosition: position,
        siblingElements,
        attributes,
        textContent: text || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to extract element context: ${error}`);
    }
  }

  /**
   * Get the Selenium WebDriver instance
   */
  getDriver(): WebDriver {
    return this.driver;
  }
}

import type { Page, ElementHandle } from 'playwright';
import { WebAutomationAdapter } from '../core/WebAutomationAdapter';
import { AutomationFramework } from '../models/AutomationFramework';
import { ElementContext } from '../models/ElementContext';
import { Position } from '../models/Position';

/**
 * Playwright adapter implementation for JavaScript/TypeScript
 */
export class PlaywrightAdapter implements WebAutomationAdapter {
  constructor(private page: Page) {}

  getFrameworkType(): AutomationFramework {
    return AutomationFramework.PLAYWRIGHT;
  }

  async findElements(selector: string): Promise<ElementHandle[]> {
    try {
      // Use locator() to support all Playwright selector syntax
      // page.$$() only supports CSS selectors, but page.locator() supports:
      // - text=, role=, data-testid= (Playwright selector engines)
      // - Shadow DOM piercing
      // - Chaining
      // - And all CSS selectors
      const locator = this.page.locator(selector);
      const count = await locator.count();

      if (count === 0) {
        return [];
      }

      // Get all matching locators and convert to element handles
      // Note: Some selectors (like shadow DOM) may not work with elementHandles()
      // In that case, we return a pseudo element handle
      try {
        const elements = await locator.elementHandles();
        return elements;
      } catch (handleError) {
        // If elementHandles() fails (e.g., shadow DOM), create pseudo handles
        // by evaluating the locator. This allows healing to proceed even with
        // complex selectors that don't support ElementHandle conversion
        const pseudoElements: ElementHandle[] = [];
        for (let i = 0; i < count; i++) {
          const nth = locator.nth(i);
          // Return the first element handle if possible, otherwise return a marker
          try {
            const handle = await nth.elementHandle();
            if (handle) pseudoElements.push(handle);
          } catch {
            // Skip elements that can't be converted to handles
          }
        }
        return pseudoElements;
      }
    } catch (error) {
      console.debug(`Failed to find elements with selector: ${selector}`, error);
      return [];
    }
  }

  async getPageSource(): Promise<string> {
    return await this.page.content();
  }

  async takeScreenshot(): Promise<Buffer> {
    return await this.page.screenshot({ fullPage: false });
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async getElementContext(element: ElementHandle): Promise<ElementContext> {
    try {
      // Get element properties
      const tagName = await element.evaluate((el) => (el as Element).tagName.toLowerCase());
      const id = await element.getAttribute('id');
      const className = await element.getAttribute('class');
      const text = await element.textContent();

      // Get bounding box for position
      const boundingBox = await element.boundingBox();
      const position: Position | undefined = boundingBox
        ? {
            x: Math.round(boundingBox.x),
            y: Math.round(boundingBox.y),
            width: Math.round(boundingBox.width),
            height: Math.round(boundingBox.height),
          }
        : undefined;

      // Extract attributes
      const attributes: Record<string, string> = {};
      const commonAttrs = ['id', 'class', 'name', 'type', 'value', 'href', 'src', 'data-testid'];

      for (const attr of commonAttrs) {
        const value = await element.getAttribute(attr);
        if (value) {
          attributes[attr] = value;
        }
      }

      // Get parent container
      const parentContainer = await element.evaluate((el) => {
        const parent = el.parentElement;
        if (!parent) return 'unknown';
        const parentClass = parent.className ? `.${parent.className.split(' ')[0]}` : '';
        const parentId = parent.id ? `#${parent.id}` : '';
        return `${parent.tagName.toLowerCase()}${parentId}${parentClass}`;
      });

      // Get sibling elements (limited to 5)
      const siblingElements = await element.evaluate((el) => {
        const siblings = Array.from(el.parentElement?.children || []);
        return siblings.slice(0, 5).map((sib) => (sib as Element).tagName.toLowerCase());
      });

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
   * Get the Playwright Page object
   */
  getPage(): Page {
    return this.page;
  }
}

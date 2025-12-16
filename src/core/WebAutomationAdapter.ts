import { AutomationFramework } from '../models/AutomationFramework';
import { ElementContext } from '../models/ElementContext';

/**
 * Adapter interface for different automation frameworks (Playwright, Selenium)
 */
export interface WebAutomationAdapter {
  /**
   * Get the framework type
   */
  getFrameworkType(): AutomationFramework;

  /**
   * Find elements using a selector
   */
  findElements(selector: string): Promise<any[]>;

  /**
   * Get page HTML source
   */
  getPageSource(): Promise<string>;

  /**
   * Take a screenshot
   */
  takeScreenshot(): Promise<Buffer>;

  /**
   * Get element context information
   */
  getElementContext(element: any): Promise<ElementContext>;

  /**
   * Get current page URL
   */
  getCurrentUrl(): Promise<string>;
}

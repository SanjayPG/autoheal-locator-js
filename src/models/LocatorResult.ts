import { LocatorStrategy } from './LocatorStrategy';

/**
 * Result of element location attempt
 */
export interface LocatorResult {
  element: any; // WebElement or ElementHandle or Locator
  actualSelector: string;
  strategy: LocatorStrategy;
  executionTimeMs: number;
  fromCache: boolean;
  confidence: number;
  reasoning?: string;
  tokensUsed?: number;
}

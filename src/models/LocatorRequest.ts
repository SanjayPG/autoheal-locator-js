import { LocatorType } from './LocatorType';
import { ElementContext } from './ElementContext';

/**
 * Options for element location
 */
export interface LocatorOptions {
  enableCaching?: boolean;
  timeout?: number;
  retryAttempts?: number;
  strictMode?: boolean;
}

/**
 * Request for element location
 */
export interface LocatorRequest {
  selector: string;
  description: string;
  options?: LocatorOptions;
  locatorType?: LocatorType;
  context?: ElementContext;
  framework?: string;
}

/**
 * Default locator options
 */
export const defaultLocatorOptions: LocatorOptions = {
  enableCaching: true,
  timeout: 30000,
  retryAttempts: 3,
  strictMode: true,
};

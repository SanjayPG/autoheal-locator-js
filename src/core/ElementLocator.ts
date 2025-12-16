import { LocatorRequest } from '../models/LocatorRequest';
import { LocatorResult } from '../models/LocatorResult';

/**
 * Interface for element location strategies
 */
export interface ElementLocator {
  /**
   * Locate an element using the given request
   */
  locate(request: LocatorRequest): Promise<LocatorResult>;

  /**
   * Get the strategy name
   */
  getStrategyName(): string;

  /**
   * Check if this locator can handle the request
   */
  canHandle(request: LocatorRequest): boolean;
}

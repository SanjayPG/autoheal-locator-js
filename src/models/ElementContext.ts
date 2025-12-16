import { ElementFingerprint } from './ElementFingerprint';
import { Position } from './Position';

/**
 * Context information about an element
 */
export interface ElementContext {
  element?: any; // WebElement or ElementHandle
  fingerprint?: ElementFingerprint;
  pageUrl?: string;
  parentContainer?: string;
  relativePosition?: Position;
  siblingElements?: string[];
  attributes?: Record<string, string>;
  textContent?: string;
}

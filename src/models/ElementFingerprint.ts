import { Position } from './Position';

/**
 * Unique fingerprint of an element for caching
 */
export interface ElementFingerprint {
  tagName?: string;
  id?: string;
  className?: string;
  text?: string;
  position?: Position;
  parentContainer?: string;
  siblingElements?: string[];
  computedStyles?: Record<string, string>;
  visualHash?: string;
}

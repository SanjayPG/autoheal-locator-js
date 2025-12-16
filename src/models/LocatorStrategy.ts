/**
 * Strategy used to locate an element
 */
export enum LocatorStrategy {
  ORIGINAL_SELECTOR = 'ORIGINAL_SELECTOR',
  CACHED = 'CACHED',
  DOM_ANALYSIS = 'DOM_ANALYSIS',
  VISUAL_ANALYSIS = 'VISUAL_ANALYSIS',
}

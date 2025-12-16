import { CachedSelector } from '../models/CachedSelector';

/**
 * Cache metrics
 */
export interface CacheMetrics {
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalEntries: number;
  evictionCount: number;
}

/**
 * Interface for selector caching
 */
export interface SelectorCache {
  /**
   * Get cached selector
   */
  get(key: string): CachedSelector | undefined;

  /**
   * Put selector in cache
   */
  put(key: string, selector: CachedSelector): void;

  /**
   * Remove from cache
   */
  remove(key: string): boolean;

  /**
   * Clear all cache
   */
  clearAll(): void;

  /**
   * Get cache size
   */
  size(): number;

  /**
   * Update success/failure for a cached selector
   */
  updateSuccess(key: string, success: boolean): void;

  /**
   * Evict expired entries
   */
  evictExpired(): void;

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics;
}

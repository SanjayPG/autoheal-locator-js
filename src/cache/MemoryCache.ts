import { LRUCache } from 'lru-cache';
import { SelectorCache, CacheMetrics } from '../core/SelectorCache';
import { CachedSelector } from '../models/CachedSelector';

/**
 * In-memory LRU cache implementation
 */
export class MemoryCache implements SelectorCache {
  private cache: LRUCache<string, CachedSelector>;
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;

  constructor(maxSize: number = 1000, ttlMs: number = 24 * 60 * 60 * 1000) {
    this.cache = new LRUCache<string, CachedSelector>({
      max: maxSize,
      ttl: ttlMs,
      updateAgeOnGet: true,
      dispose: () => {
        this.evictionCount++;
      },
    });
  }

  get(key: string): CachedSelector | undefined {
    const value = this.cache.get(key);
    if (value) {
      this.hitCount++;
      return value;
    } else {
      this.missCount++;
      return undefined;
    }
  }

  put(key: string, selector: CachedSelector): void {
    this.cache.set(key, selector);
  }

  remove(key: string): boolean {
    return this.cache.delete(key);
  }

  clearAll(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  size(): number {
    return this.cache.size;
  }

  updateSuccess(key: string, success: boolean): void {
    const cached = this.cache.get(key);
    if (cached) {
      cached.updateSuccess(success);
      this.cache.set(key, cached);
    }
  }

  evictExpired(): void {
    // LRU cache handles expiration automatically
    this.cache.purgeStale();
  }

  getMetrics(): CacheMetrics {
    const total = this.hitCount + this.missCount;
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: total === 0 ? 0 : this.hitCount / total,
      totalEntries: this.cache.size,
      evictionCount: this.evictionCount,
    };
  }
}

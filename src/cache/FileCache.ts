import * as fs from 'fs';
import * as path from 'path';
import { SelectorCache, CacheMetrics } from '../core/SelectorCache';
import { CachedSelector } from '../models/CachedSelector';

/**
 * Persistent file-based cache implementation
 */
export class FileCache implements SelectorCache {
  private cacheDirectory: string;
  private cacheFile: string;
  private cache: Map<string, CachedSelector>;
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;
  private maxSize: number;
  private ttlMs: number;

  constructor(
    cacheDirectory: string = './autoheal-cache',
    maxSize: number = 10000,
    ttlMs: number = 24 * 60 * 60 * 1000
  ) {
    this.cacheDirectory = cacheDirectory;
    this.cacheFile = path.join(cacheDirectory, 'selectors.json');
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();

    this.ensureCacheDirectory();
    this.loadFromDisk();
  }

  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDirectory)) {
      fs.mkdirSync(this.cacheDirectory, { recursive: true });
    }
  }

  private loadFromDisk(): void {
    if (fs.existsSync(this.cacheFile)) {
      try {
        const data = fs.readFileSync(this.cacheFile, 'utf-8');
        const parsed = JSON.parse(data);

        let expiredCount = 0;
        const now = Date.now();

        for (const [key, value] of Object.entries(parsed)) {
          const typedValue = value as any;
          // Check if expired
          if (now - typedValue.timestamp > this.ttlMs) {
            expiredCount++;
            continue;
          }
          const cached = Object.assign(new CachedSelector(typedValue.selector), typedValue);
          this.cache.set(key, cached);
        }

        console.log(`[FILE-CACHE] Loaded ${this.cache.size} entries from cache file, ${expiredCount} expired entries skipped`);
        console.log(`[FILE-CACHE] Initialized persistent file cache at: ${this.cacheDirectory}`);
      } catch (error) {
        console.error('[FILE-CACHE] Failed to load cache from disk:', error);
      }
    } else {
      console.log(`[FILE-CACHE] No existing cache file found, initializing empty cache at: ${this.cacheDirectory}`);
    }
  }

  private saveToDisk(): void {
    try {
      this.ensureCacheDirectory();
      const data: Record<string, any> = {};
      for (const [key, value] of this.cache.entries()) {
        data[key] = value;
      }

      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save cache to disk:', error);
    }
  }

  get(key: string): CachedSelector | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Check if expired
      if (Date.now() - value.timestamp > this.ttlMs) {
        this.cache.delete(key);
        this.missCount++;
        console.log(`[FILE-CACHE] Cache EXPIRED: ${key}`);
        return undefined;
      }
      this.hitCount++;
      console.log(`[FILE-CACHE] Cache HIT: ${key}`);
      return value;
    } else {
      this.missCount++;
      console.log(`[FILE-CACHE] Cache MISS: ${key}`);
      return undefined;
    }
  }

  put(key: string, selector: CachedSelector): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.evictionCount++;
      }
    }

    this.cache.set(key, selector);

    // Calculate expiry time
    const expiryHours = Math.round(this.ttlMs / (60 * 60 * 1000));
    console.log(`[FILE-CACHE] Cache STORED: ${key} (expires in ${expiryHours} hours)`);

    this.saveToDisk();
  }

  remove(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.saveToDisk();
    }
    return result;
  }

  clearAll(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.saveToDisk();
  }

  size(): number {
    return this.cache.size;
  }

  updateSuccess(key: string, success: boolean): void {
    const cached = this.cache.get(key);
    if (cached) {
      cached.updateSuccess(success);
      this.cache.set(key, cached);
      this.saveToDisk();
    }
  }

  evictExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttlMs) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.evictionCount++;
    }

    if (keysToDelete.length > 0) {
      this.saveToDisk();
      console.log(`Evicted ${keysToDelete.length} expired cache entries`);
    }
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

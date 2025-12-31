import { metrics } from "./monitoring";

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

export interface CacheEntry<T> {
  value: T;
  expires: number;
}

export class MetricsCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 3600000) { // Default 1 hour
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      metrics.trackCacheMiss();
      return undefined;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      metrics.trackCacheMiss();
      metrics.trackCacheDelete();
      return undefined;
    }

    metrics.trackCacheHit();
    return entry.value;
  }

  set(key: string, value: T, options?: CacheOptions): void {
    const ttl = options?.ttl || this.defaultTTL;
    const expires = Date.now() + ttl;
    
    this.cache.set(key, { value, expires });
    metrics.trackCacheSet();
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      metrics.trackCacheDelete();
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    
    // Track all deletions
    for (let i = 0; i < size; i++) {
      metrics.trackCacheDelete();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      metrics.trackCacheDelete();
      return false;
    }

    return true;
  }

  size(): number {
    // Clean expired entries first
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expires) {
        this.cache.delete(key);
        metrics.trackCacheDelete();
      }
    }
    
    return this.cache.size;
  }
}

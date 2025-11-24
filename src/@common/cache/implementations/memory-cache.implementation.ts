import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ICache } from '../interfaces/cache.interface';

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class MemoryCache implements ICache, OnModuleDestroy {
  private readonly logger = new Logger(MemoryCache.name);
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const entry: CacheEntry = {
      value: typeof value === 'string' ? value : JSON.stringify(value),
      expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
    };
    this.cache.set(key, entry);
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async setAndKeepTTL(key: string, value: any): Promise<void> {
    const existing = this.cache.get(key);
    const entry: CacheEntry = {
      value: typeof value === 'string' ? value : JSON.stringify(value),
      expiresAt: existing?.expiresAt,
    };
    this.cache.set(key, entry);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async remember<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const value = await this.get(key);
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    }

    const result = await fn();
    await this.set(key, JSON.stringify(result), ttl);
    return result;
  }

  async getOrSet<T>(
    key: string,
    ttl: number,
    valueOrFn: T | (() => Promise<T>),
  ): Promise<T> {
    const cached = await this.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return cached as T;
      }
    }

    // If valueOrFn is a function, execute it; otherwise use the value directly
    const result =
      typeof valueOrFn === 'function'
        ? await (valueOrFn as () => Promise<T>)()
        : valueOrFn;

    await this.set(key, JSON.stringify(result), ttl);
    return result;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Get cache statistics (useful for debugging)
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}


import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { ICache } from '../interfaces/cache.interface';

@Injectable()
export class RedisCache implements ICache, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCache.name);
  private cache: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisEnabled = this.configService.get<boolean>('cache.redis.enabled');
    const cacheType = this.configService.get<string>('cache.type') || 'memory';

    // Only initialize Redis if explicitly enabled
    // Check both the enabled flag and cache type
    const shouldInitialize = redisEnabled === true && cacheType === 'redis';
    
    if (!shouldInitialize) {
      this.logger.log(
        `Redis cache disabled (enabled: ${redisEnabled}, type: ${cacheType}), skipping initialization`,
      );
      return;
    }

    this.logger.log('Initializing Redis cache...');

    const options = {
      port: this.configService.get<number>('cache.redis.port') || 6379,
      host: this.configService.get<string>('cache.redis.host') || 'localhost',
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    };

    this.cache = new Redis(options);

    this.cache.on('connect', () => {
      this.logger.log('Redis cache connected');
    });

    this.cache.on('error', (error) => {
      this.logger.error('Redis cache error:', error);
    });

    this.cache.on('close', () => {
      this.logger.warn('Redis cache connection closed');
    });

    // Attempt to connect, but don't fail if Redis is not available
    try {
      await this.cache.connect();
    } catch (error) {
      this.logger.warn(
        'Failed to connect to Redis. Cache operations will fail gracefully.',
      );
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.cache) {
      return null;
    }
    try {
      return await this.cache.get(key);
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.cache) {
      return;
    }
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl !== undefined && ttl !== null) {
        await this.cache.set(key, stringValue, 'EX', ttl);
      } else {
        await this.cache.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.cache) {
      return;
    }
    try {
      await this.cache.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
    }
  }

  async setAndKeepTTL(key: string, value: any): Promise<void> {
    if (!this.cache) {
      return;
    }
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.cache.set(key, stringValue, 'KEEPTTL');
    } catch (error) {
      this.logger.error(`Error setting key ${key} with KEEPTTL:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.cache) {
      return false;
    }
    try {
      const numberOfMatches = await this.cache.exists(key);
      return numberOfMatches > 0;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async remember<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (!this.cache) {
      // If Redis is not initialized, just execute the function
      return await fn();
    }
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
    if (!this.cache) {
      // If Redis is not initialized, just return the value or execute the function
      return typeof valueOrFn === 'function'
        ? await (valueOrFn as () => Promise<T>)()
        : valueOrFn;
    }
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

  async onModuleDestroy(): Promise<void> {
    if (this.cache) {
      await this.cache.quit();
      this.logger.log('Redis cache disconnected');
    }
  }
}


import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICache } from './interfaces/cache.interface';
import { MemoryCache } from './implementations/memory-cache.implementation';
import { RedisCache } from './implementations/redis-cache.implementation';

@Injectable()
export class CacheService implements ICache, OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private cache: ICache;

  constructor(
    private readonly configService: ConfigService,
    private readonly memoryCache: MemoryCache,
    private readonly redisCache: RedisCache,
  ) {}

  onModuleInit() {
    const cacheType = this.configService.get<string>('cache.type') || 'memory';
    const redisEnabled = this.configService.get<boolean>('cache.redis.enabled');

    // Use Redis if explicitly enabled, otherwise use memory cache
    if (cacheType === 'redis' && redisEnabled) {
      this.cache = this.redisCache;
      this.logger.log('Using Redis cache');
    } else {
      this.cache = this.memoryCache;
      this.logger.log('Using in-memory cache');
      if (cacheType === 'redis' && !redisEnabled) {
        this.logger.warn(
          'Redis cache requested but not enabled. Falling back to in-memory cache.',
        );
      }
    }
  }

  async get(key: string): Promise<string | null> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    return this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    return this.cache.del(key);
  }

  async setAndKeepTTL(key: string, value: any): Promise<void> {
    return this.cache.setAndKeepTTL(key, value);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.exists(key);
  }

  async remember<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    return this.cache.remember(key, ttl, fn);
  }

  async getOrSet<T>(
    key: string,
    ttl: number,
    valueOrFn: T | (() => Promise<T>),
  ): Promise<T> {
    return this.cache.getOrSet(key, ttl, valueOrFn);
  }
}

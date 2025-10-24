import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private cache: Redis;

  constructor(private readonly configService: ConfigService) {
    const options = {
      port: this.configService.getOrThrow('REDIS_PORT'),
      host: this.configService.getOrThrow('REDIS_HOST'),
    };
    this.cache = new Redis(options);
  }

  async get(key: string): Promise<string> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number) {
    if (ttl !== undefined && ttl !== null)
      await this.cache.set(key, value, 'EX', ttl);
    else await this.cache.set(key, value);
  }

  async del(key: string) {
    await this.cache.del(key);
  }

  async setAndKeepTTL(key: string, value: any) {
    await this.cache.set(key, value, 'KEEPTTL');
  }

  async exists(key: string): Promise<boolean> {
    const numberOfMatches = await this.cache.exists(key);
    return numberOfMatches > 0;
  }

  async remember<T>(
    key: string,
    ttl: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const value = await this.get(key);
    if (value) return JSON.parse(value);
    const result = await fn();
    await this.set(key, JSON.stringify(result), ttl);
    return result;
  }
}

import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { MemoryCache } from './implementations/memory-cache.implementation';
import { RedisCache } from './implementations/redis-cache.implementation';

@Module({
  providers: [CacheService, MemoryCache, RedisCache],
  exports: [CacheService],
})
export class CacheModule {}

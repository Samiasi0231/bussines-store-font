import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class RedisService {
  private client;

  constructor() {
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });
    this.client.connect();
  }

  async set(key: string, value: string, ttlSeconds: number) {
    return this.client.set(key, value, { EX: ttlSeconds });
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async del(key: string) {
    return this.client.del(key);
  }
}



// import { Injectable } from '@nestjs/common';
// import Redis from 'ioredis';

// @Injectable()
// export class RedisService {
//   private client: Redis;

//   constructor() {
//     this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
//   }

//   async set(key: string, value: string, ttlSeconds: number) {
//     await this.client.set(key, value, 'EX', ttlSeconds);
//   }

//   async get(key: string): Promise<string | null> {
//     return this.client.get(key);
//   }

//   async del(key: string) {
//     return this.client.del(key);
//   }
// }

import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';

@Module({
  imports: [ConfigModule],
  providers: [SmsService, RedisService],
  controllers: [SmsController],
})
export class SmsModule {}

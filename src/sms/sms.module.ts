import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../@common/cache/cache.module';

@Module({
  imports: [ConfigModule, CacheModule],
  providers: [SmsService],
  controllers: [SmsController],
})
export class SmsModule {}

import { Global, Module } from '@nestjs/common';
import { ResponseService } from '../response';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { ImageRecognitionModule } from '../../image-recognition/image-recognition.module';
import { NotificationModule } from '../../notification/notification.module';

const providers = [ResponseService];

@Global()
@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
  ],
  providers,
  exports: [
    ...providers,
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
  ],
})
export class GlobalModule {}

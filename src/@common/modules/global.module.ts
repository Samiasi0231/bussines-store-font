import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status } from '../../entities/status.entity';
import { ResponseService } from '../response';
import { StatusRepository } from '../../repositories/status.repository';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { ImageRecognitionModule } from '../../image-recognition/image-recognition.module';
import { NotificationModule } from '../../notification/notification.module';

const providers = [ResponseService, StatusRepository];

const databaseEntitities = [Status];
@Global()
@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
    TypeOrmModule.forFeature(databaseEntitities),
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

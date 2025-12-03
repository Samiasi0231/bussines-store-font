import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { AwsS3Service } from '../@common/services/aws-s3.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../entities/file.entity';
import { UploadPresignedService, UploadPublicService } from './services';
import { AwsS3PresignedService } from './utils/upload.private.aws-s3.service';
import { AwsS3PublicService } from './utils/upload.public.aws-s3.service';
import {
  UploadPresignedController,
  UploadPublicController,
} from './controllers';
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([FileEntity])],
  providers: [
    UploadService,
    AwsS3Service,
    UploadPresignedService,
    UploadPublicService,
    AwsS3PresignedService,
    AwsS3PublicService,
  ],
  controllers: [UploadPresignedController, UploadPublicController],
})
export class UploadModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { FileEntity } from '../entities/file.entity';
import { UploadPublicService } from './services/upload.public.service';
import { UploadPresignedService } from './services/upload.private.service';
import { AwsS3PublicService } from './utils/upload.public.aws-s3.service';
import { AwsS3PresignedService } from './utils/upload.private.aws-s3.service';
import { UploadPublicController } from './controllers/upload.public.controller';
import { UploadPresignedController } from './controllers/upload.private.controller';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AwsS3Service } from '../@common/services/aws-s3.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([FileEntity])],
  providers: [
    AwsS3Service,
    UploadService,
    UploadController,
    UploadPublicService,
    UploadPresignedService,
    AwsS3PublicService,
    AwsS3PresignedService,
  ],
  controllers: [UploadController, UploadPublicController, UploadPresignedController],
})
export class UploadModule {}

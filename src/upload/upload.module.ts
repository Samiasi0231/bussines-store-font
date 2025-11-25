import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { AwsS3Service } from '../@common/services/aws-s3.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../entities/file.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([FileEntity])
  ],
  providers: [UploadService, AwsS3Service],
  controllers: [UploadController],
})
export class UploadModule {}

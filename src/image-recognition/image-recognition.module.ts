import { Module } from '@nestjs/common';
import { ImageRecognitionService } from './services/image-recognition.service';
import { AWSImageRecognitionService } from './services/aws.service';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [SystemSettingsModule],
  providers: [ImageRecognitionService, AWSImageRecognitionService],
  exports: [ImageRecognitionService, AWSImageRecognitionService],
})
export class ImageRecognitionModule {}

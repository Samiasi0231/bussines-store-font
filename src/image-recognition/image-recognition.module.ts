import { Module } from '@nestjs/common';
import { ImageRecognitionService } from './services/image-recognition.service';
import { AWSImageRecognitionService } from './services/aws.service';

@Module({
  providers: [ImageRecognitionService, AWSImageRecognitionService],
  exports: [ImageRecognitionService, AWSImageRecognitionService],
})
export class ImageRecognitionModule {}

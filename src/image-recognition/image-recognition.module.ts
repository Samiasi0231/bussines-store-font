import { Global, Module } from '@nestjs/common';
import { ImageRecognitionService } from './services/image-recognition.service';
import { AWSImageRecognitionService } from './services/aws.service';

@Global()
@Module({
  providers: [ImageRecognitionService, AWSImageRecognitionService],
  exports: [ImageRecognitionService, AWSImageRecognitionService],
})
export class ImageRecognitionModule {}

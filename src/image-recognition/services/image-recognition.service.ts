import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorMessage } from '../../@common/constants/message.constant';
import {
  FaceComparisonResponse,
  IImageRecognitionService,
} from '../interfaces/image-recognition.interface';
import { Provider } from '../../@common/constants/providers.constant';
import { AWSImageRecognitionService } from './aws.service';

@Injectable()
export class ImageRecognitionService implements IImageRecognitionService {
  private similarityThreshold: number;
  private providerName: Provider;
  private provider: IImageRecognitionService;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsService: AWSImageRecognitionService,
  ) {
    //TODO: move to system settings
    this.similarityThreshold = parseInt(
      this.configService.get('SIMILARITY_THRESHOLD', '90'),
    );

    this.providerName = this.configService.get<Provider>(
      'IMAGE_RECOGNITION_PROVIDER',
      Provider.AWS,
    );
    this.provider = this.getProvider();
  }

  private getProvider(): IImageRecognitionService {
    let provider: IImageRecognitionService;
    switch (this.providerName) {
      case Provider.AWS:
        provider = this.awsService;
        break;
      default:
        ///TODO: log error
        throw new BadRequestException(ErrorMessage.AN_ERROR_OCCURRED);
    }

    return provider;
  }

  async compareFaces(
    sourceImage: string,
    targetImage: string,
    similarityThreshold: number = this.similarityThreshold,
  ): FaceComparisonResponse {
    return this.provider.compareFaces(
      sourceImage,
      targetImage,
      similarityThreshold,
    );
  }
}

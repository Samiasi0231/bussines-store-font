import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import {
  FaceComparisonResponse,
  IImageRecognitionService,
} from '../interfaces/image-recognition.interface';
import { Provider } from '../../@common/constants/providers.constant';
import { AWSImageRecognitionService } from './aws.service';
import { ResponseService } from '../../@common/response';

@Injectable()
export class ImageRecognitionService implements IImageRecognitionService {
  private similarityThreshold: number;
  private providerName: Provider;
  private provider: IImageRecognitionService;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsService: AWSImageRecognitionService,
    private readonly responseService: ResponseService,
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
    // const response = await this.provider.compareFaces(
    //   sourceImage,
    //   targetImage,
    //   similarityThreshold,
    // );

    // response.data.provider = this.providerName;

    // return response;

    //Temporarily disable face notification

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { providerResponse: {} as any, provider: this.providerName },
    );
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SuccessMessage } from '../../@common/constants/message.constant';
import {
  FaceComparisonResponse,
  IImageRecognitionService,
} from '../interfaces/image-recognition.interface';
import { Provider } from '../../@common/constants/providers.constant';
import { AWSImageRecognitionService } from './aws.service';
import { ResponseService } from '../../@common/response';
import {
  DefaultProviderConfig,
  SystemSettingsService,
} from '../../system-settings/system-settings.service';

@Injectable()
export class ImageRecognitionService
  implements IImageRecognitionService, OnModuleInit
{
  private similarityThreshold: number;
  private providerName: Provider;
  private provider: IImageRecognitionService;

  constructor(
    private readonly configService: ConfigService,
    private readonly awsService: AWSImageRecognitionService,
    private readonly responseService: ResponseService,
    private readonly systemSettingsSevice: SystemSettingsService,
  ) {
    //TODO: move to system settings
    this.similarityThreshold = parseInt(
      this.configService.get('SIMILARITY_THRESHOLD', '90'),
    );
  }

  async onModuleInit() {
    this.providerName = this.systemSettingsSevice.getDefaultProvider(
      DefaultProviderConfig.IMAGE_RECOGNITION,
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
        provider = this.awsService;
        break;
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

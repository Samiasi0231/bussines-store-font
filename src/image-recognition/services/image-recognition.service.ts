import { Injectable } from '@nestjs/common';
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
export class ImageRecognitionService implements IImageRecognitionService {
  private similarityThreshold: number;
  private _providerName: Provider;

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

  private get provider(): IImageRecognitionService {
    let provider: IImageRecognitionService;
    switch (this._providerName) {
      case Provider.AWS:
        provider = this.awsService;
        break;
      default:
        provider = this.awsService;
        break;
    }

    return provider;
  }

  private get providerName(): Provider {
    this._providerName = this.systemSettingsSevice.getDefaultProvider(
      DefaultProviderConfig.IMAGE_RECOGNITION,
    );
    return this._providerName;
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

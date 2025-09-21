import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Credentials, Rekognition } from 'aws-sdk';
import { ResponseService } from '../../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import {
  FaceComparisonResponse,
  IImageRecognitionService,
} from '../interfaces/image-recognition.interface';

@Injectable()
export class AWSImageRecognitionService
  implements IImageRecognitionService, OnModuleInit
{
  private readonly awsRegion: string;
  private readonly awsAccessKeyId: string;
  private readonly awsSecretAccessKey: string;
  private rekognition: Rekognition;

  constructor(
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
  ) {
    this.awsRegion = this.configService.get('aws.region', 'eu-west-1');
    this.awsAccessKeyId = this.configService.get('aws.serviceKey', '*****');
    this.awsSecretAccessKey = this.configService.get('aws.secretKey', '*****');
  }

  async onModuleInit() {
    this.rekognition = new Rekognition({
      region: this.awsRegion,
      credentials: new Credentials({
        accessKeyId: this.awsAccessKeyId,
        secretAccessKey: this.awsSecretAccessKey,
      }),
    });
  }

  async compareFaces(
    sourceImage: string,
    targetImage: string,
    similarityThreshold: number,
  ): FaceComparisonResponse {
    try {
      const comparisonResponse = await this.rekognition
        .compareFaces({
          SourceImage: {
            Bytes: Buffer.from(sourceImage, 'base64'),
          },
          TargetImage: {
            Bytes: Buffer.from(targetImage, 'base64'),
          },
          SimilarityThreshold: similarityThreshold,
        })
        .promise();

      if (
        comparisonResponse.FaceMatches &&
        comparisonResponse.FaceMatches.length > 0
      ) {
        return this.responseService.sendSuccess(
          SuccessMessage.FACE_COMPARISON,
          { providerResponse: comparisonResponse },
        );
      }

      return this.responseService.sendError(ErrorMessage.MISMATCHED_FACES, {
        providerResponse: comparisonResponse,
      });
    } catch (error) {
      //TODO: log error
      return this.responseService.sendError(ErrorMessage.FACE_COMPARISON);
    }
  }
}

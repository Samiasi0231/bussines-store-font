import { Rekognition, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { IResponse } from '../../@common/response';

export type FaceComparisonResponse = Promise<
  IResponse<{
    providerResponse: PromiseResult<Rekognition.CompareFacesResponse, AWSError>;
  }>
>;

export abstract class IImageRecognitionService {
  abstract compareFaces(
    sourceImage: string,
    targetImage: string,
    similarityThreshold: number,
  ): FaceComparisonResponse;
}

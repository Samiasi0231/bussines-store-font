import { Rekognition, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { IResponse } from '../../@common/response';
import { Provider } from '../../@common/constants/providers.constant';

export type FaceComparisonResponse = Promise<
  IResponse<{
    provider?: Provider;
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

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IIdentityService } from '../interfaces/IIdentity.service';
import {
  DojahBvnResponseData,
  DojahNinResponseData,
} from '../interfaces/dojah.interface';
import {
  IdentityVerificationType,
  VerifyBvnRequest,
  VerifyBvnResponseData,
  VerifyNINRequest,
  VerifyNINResponseData,
} from '../dtos/identity.dto';
import { HttpService } from '@nestjs/axios';
import { IResponse, ResponseService } from '../../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import { handleHttpError } from '../../@common/utilities/error-handling.utility';
import { Gender } from '../../@common/constants/gender.constant';

@Injectable()
export class DojahService implements IIdentityService {
  private baseURL: string;
  private headers: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpClient: HttpService,
    private response: ResponseService,
  ) {
    this.baseURL = this.configService.get('dojah.baseUrl');
    this.headers = this.configService.get('dojah.authorization');
  }

  private getServiceUrl(type: IdentityVerificationType) {
    return this.configService.get(`dojah.urls.${type}`);
  }

  async verifyBVN(
    payload: VerifyBvnRequest,
  ): Promise<IResponse<VerifyBvnResponseData>> {
    const verificationType = IdentityVerificationType.BVN;
    const { data: response } = await this.httpClient.axiosRef
      .get<DojahBvnResponseData>(
        `${this.baseURL}${this.getServiceUrl(verificationType)}${payload.bvn}`,
        {
          headers: this.headers,
        },
      )
      .catch((error) => handleHttpError(error));

    if (response.status !== 200) {
      return this.response.sendError(
        ErrorMessage.IDENTITY_VERIFICATION(verificationType),
        { providerResponse: response } as VerifyBvnResponseData,
      );
    }

    const responseData = response.data;

    const data = {
      bvn: payload.bvn,
      firstName: responseData?.entity?.first_name,
      lastName: responseData?.entity?.last_name,
      middleName: responseData?.entity?.middle_name,
      phoneNumber: responseData?.entity?.phone_number1,
      dateOfBirth: responseData?.entity?.date_of_birth,
      gender:
        String(responseData?.entity?.gender).toLowerCase() === 'male'
          ? Gender.MALE
          : Gender.FEMALE,
      providerResponse: response,
    };

    return this.response.sendSuccess(
      SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      data,
    );
  }

  async verifyNIN(
    payload: VerifyNINRequest,
  ): Promise<IResponse<VerifyNINResponseData>> {
    const verificationType = IdentityVerificationType.NIN;
    const { data: response } = await this.httpClient.axiosRef
      .get<DojahNinResponseData>(
        `${this.baseURL}${this.getServiceUrl(verificationType)}${payload.nin}`,
        {
          headers: this.headers,
        },
      )
      .catch((error) => handleHttpError(error));

    if (response.status !== 200) {
      return this.response.sendError(
        ErrorMessage.IDENTITY_VERIFICATION(verificationType),
      );
    }

    const responseData = response.data;

    const data = {
      nin: payload.nin,
      firstName: responseData?.entity?.first_name,
      lastName: responseData?.entity?.last_name,
      middleName: responseData?.entity?.middle_name,
      phoneNumber: responseData?.entity?.phone_number,
      dateOfBirth: responseData?.entity?.date_of_birth,
      gender:
        String(responseData?.entity?.gender).toLowerCase() === 'male'
          ? Gender.MALE
          : Gender.FEMALE,
      providerResponse: response,
    };

    return this.response.sendSuccess(
      SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      data,
    );
  }
}

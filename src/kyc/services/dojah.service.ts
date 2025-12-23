import { HttpStatus, Injectable } from '@nestjs/common';
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
import { Util } from '../../@common/utilities/helpers.utility';
import { CACLookupData } from '../dtos/cac.dto';

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
    this.headers = this.configService.get('dojah.headers');
  }

  private getServiceUrl(type: string) {
    return this.configService.get(`dojah.urls.${type}`);
  }

  private mapGender(gender: string): Gender {
    if (!gender) return Gender.MALE;
    const normalizedGender = gender.toLowerCase();
    return normalizedGender === 'female' ? Gender.FEMALE : Gender.MALE;
  }

  async verifyBVN(
    payload: VerifyBvnRequest,
  ): Promise<IResponse<VerifyBvnResponseData>> {
    const verificationType = IdentityVerificationType.BVN;

    console.log('=== BVN Verification Debug Start ===');
    console.log('Input BVN:', payload.bvn);
    console.log('Is Production:', Util.isProduction());

    const fullUrl = `${this.baseURL}${this.getServiceUrl('bvn')}?bvn=${payload.bvn}`;
    console.log('Full URL:', fullUrl);
    console.log('Headers:', this.headers);

    let httpResponse;
    try {
      httpResponse = await this.httpClient.axiosRef.get<DojahBvnResponseData>(
        fullUrl,
        {
          headers: this.headers,
        },
      );
      console.log('HTTP Response Status:', httpResponse.status);
      console.log(
        'HTTP Response Data:',
        JSON.stringify(httpResponse.data, null, 2),
      );
    } catch (error) {
      console.error('HTTP Request Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);

      const handledError = handleHttpError(error);
      httpResponse = {
        ...handledError,
        data: {
          message: handledError.message,
        } as any,
      };
      console.log('Handled Error Response:', httpResponse);
    }

    const response = httpResponse.data;
    console.log('Extracted Response Data:', response);

    if (httpResponse.status === 404) {
      console.log('Error: BVN not found (404)');
      return this.response.sendError(
        ErrorMessage.INVALID_BVN,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    if (httpResponse.status !== 200) {
      console.log('Error: Non-200 status code:', httpResponse.status);
      return this.response.sendError(
        ErrorMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      );
    }

    const data: VerifyBvnResponseData = {
      bvn: payload.bvn,
      firstName: response?.entity?.first_name,
      lastName: response?.entity?.last_name,
      middleName: response?.entity?.middle_name,
      phoneNumber: response?.entity?.phone_number1,
      dateOfBirth: response?.entity?.date_of_birth,
      gender: this.mapGender(response?.entity?.gender),
      providerResponse: response as any,
    };

    console.log('Mapped BVN Data:', data);
    console.log('=== BVN Verification Debug End ===');

    return this.response.sendSuccess(
      SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      data,
    );
  }

  async verifyNIN(
    payload: VerifyNINRequest,
  ): Promise<IResponse<VerifyNINResponseData>> {
    const verificationType = IdentityVerificationType.NIN;

    console.log('=== NIN Verification Debug Start ===');
    console.log('Input NIN:', payload.nin);
    console.log('Is Production:', Util.isProduction());

    const fullUrl = `${this.baseURL}${this.getServiceUrl('nin')}?nin=${payload.nin}`;
    console.log('Full URL:', fullUrl);


    let httpResponse;
    try {
      httpResponse = await this.httpClient.axiosRef.get<DojahNinResponseData>(
        fullUrl,
        {
          headers: this.headers,
        },
      );
      console.log('HTTP Response Status:', httpResponse.status);
      console.log(
        'HTTP Response Data:',
        JSON.stringify(httpResponse.data, null, 2),
      );
    } catch (error) {
      console.error('HTTP Request Error:', error);
      console.error('Error Response:', error.response?.data);
      console.error('Error Status:', error.response?.status);

      const handledError = handleHttpError(error);
      httpResponse = {
        ...handledError,
        data: {
          message: handledError.message,
        } as any,
      };
      console.log('Handled Error Response:', httpResponse);
    }

    const response = httpResponse.data;
    console.log('Extracted Response Data:', response);

    if (httpResponse.status === 404) {
      console.log('Error: NIN not found (404)');
      return this.response.sendError(
        ErrorMessage.INVALID_NIN,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    if (httpResponse.status !== 200) {
      console.log('Error: Non-200 status code:', httpResponse.status);
      return this.response.sendError(
        ErrorMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      );
    }

    const data: VerifyNINResponseData = {
      nin: payload.nin,
      firstName: response?.entity?.first_name,
      lastName: response?.entity?.last_name,
      middleName: response?.entity?.middle_name,
      phoneNumber: response?.entity?.phone_number,
      dateOfBirth: response?.entity?.date_of_birth,
      gender: this.mapGender(response?.entity?.gender),
      providerResponse: response as any,
    };


    return this.response.sendSuccess(
      SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      data,
    );
  }

  async lookupCAC(
    regNumber: string,
    companyType?: string,
    country?: string,
  ): Promise<IResponse<CACLookupData>> {
    if (!Util.isProduction()) {
      if (regNumber.includes('111')) {
        console.log('Error: regNumber contains 111 (simulated error in dev)');
        return this.response.sendError(ErrorMessage.CAC_LOOKUP);
      }
    }

    const VALID_TEST_REG_NUMBER = '14320749';

    const rcNumber =
      Util.isProduction() || (!Util.isProduction() && regNumber.includes('000'))
        ? regNumber
        : VALID_TEST_REG_NUMBER;

    const defaultCompanyType = 'BUSINESS_NAME';
    const companyTypeToUse = companyType || defaultCompanyType;

    const fullUrl = `${this.baseURL}${this.getServiceUrl('cac')}?rc_number=${regNumber}&company_type=${companyTypeToUse}`;

    let httpResponse;
    try {
      httpResponse = await this.httpClient.axiosRef.get<
        IResponse<CACLookupData>
      >(fullUrl, {
        headers: this.headers,
      });
      console.log('HTTP Response Status:', httpResponse.status);
      console.log(
        'HTTP Response Data:',
        JSON.stringify(httpResponse.data, null, 2),
      );
    } catch (error) {
      console.error('HTTP Request Error:', error);

      const handledError = handleHttpError(error);
      httpResponse = {
        ...handledError,
        data: {
          message: handledError.message,
        } as any,
      };
      console.log('Handled Error Response:', httpResponse);
    }

    const response = httpResponse.data;
    console.log('Extracted Response Data:', response);
    console.log('Response Entity:', response?.entity);

    if (httpResponse.status === 404) {
      console.log('Error: RC Number not found (404)');
      return this.response.sendError(
        ErrorMessage.INVALID_RC_NUMBER,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    if (httpResponse.status !== 200) {
      console.log('Error: Non-200 status code:', httpResponse.status);
      return this.response.sendError(ErrorMessage.CAC_LOOKUP);
    }

    const data: CACLookupData = {
      companyName: response?.entity?.company_name,
      companyType: response?.entity?.type_of_company,
      address: response?.entity?.address,
      status: response?.entity?.status,
      registrationDate: response?.entity?.date_of_registration,
      rcNumber: response?.entity?.rc_number,
      email: response?.entity?.email,
      state: response?.entity?.state,
      city: response?.entity?.city,
      lga: response?.entity?.lga,
      business: response?.entity?.business,
    };

    console.log('Mapped CAC Data:', data);
    console.log('=== CAC Lookup Debug End ===');

    return this.response.sendSuccess(SuccessMessage.CAC_LOOKUP, data);
  }
}

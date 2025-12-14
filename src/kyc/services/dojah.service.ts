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

  async verifyBVN(
    payload: VerifyBvnRequest,
  ): Promise<IResponse<VerifyBvnResponseData>> {
    const verificationType = IdentityVerificationType.BVN;

    const data: VerifyBvnResponseData = {
      bvn: payload.bvn,
      firstName: 'JOSHUA',
      lastName: 'ISAAC',
      middleName: 'THOMPSONBROWN',
      phoneNumber: '07012345678',
      dateOfBirth: '2000-06-28',
      gender: Gender.MALE,
      providerResponse: {
        entity: {
          bvn: payload.bvn,
          first_name: 'JOSHUA',
          last_name: 'ISAAC',
          middle_name: 'THOMPSONBROWN',
          phone_number1: '07012345678',
          date_of_birth: '2000-06-28',
          gender: 'Male',
        },
      } as any,
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

    const data: VerifyNINResponseData = {
      nin: payload.nin,
      firstName: 'JOSHUA',
      lastName: 'ISAAC',
      middleName: 'THOMPSONBROWN',
      phoneNumber: '07012345678',
      dateOfBirth: '2000-06-28',
      gender: Gender.MALE,
      providerResponse: {
        entity: {
          nin: payload.nin,
          first_name: 'JOSHUA',
          last_name: 'ISAAC',
          middle_name: 'THOMPSONBROWN',
          phone_number: '07012345678',
          date_of_birth: '2000-06-28',
          gender: 'Male',
        },
      } as any,
    };

    return this.response.sendSuccess(
      SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      data,
    );
  }

  // async verifyBVN(
  //   payload: VerifyBvnRequest,
  // ): Promise<IResponse<VerifyBvnResponseData>> {
  //   const verificationType = IdentityVerificationType.BVN;

  //   // DEV mode: simulate errors for certain BVNs
  //   if (!Util.isProduction() && payload.bvn.includes('111')) {
  //     return this.response.sendError(
  //       ErrorMessage.IDENTITY_VERIFICATION(verificationType),
  //     );
  //   }

  //   const VALID_TEST_BVN = '22222222222';
  //   const bvn =
  //     Util.isProduction() || payload.bvn.includes('000')
  //       ? payload.bvn
  //       : VALID_TEST_BVN;

  //   // const url = `https://sandbox.dojah.io/api/v1/kyc/bvn/full?bvn=${bvn}`;

  //   let response;
  //   try {
  //     const httpResponse = await this.httpClient.axiosRef.get<
  //       IResponse<DojahBvnResponseData>
  //     >('https://sandbox.dojah.io/api/v1/kyc/bvn/full?bvn=22222222222', {
  //       headers: this.headers,
  //     });

  //     response = httpResponse.data;
  //   } catch (error) {
  //     const handledError = handleHttpError(error);
  //     return this.response.sendError(
  //       ErrorMessage.IDENTITY_VERIFICATION(IdentityVerificationType.BVN),
  //       {
  //         providerResponse: { message: handledError.message },
  //       } as unknown as VerifyBvnResponseData,
  //     );
  //   }

  //   // Check if API returned an error
  //   if (!response || response.message === 'Page Not Found') {
  //     return this.response.sendError(
  //       ErrorMessage.INVALID_BVN,
  //       { providerResponse: response } as VerifyBvnResponseData,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   // Map the response safely
  //   const data: VerifyBvnResponseData = {
  //     bvn,
  //     firstName: response?.entity?.first_name,
  //     lastName: response?.entity?.last_name,
  //     middleName: response?.entity?.middle_name,
  //     phoneNumber: response?.entity?.phone_number1,
  //     dateOfBirth: response?.entity?.date_of_birth,
  //     gender:
  //       String(response?.entity?.gender).toLowerCase() === 'male'
  //         ? Gender.MALE
  //         : Gender.FEMALE,
  //     providerResponse: response,
  //   };

  //   return this.response.sendSuccess(
  //     SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
  //     data,
  //   );
  // }

  // async verifyNIN(
  //   payload: VerifyNINRequest,
  // ): Promise<IResponse<VerifyNINResponseData>> {
  //   const verificationType = IdentityVerificationType.NIN;

  //   if (!Util.isProduction() && payload.nin.includes('111')) {
  //     return this.response.sendError(
  //       ErrorMessage.IDENTITY_VERIFICATION(verificationType),
  //     );
  //   }

  //   const VALID_TEST_NIN = '70123456789';
  //   const nin =
  //     Util.isProduction() || payload.nin.includes('000')
  //       ? payload.nin
  //       : VALID_TEST_NIN;

  //   const url = `${this.baseURL}${this.getServiceUrl(verificationType)}?nin=${nin}`;

  //   let response;
  //   try {
  //     const httpResponse = await this.httpClient.axiosRef.get<
  //       IResponse<DojahNinResponseData>
  //     >(url, {
  //       headers: this.headers,
  //     });
  //     response = httpResponse.data;
  //   } catch (error) {
  //     const handledError = handleHttpError(error);
  //     return this.response.sendError(
  //       ErrorMessage.IDENTITY_VERIFICATION(verificationType),
  //       {
  //         providerResponse: { message: handledError.message },
  //       } as unknown as VerifyNINResponseData,
  //     );
  //   }

  //   if (!response || response.message === 'Page Not Found') {
  //     return this.response.sendError(
  //       ErrorMessage.INVALID_NIN,
  //       { providerResponse: response } as VerifyNINResponseData,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   const data: VerifyNINResponseData = {
  //     nin,
  //     firstName: response?.entity?.first_name,
  //     lastName: response?.entity?.last_name,
  //     middleName: response?.entity?.middle_name,
  //     phoneNumber: response?.entity?.phone_number,
  //     dateOfBirth: response?.entity?.date_of_birth,
  //     gender:
  //       String(response?.entity?.gender).toLowerCase() === 'male'
  //         ? Gender.MALE
  //         : Gender.FEMALE,
  //     providerResponse: response,
  //   };

  //   return this.response.sendSuccess(
  //     SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
  //     data,
  //   );
  // }

  async lookupCAC(
    regNumber: string,
    companyType?: string,
  ): Promise<IResponse<CACLookupData>> {
    console.log('=== CAC Lookup Debug Start ===');
    console.log('Input regNumber:', regNumber);
    console.log('Is Production:', Util.isProduction());

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

    console.log(Util.isProduction());

    console.log('RC Number to use:', rcNumber);
    console.log('Base URL:', this.baseURL);
    console.log('Service URL:', this.getServiceUrl('cac'));

    const defaultCompanyType = 'BUSINESS_NAME';
    const companyTypeToUse = companyType || defaultCompanyType;

    const fullUrl = `${this.baseURL}${this.getServiceUrl('cac')}?rc_number=${regNumber}&company_type=${companyTypeToUse}`;

    console.log('Full URL:', fullUrl);
    console.log('Headers:', this.headers);

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

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

    if (!Util.isProduction()) {
      if (payload.bvn.includes('111')) {
        return this.response.sendError(
          ErrorMessage.IDENTITY_VERIFICATION(verificationType),
        );
      }
    }

    const VALID_TEST_BVN = '22222222222';

    const bvn =
      Util.isProduction() ||
      (!Util.isProduction() && payload.bvn.includes('000'))
        ? payload.bvn
        : VALID_TEST_BVN;

    const httpResponse = await this.httpClient.axiosRef
      .get<IResponse<DojahBvnResponseData>>(
        `${this.baseURL}${this.getServiceUrl(verificationType)}${bvn}`,
        {
          headers: this.headers,
        },
      )
      .catch((error) => {
        const handledError = handleHttpError(error);
        return {
          ...handledError,
          data: {
            message: handledError.message,
          } as any,
        };
      });

    const response = httpResponse.data;

    if (httpResponse.status === 404) {
      return this.response.sendError(
        ErrorMessage.INVALID_BVN,
        {
          providerResponse: response,
        } as VerifyBvnResponseData,
        HttpStatus.NOT_FOUND,
      );
    }

    if (httpResponse.status !== 200) {
      return this.response.sendError(
        ErrorMessage.IDENTITY_VERIFICATION(verificationType),
        { providerResponse: response } as VerifyBvnResponseData,
      );
    }

    const data = {
      bvn: payload.bvn,
      firstName: response?.entity?.first_name,
      lastName: response?.entity?.last_name,
      middleName: response?.entity?.middle_name,
      phoneNumber: response?.entity?.phone_number1,
      dateOfBirth: response?.entity?.date_of_birth,
      gender:
        String(response?.entity?.gender).toLowerCase() === 'male'
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

    if (!Util.isProduction()) {
      if (payload.nin.includes('111')) {
        return this.response.sendError(
          ErrorMessage.IDENTITY_VERIFICATION(verificationType),
        );
      }
    }

    const VALID_TEST_NIN = '70123456789';

    const nin =
      Util.isProduction() ||
      (!Util.isProduction() && payload.nin.includes('000'))
        ? payload.nin
        : VALID_TEST_NIN;

    const httpResponse = await this.httpClient.axiosRef
      .get<IResponse<DojahNinResponseData>>(
        `${this.baseURL}${this.getServiceUrl(verificationType)}${nin}`,
        {
          headers: this.headers,
        },
      )
      .catch((error) => {
        const handledError = handleHttpError(error);
        return {
          ...handledError,
          data: {
            message: handledError.message,
          } as any,
        };
      });

    const response = httpResponse.data;

    if (httpResponse.status === 404) {
      return this.response.sendError(
        ErrorMessage.INVALID_NIN ||
          ErrorMessage.IDENTITY_VERIFICATION(verificationType),
        { providerResponse: response } as VerifyNINResponseData,
        HttpStatus.NOT_FOUND,
      );
    }

    if (httpResponse.status !== 200) {
      return this.response.sendError(
        ErrorMessage.IDENTITY_VERIFICATION(verificationType),
      );
    }

    const data = {
      nin:
        !Util.isProduction() && payload.nin.includes('000')
          ? payload.nin
          : VALID_TEST_NIN,
      firstName: response?.entity?.first_name,
      lastName: response?.entity?.last_name,
      middleName: response?.entity?.middle_name,
      phoneNumber: response?.entity?.phone_number,
      dateOfBirth: response?.entity?.date_of_birth,
      gender:
        String(response?.entity?.gender).toLowerCase() === 'male'
          ? Gender.MALE
          : Gender.FEMALE,
      providerResponse: response,
    };

    return this.response.sendSuccess(
      SuccessMessage.IDENTITY_VERIFICATION(verificationType.toUpperCase()),
      data,
    );
  }

  async lookupCAC(regNumber: string): Promise<IResponse<CACLookupData>> {
    if (!Util.isProduction()) {
      if (regNumber.includes('111')) {
        return this.response.sendError(ErrorMessage.CAC_LOOKUP);
      }
    }

    const VALID_TEST_REG_NUMBER = '14320749';

    const rcNumber =
      Util.isProduction() || (!Util.isProduction() && regNumber.includes('000'))
        ? regNumber
        : VALID_TEST_REG_NUMBER;

    const httpResponse = await this.httpClient.axiosRef
      .get<IResponse<CACLookupData>>(
        `${this.baseURL}${this.getServiceUrl('cac')}${rcNumber}`,
        {
          headers: this.headers,
        },
      )
      .catch((error) => {
        const handledError = handleHttpError(error);
        return {
          ...handledError,
          data: {
            message: handledError.message,
          } as any,
        };
      });

    const response = httpResponse.data;

    if (httpResponse.status === 404) {
      return this.response.sendError(
        ErrorMessage.INVALID_RC_NUMBER,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    if (httpResponse.status !== 200) {
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

    return this.response.sendSuccess(SuccessMessage.CAC_LOOKUP, data);
  }
}

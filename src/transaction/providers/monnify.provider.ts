import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetTransactionByInternalReferenceResponse,
  ITransactionProvider,
} from '../interfaces/transaction-provider.interface';
import { IResponse, ResponseService } from '../../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import { Status } from '../../@common/constants/status.constant';
import { HttpService } from '@nestjs/axios';
import { CacheService } from '../../@common/cache/cache.service';
import { SystemProcess } from '../../@common/constants/system-process.constant';
import { handleHttpError } from '../../@common/utilities/error-handling.utility';
import { PaymentMethod } from '../../@common/constants/payment.constant';

interface MonnifyLoginResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    accessToken: string;
    expiresIn: number;
  };
}

@Injectable()
export class MonnifyProvider implements ITransactionProvider {
  private readonly logger: Logger;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly encodedToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
    private readonly cache: CacheService,
    private readonly httpClient: HttpService,
  ) {
    this.logger = new Logger(MonnifyProvider.name);
    this.apiKey = this.configService.get<string>('monnify.apiKey');
    this.secretKey = this.configService.get<string>('monnify.secretKey');
    this.baseUrl = this.configService.get<string>('monnify.baseUrl');

    this.encodedToken = Buffer.from(
      `${this.apiKey}:${this.secretKey}`,
    ).toString('base64');
  }

  private handleResponseError(
    error: any,
    process: SystemProcess,
  ): IResponse<null> {
    const message =
      error?.responseMessage ||
      error?.message ||
      error?.response?.data?.responseMessage ||
      ErrorMessage.AN_ERROR_OCCURRED;

    this.logger.error({
      process,
      message,
      error,
    });

    throw new BadRequestException(message);
  }

  private async getAuthHeaders(): Promise<{
    Authorization: string;
  }> {
    const key = 'monnify:auth_token';

    const cachedToken = await this.cache.get(key);

    if (cachedToken) {
      return {
        Authorization: `Bearer ${cachedToken}`,
      };
    }

    const httpResponse = await this.httpClient.axiosRef
      .post<MonnifyLoginResponse>(
        `${this.baseUrl}/api/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${this.encodedToken}`,
          },
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

    if (httpResponse.status !== 200) {
      this.handleResponseError(httpResponse.data, SystemProcess.MONNIFY_LOGIN);
    }

    const loginResponseData = httpResponse.data as MonnifyLoginResponse;

    if (!loginResponseData.requestSuccessful) {
      this.handleResponseError(loginResponseData, SystemProcess.MONNIFY_LOGIN);
    }

    const { accessToken, expiresIn } = loginResponseData.responseBody;

    await this.cache.set(key, accessToken, expiresIn);

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  async getTransactionByInternalReference(
    reference: string,
  ): Promise<IResponse<GetTransactionByInternalReferenceResponse>> {
    const authHeaders = await this.getAuthHeaders();

    const httpResponse = await this.httpClient.axiosRef
      .get<{
        requestSuccessful: boolean;
        responseMessage: string;
        responseCode: string;
        responseBody: {
          paymentStatus: string;
          paidOn?: string;
          method?: string;
          paymentMethod?: string;
          [key: string]: unknown;
        };
      }>(`${this.baseUrl}/api/v2/merchant/transactions/query`, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        params: {
          paymentReference: reference,
        },
      })
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

    if (httpResponse.status !== 200) {
      this.handleResponseError(
        response,
        SystemProcess.GET_TRANSACTION_BY_INTERNAL_REFERENCE,
      );
    }

    const responseData = response?.responseBody;
    const data = {} as GetTransactionByInternalReferenceResponse;

    if (response?.requestSuccessful && responseData) {
      switch (responseData.paymentStatus) {
        case Status.PAID:
          data.status = Status.SUCCESSFUL;
          data.processedAt = responseData.paidOn
            ? new Date(responseData.paidOn)
            : null;
          data.reference = reference;
          data.serviceResponse = response;
          const monnifyMethod = responseData.paymentMethod?.toLowerCase();
          if (monnifyMethod === 'card') {
            data.method = PaymentMethod.CARD;
          } else if (monnifyMethod === 'account_transfer') {
            data.method = PaymentMethod.BANK_TRANSFER;
          } else if (monnifyMethod === 'ussd') {
            data.method = PaymentMethod.USSD;
          }
          break;
        case Status.PENDING:
          data.status = Status.PENDING;
          break;
        case Status.IN_PROGRESS:
          data.status = Status.PROCESSING;
          break;
        case Status.PROCESSING:
          data.status = Status.PROCESSING;
          break;
        default:
          data.status = Status.FAILED;
          break;
      }
    }

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }
}

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetTransactionByInternalReferenceResponse,
  ITransactionProvider,
  InitializeTransactionPayload,
  InitializeTransactionResponse,
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

interface MonnifyInitializeTransactionRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode?: string;
  contractCode?: string;
  redirectUrl?: string;
  paymentMethods?: string[];
  incomeSplitConfig?: any[];
  metadata?: Record<string, any>;
}

interface MonnifyInitializeTransactionResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    transactionReference: string;
    paymentReference: string;
    merchantName: string;
    apiKey: string;
    enabledPaymentMethod: string[];
    checkoutUrl: string;
  };
}

interface MonnifyTransactionStatusResponse {
  requestSuccessful: boolean;
  responseMessage: string;
  responseCode: string;
  responseBody: {
    transactionReference: string;
    paymentReference: string;
    amountPaid: string;
    totalPayable: string;
    settlementAmount: string;
    paidOn: string;
    paymentStatus: string;
    paymentDescription: string;
    currency: string;
    paymentMethod: string;
    product: {
      type: string;
      reference: string;
    };
    cardDetails?: {
      cardType: string;
      last4: string;
      expMonth: string;
      expYear: string;
      bin: string;
      reusable: boolean;
    };
    accountDetails?: {
      accountName: string;
      accountNumber: string;
      bankCode: string;
      amountPaid: string;
    };
    accountPayments?: Array<{
      accountName: string;
      accountNumber: string;
      bankCode: string;
      bankName: string;
      amountPaid: string;
      sessionId: string;
      paidOn: string;
    }>;
    customer: {
      email: string;
      name: string;
    };
    metaData?: Record<string, any>;
  };
}



@Injectable()
export class MonnifyProvider implements ITransactionProvider {
  private readonly logger: Logger;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly contractCode: string;
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
    this.contractCode = this.configService.get<string>('monnify.contractCode');

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

  /**
   * Initialize a payment transaction with Monnify
   * @param payload Payment initialization data
   * @returns Payment initialization response with checkout URL
   */
  async initializeTransaction(
    payload: InitializeTransactionPayload,
  ): Promise<IResponse<InitializeTransactionResponse>> {
    const authHeaders = await this.getAuthHeaders();

    const requestBody: MonnifyInitializeTransactionRequest = {
      amount: payload.amount,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      paymentReference: payload.paymentReference,
      paymentDescription: payload.paymentDescription,
      currencyCode: 'NGN',
      contractCode: this.contractCode,
      redirectUrl: payload.redirectUrl,
      paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD'],
      metadata: payload.metadata,
    };

    this.logger.log({
      process: SystemProcess.INITIALIZE_TRANSACTION,
      message: 'Initializing Monnify transaction',
      paymentReference: payload.paymentReference,
    });

    const httpResponse = await this.httpClient.axiosRef
      .post<MonnifyInitializeTransactionResponse>(
        `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
        requestBody,
        {
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
      .catch((error) => {
        const handledError = handleHttpError(error);
        this.logger.error({
          process: SystemProcess.INITIALIZE_TRANSACTION,
          message: 'Failed to initialize transaction',
          error: handledError,
        });
        return {
          ...handledError,
          data: {
            requestSuccessful: false,
            message: handledError.message,
          } as any,
        };
      });

    const response = httpResponse.data;

    if (httpResponse.status !== 200 || !response.requestSuccessful) {
      this.handleResponseError(
        response,
        SystemProcess.INITIALIZE_TRANSACTION,
      );
    }

    const { responseBody } = response;

    this.logger.log({
      process: SystemProcess.INITIALIZE_TRANSACTION,
      message: 'Transaction initialized successfully',
      paymentReference: responseBody.paymentReference,
      transactionReference: responseBody.transactionReference,
    });

    const data: InitializeTransactionResponse = {
      transactionReference: responseBody.transactionReference,
      paymentReference: responseBody.paymentReference,
      checkoutUrl: responseBody.checkoutUrl,
      enabledPaymentMethods: responseBody.enabledPaymentMethod,
    };

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  /**
   * Query transaction status from Monnify
   * @param reference Payment reference
   * @returns Transaction status details
   */
  async getTransactionByInternalReference(
    reference: string,
  ): Promise<IResponse<GetTransactionByInternalReferenceResponse>> {
    const authHeaders = await this.getAuthHeaders();

    this.logger.log({
      process: SystemProcess.GET_TRANSACTION_BY_INTERNAL_REFERENCE,
      message: 'Querying transaction status',
      reference,
    });

    const httpResponse = await this.httpClient.axiosRef
      .get<MonnifyTransactionStatusResponse>(
        `${this.baseUrl}/api/v2/merchant/transactions/query`,
        {
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          params: {
            paymentReference: reference,
          },
        },
      )
      .catch((error) => {
        const handledError = handleHttpError(error);
        this.logger.error({
          process: SystemProcess.GET_TRANSACTION_BY_INTERNAL_REFERENCE,
          message: 'Failed to query transaction',
          reference,
          error: handledError,
        });
        return {
          ...handledError,
          data: {
            requestSuccessful: false,
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
      const paymentStatus = responseData.paymentStatus?.toUpperCase();

      switch (paymentStatus) {
        case 'PAID':
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
          } else {
            data.method = monnifyMethod as PaymentMethod;
          }

          this.logger.log({
            process: SystemProcess.GET_TRANSACTION_BY_INTERNAL_REFERENCE,
            message: 'Transaction successful',
            reference,
            status: data.status,
            method: data.method,
          });
          break;

        case 'PENDING':
          data.status = Status.PENDING;
          break;

        case 'OVERPAID':
          data.status = Status.SUCCESSFUL;
          data.processedAt = responseData.paidOn
            ? new Date(responseData.paidOn)
            : null;
          data.reference = reference;
          data.serviceResponse = response;
          break;

        case 'PARTIALLY_PAID':
          data.status = Status.PROCESSING;
          break;

        case 'EXPIRED':
        case 'CANCELLED':
        case 'FAILED':
          data.status = Status.FAILED;
          this.logger.warn({
            process: SystemProcess.GET_TRANSACTION_BY_INTERNAL_REFERENCE,
            message: 'Transaction failed or expired',
            reference,
            status: paymentStatus,
          });
          break;

        default:
          data.status = Status.FAILED;
          this.logger.warn({
            process: SystemProcess.GET_TRANSACTION_BY_INTERNAL_REFERENCE,
            message: 'Unknown payment status',
            reference,
            status: paymentStatus,
          });
          break;
      }
    } else {
      data.status = Status.FAILED;
      this.logger.error({
        process: SystemProcess.GET_TRANSACTION_BY_INTERNAL_REFERENCE,
        message: 'Invalid response from Monnify',
        reference,
        response,
      });
    }

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  /**
   * Requery transaction status (alias for getTransactionByInternalReference)
   * @param reference Payment reference
   * @returns Transaction status details
   */
  async requeryTransaction(
    reference: string,
  ): Promise<IResponse<GetTransactionByInternalReferenceResponse>> {
    return this.getTransactionByInternalReference(reference);
  }
}
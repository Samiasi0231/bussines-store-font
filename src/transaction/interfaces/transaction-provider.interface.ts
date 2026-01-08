import { PaymentMethod } from '../../@common/constants/payment.constant';
import { Status } from '../../@common/constants/status.constant';
import { IResponse } from '../../@common/response';

export interface GetTransactionByInternalReferenceResponse {
  status: Status;
  processedAt: Date | null;
  method?: PaymentMethod;
  reference: string;
  serviceResponse?: Record<string, unknown>;
}

export interface InitializeTransactionPayload {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  redirectUrl?: string;
  metadata?: Record<string, any>;
}

export interface InitializeTransactionResponse {
  transactionReference: string;
  paymentReference: string;
  checkoutUrl: string;
  enabledPaymentMethods: string[];
}

export abstract class ITransactionProvider {
  /**
   * Initialize a payment transaction with the provider
   * @param payload Transaction initialization data
   * @returns Transaction initialization response with checkout URL
   */
  abstract initializeTransaction(
    payload: InitializeTransactionPayload,
  ): Promise<IResponse<InitializeTransactionResponse>>;

  /**
   * Get transaction details by internal reference
   * @param reference Internal payment reference
   * @returns Transaction status and details
   */
  abstract getTransactionByInternalReference(
    reference: string,
  ): Promise<IResponse<GetTransactionByInternalReferenceResponse>>;
}
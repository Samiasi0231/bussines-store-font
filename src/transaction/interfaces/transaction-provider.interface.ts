import { PaymentMethod } from '../../@common/constants/payment.constant';
import { Status } from '../../@common/constants/status.constant';
import { IResponse } from '../../@common/response';

export interface GetTransactionByInternalReferenceResponse {
  status: Status;
  processedAt: Date;
  method: PaymentMethod;
  reference: string;
  serviceResponse: Record<string, unknown>;
}

export abstract class ITransactionProvider {
  abstract getTransactionByInternalReference(
    reference: string,
  ): Promise<IResponse<GetTransactionByInternalReferenceResponse>>;
}

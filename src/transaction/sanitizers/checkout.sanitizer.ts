import { Injectable } from '@nestjs/common';
import {
  CheckoutPayment,
  CheckoutPaymentStatus,
} from '../../entities/checkout-payment.entity';
import { Util } from '../../@common/utilities/helpers.utility';

export type FormattedCheckoutPayment = {
  id: string;
  provider: string;
  reference?: string;
  status: CheckoutPaymentStatus;
  amount: number;
};

@Injectable()
export class CheckoutSanitizer {
  constructor() {}

  formatCheckoutPayment(data: CheckoutPayment): FormattedCheckoutPayment {
    return {
      id: data.id,
      provider: data.provider,
      reference: data.reference,
      status: data.status,
      amount: Util.toNaira(data.amount),
    };
  }
}

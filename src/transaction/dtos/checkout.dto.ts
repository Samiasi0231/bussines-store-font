import { IsEnum, IsNumber } from 'class-validator';
import { PaymentIntent } from '../../@common/constants/transaction.constant';

export class InitiateCheckoutPaymentDTO {
  @IsNumber()
  amount: number;

  @IsEnum(PaymentIntent)
  intent: PaymentIntent;
}

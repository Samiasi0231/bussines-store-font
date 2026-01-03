import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentIntent } from '../../@common/constants/payment-intent.constant';

export class InitiateCheckoutPaymentDTO {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentIntent)
  @IsNotEmpty()
  intent: PaymentIntent;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  redirectUrl?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

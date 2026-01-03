import { UUID } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Status } from '../@common/constants/status.constant';
import { BaseEntity } from './base.entity';
import { IsNotEmpty } from 'class-validator';
import { PaymentIntent } from '../@common/constants/payment-intent.constant';

const CheckoutPaymentStatus = [
  Status.PENDING,
  Status.PROCESSING,
  Status.SUCCESSFUL,
  Status.FAILED,
  Status.CANCELLED,
] as const;

export type CheckoutPaymentStatus = (typeof CheckoutPaymentStatus)[number];

@Entity('checkout_payments')
export class CheckoutPayment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  provider: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 255,
  })
  reference: string;

  @Column({
    type: 'enum',
    enum: CheckoutPaymentStatus,
    default: Status.PENDING,
  })
  status?: CheckoutPaymentStatus;

  @Column({ type: 'bigint' })
  @IsNotEmpty()
  amount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsNotEmpty()
  channel?: string;

  @Index()
  @Column({
    type: 'enum',
    enum: Object.values(PaymentIntent),
  })
  @IsNotEmpty()
  intent: PaymentIntent;

  @Column({ type: 'jsonb', nullable: true, name: 'intent_data' })
  intentData?: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true, name: 'processed_at' })
  processedAt?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'service_response' })
  serviceResponse?: Record<string, unknown>;

  @Column({ nullable: true, name: 'provider_reference', type: 'varchar' })
  providerReference?: string;
}

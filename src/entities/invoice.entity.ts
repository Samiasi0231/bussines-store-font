import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';
import { BaseEntity } from './base.entity';
import { PaymentMethod } from '../@common/constants/payment.constant';
import { InvoiceUser } from './incoice-user.entity';
import { Status } from '../@common/constants/status.constant';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { DiscountType } from './coupon.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Currency } from '../@common/constants/currency.constant';
import { Business } from './business.entity';
import * as randomstring from 'randomstring';

export const InvoiceStatus = [Status.PAID, Status.UNPAID, Status.OVERDUE];
export type InvoiceStatus = (typeof InvoiceStatus)[number];

@Entity('invoices')
export class Invoice extends BaseEntity {
  @PrimaryColumn('uuid')
  id: UUID = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'business_id' })
  @ManyToOne(() => Business, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  @IsNotEmpty()
  business: Business | UUID;

  @Index()
  @Column({ type: 'uuid', name: 'invoice_user_id' })
  @IsNotEmpty()
  @ManyToOne(() => InvoiceUser, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'invoice_user_id' })
  invoiceUser: InvoiceUser | UUID;

  @Column({ type: 'bigint', name: 'subtotal' })
  subtotal: number;

  @Column({
    type: 'enum',
    enum: Object.values(Currency),
    name: 'currency',
    default: Currency.NGN,
  })
  currency: Currency;

  @Column({ type: 'bigint', name: 'discount_amount', default: 0 })
  discountAmount: number;

  @Column({ type: 'bigint', name: 'payable_amount' })
  payableAmount: number;

  @Column({ type: 'bigint', name: 'tax', default: 0 })
  tax: number;

  @Column({ type: 'bigint', name: 'total_amount' })
  totalAmount: number;

  @Column({
    type: 'timestamptz',
    name: 'issued_at',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  issuedAt: Date;

  @Column({
    type: 'timestamptz',
    name: 'due_date',
    nullable: true,
  })
  dueDate?: Date;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'invoice_number',
  })
  invoiceNumber?: string;

  @Column({
    type: 'enum',
    enum: Object.values(PaymentMethod),
    nullable: true,
    name: 'payment_method',
  })
  @IsOptional()
  paymentMethod?: string;

  @Column({
    type: 'enum',
    enum: Object.values(DiscountType),
    name: 'discount_type',
    nullable: true,
  })
  discountType?: DiscountType;

  @Column({ type: 'int', nullable: true, name: 'discount_value' })
  discountValue?: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: Status.UNPAID,
  })
  status: InvoiceStatus;

  @OneToMany(() => InvoiceItem, (invoiceItem) => invoiceItem.invoice)
  invoiceItems: InvoiceItem[];

  @Column({ type: 'text', nullable: true })
  note?: string;

  @BeforeInsert()
  private generateInvoiceNumber?() {
    //TODO: Modify logic to account for collisions
    this.invoiceNumber = randomstring.generate({
      length: 12,
      charset: 'numeric',
    });
  }
}

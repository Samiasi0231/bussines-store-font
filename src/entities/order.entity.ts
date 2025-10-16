import { UUID } from 'crypto';
import {
  Entity,
  Index,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { User } from './user.entity';
import { Status } from '../@common/constants/status.constant';
import { OrderItem } from './order-item.entity';
import { Transaction } from './transaction.entity';
import { IsNotEmpty } from 'class-validator';
import { PaymentMethod } from '../@common/constants/payment.constant';
import { Address } from './address.entity';
import { BaseEntity } from './base.entity';
import { OrderCoupon } from './order-coupon.entity';

export const OrderStatus = [
  Status.SHIPPED,
  Status.PENDING,
  Status.PROCESSING,
  Status.CANCELLED,
  Status.COMPLETED,
] as const;
export type OrderStatus = (typeof OrderStatus)[number];

const PaymentStatus = [Status.PAID, Status.PENDING, Status.FAILED] as const;
type PaymentStatus = (typeof PaymentStatus)[number];

@Entity('orders')
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  @IsNotEmpty()
  user: User | UUID;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6',
    name: 'date',
  })
  date: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: Status.PENDING,
    name: 'status',
  })
  status: OrderStatus;

  @Column({
    type: 'bigint',
    name: 'subtotal',
  })
  subtotal: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'tax',
  })
  tax: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'shipping_amount',
  })
  shippingAmount: number;

  @Column({
    type: 'bigint',
    name: 'total_amount',
  })
  totalAmount: number;

  @Column({
    type: 'bigint',
    name: 'payable_amount',
  })
  payableAmount: number;

  @OneToMany(() => OrderCoupon, (coupon) => coupon.order)
  coupons: OrderCoupon[];

  @Index()
  @Column({ type: 'uuid', name: 'shipping_address_id' })
  @ManyToOne(() => Address, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'shipping_address_id' })
  @IsNotEmpty()
  shippingAddress: Address | UUID;

  @Column({
    type: 'enum',
    enum: Object.values(PaymentMethod),
    nullable: true,
    name: 'payment_method',
  })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: Status.PENDING,
    name: 'payment_status',
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];

  @OneToMany(() => Transaction, (transaction) => transaction.order)
  transactions: Transaction[];
}

import { UUID } from 'crypto';
import {
  Entity,
  Index,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  Check,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { User } from './user.entity';
import { Status } from '../@common/constants/status.constant';
import { OrderItem } from './order-item.entity';
import { PaymentMethod } from '../@common/constants/payment.constant';
import { Address } from './address.entity';
import { BaseEntity } from './base.entity';
import { OrderCoupon } from './order-coupon.entity';
import { InStoreOrderDTO } from '../orders/dtos/order.dto';
import { Cart } from './cart.entity';

export const OrderStatus = [
  Status.SHIPPED,
  Status.PENDING,
  Status.PROCESSING,
  Status.CANCELLED,
  Status.COMPLETED,
  Status.SUCCESSFUL,
  Status.FAILED,
] as const;
export type OrderStatus = (typeof OrderStatus)[number];

const PaymentStatus = [
  Status.PAID,
  Status.PENDING,
  Status.FAILED,
  Status.CANCELLED,
  Status.SUCCESSFUL,
  Status.COMPLETED,
  Status.PROCESSING,
] as const;
export type PaymentStatus = (typeof PaymentStatus)[number];

@Entity('orders')
@Check(`(user_id IS NULL) = (in_store_order = true)`)
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'user_id' })
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
  @Column({ type: 'uuid', name: 'shipping_address_id', nullable: true })
  @ManyToOne(() => Address, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'shipping_address_id' })
  shippingAddress: Address | UUID;

  @Column({
    type: 'enum',
    enum: Object.values(PaymentMethod),
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'varchar',
    length: 100,
    default: Status.PENDING,
    name: 'payment_status',
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'payment_reference',
    unique: true,
  })
  paymentReference?: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];

  @Column({ name: 'in_store_order_data', type: 'jsonb', nullable: true })
  inStoreOrderData?: InStoreOrderDTO;

  @Column({ name: 'in_store_order', type: 'bool', default: false })
  inStoreOrder?: boolean;

  @Index()
  @Column({ type: 'uuid', name: 'cart_id', nullable: true })
  @ManyToOne(() => Cart, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cart_id' })
  cart?: Cart | UUID;

  @Index()
  @Column({ type: 'uuid', name: 'transaction_id', nullable: true })
  transactionId?: UUID;
}

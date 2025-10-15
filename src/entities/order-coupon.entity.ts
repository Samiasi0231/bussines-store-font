import { UUID } from 'crypto';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { uuidv7 } from 'uuidv7';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from './base.entity';

@Entity('order_coupons')
export class OrderCoupon extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'uuid', name: 'order_id' })
  @ManyToOne(() => Order, (order) => order.coupons, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'order_id' })
  @IsNotEmpty()
  order: Order | UUID;

  @Column({ type: 'uuid', name: 'coupon_id' })
  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  @IsNotEmpty()
  coupon: Coupon;

  @Column({ type: 'uuid', nullable: true, name: 'order_item_id' })
  @ManyToOne(() => OrderItem, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'order_item_id' })
  orderItem?: OrderItem | UUID;
}

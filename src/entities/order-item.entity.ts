import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from './product-variant.entity';
import { Product } from './product.entity';
import { uuidv7 } from 'uuidv7';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from './base.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'order_id' })
  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'order_id' })
  @IsNotEmpty()
  order: Order;

  @Index()
  @Column({ type: 'uuid', name: 'product_id' })
  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  @IsNotEmpty()
  product: Product;

  @Column({ type: 'uuid', nullable: true, name: 'variant_id' })
  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  productVariant: ProductVariant | UUID;

  @Column({ type: 'int', name: 'quantity' })
  quantity: number;

  @Column({ type: 'int', name: 'unit_price' })
  unitPrice: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  @Column({
    type: 'int',
    name: 'total_price',
  })
  totalPrice: number;
}

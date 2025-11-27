import { UUID } from 'crypto';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { Cart } from './cart.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { IsNotEmpty } from 'class-validator';

@Entity('cart_items')
export class CartItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'cart_id' })
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  @IsNotEmpty()
  cart: Cart | UUID;

  @Index()
  @Column({ type: 'uuid', name: 'product_id' })
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  @IsNotEmpty()
  product: Product | UUID;

  @Column({ type: 'uuid', nullable: true, name: 'product_variant_id' })
  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant?: ProductVariant | UUID;

  @Column({ type: 'int', name: 'quantity' })
  quantity: number;

  @Column({ type: 'int', name: 'unit_price' })
  unitPrice: number;
}


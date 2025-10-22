import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { Product } from './product.entity';
import { uuidv7 } from 'uuidv7';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from './base.entity';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'invoice_id' })
  @ManyToOne(() => Invoice, (invoice) => invoice.invoiceItems, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'invoice_id' })
  @IsNotEmpty()
  invoice: Invoice | UUID;

  @Index()
  @Column({ type: 'uuid', name: 'product_id' })
  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  @IsNotEmpty()
  product: Product | UUID;

  @Column({ type: 'uuid', nullable: true, name: 'product_variant_id' })
  @ManyToOne(() => ProductVariant, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant?: ProductVariant | UUID;

  @Column({ type: 'int', name: 'quantity' })
  quantity: number;

  @Column({ type: 'int', name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'int', name: 'unit_cost_price' })
  unitCostPrice: number;

  @Column({
    type: 'int',
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  @Column({
    type: 'int',
    name: 'subtotal',
  })
  subtotal: number;
}

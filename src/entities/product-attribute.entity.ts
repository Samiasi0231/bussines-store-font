import { IsNotEmpty } from 'class-validator';
import { UUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { ProductVariant } from './product-variant.entity';
import { BaseEntity } from './base.entity';

@Entity('product_attributes')
export class ProductAttribute extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: UUID = uuidv7() as UUID;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  value: string;

  @Index()
  @ManyToOne(() => ProductVariant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_variant_id' })
  @IsNotEmpty()
  @Column({ type: 'uuid', name: 'product_variant_id', nullable: false })
  productVariant: ProductVariant | UUID;
}

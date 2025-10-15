import { UUID } from 'crypto';
import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Product } from './product.entity';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from './base.entity';
import { ProductAttribute } from './product-attribute.entity';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @PrimaryColumn('uuid')
  id: UUID = uuidv7() as UUID;

  @Index()
  @IsNotEmpty()
  @Column({ name: 'product_id' })
  @ManyToOne(() => Product, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product | UUID;

  @Column({ type: 'int' })
  sellingPrice: number;

  @Column({ type: 'int' })
  costPrice: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @OneToMany(() => ProductAttribute, (attribute) => attribute.productVariant, {
    cascade: true,
  })
  attributes?: ProductAttribute[];
}

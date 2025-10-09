import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Product } from './product.entity';
import { ProductCollection } from './product-collection.entity';
import { UUID } from 'crypto';
import { uuidv7 } from 'uuidv7';
import { IsNotEmpty } from 'class-validator';

@Entity('product_collection_products')
@Unique(['product', 'collection'])
export class ProductCollectionProduct extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: UUID = uuidv7() as UUID;

  @Index()
  @ManyToOne(() => ProductCollection, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'collection_id' })
  @IsNotEmpty()
  @Column({ name: 'collection_id' })
  collection: ProductCollection | UUID;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  @IsNotEmpty()
  @Column({ name: 'product_id' })
  product: Product | UUID;
}

import { UUID } from 'crypto';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { ProductSubCategory } from './product-sub-category.entity';
import { Store } from './store.entity';
import { Storefront } from './storefront.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { ProductCollectionProduct } from './product-collection-product.entity';
import { BaseEntity } from './base.entity';
import { IsNotEmpty } from 'class-validator';

@Entity('products')
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int' })
  costPrice: number;

  @Column({ type: 'int' })
  sellingPrice: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', name: 'order_limit', nullable: true })
  orderLimit?: number;

  @Column({ type: 'bool', name: 'track_inventory', default: true })
  trackInventory?: boolean;

  @Index()
  @ManyToOne(() => Store, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  @IsNotEmpty()
  @Column({ name: 'store_id' })
  store: Store | UUID;

  @Index()
  @IsNotEmpty()
  @ManyToOne(() => ProductSubCategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sub_category_id' })
  @Column({ name: 'sub_category_id' })
  subCategory: ProductSubCategory | UUID;


  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants?: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
  })
  images?: ProductImage[];



  @ManyToOne(() => Storefront, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'storefront_id' })
storefront?: Storefront | UUID;

@Column({ type: 'uuid', nullable: true, name: 'storefront_id' })
storefrontId?: UUID;


  @OneToMany(
    () => ProductCollectionProduct,
    (collection) => collection.product,
    {
      cascade: true,
    },
  )
  collectionProducts?: ProductCollectionProduct[];
}
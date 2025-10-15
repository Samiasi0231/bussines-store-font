import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductCategory } from './product-category.entity';
import { IsNotEmpty } from 'class-validator';
import { UUID } from 'crypto';
import { uuidv7 } from 'uuidv7';

@Entity('product_sub_categories')
export class ProductSubCategory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar', unique: true, length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @ManyToOne(() => ProductCategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  @IsNotEmpty()
  @Column({ name: 'category_id' })
  productCategory: ProductCategory | UUID;
}

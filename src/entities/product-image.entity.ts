import { IsNotEmpty } from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Product } from './product.entity';
import { BaseEntity } from './base.entity';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ default: false, name: 'is_primary' })
  isPrimary: boolean;

  @Index()
  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  @IsNotEmpty()
  @Column({ name: 'product_id' })
  product: Product | UUID;
}

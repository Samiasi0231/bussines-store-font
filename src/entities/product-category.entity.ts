import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';

@Entity('product_categories')
export class ProductCategory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar', unique: true, length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { UUID } from 'crypto';

@Entity('business_categories')
export class BusinessCategory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @ManyToOne(() => BusinessCategory, (category) => category.subCategories, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_category_id' })
  @Column({ name: 'parent_category_id', nullable: true })
  parentCategory?: BusinessCategory | UUID;

  @OneToMany(() => BusinessCategory, (category) => category.parentCategory)
  subCategories?: BusinessCategory[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive?: boolean;
}
// src/storefront/entities/storefront.entity.ts
import { UUID } from 'crypto';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { Store } from './store.entity';
import { IsNotEmpty } from 'class-validator';

@Entity('storefronts')
export class Storefront extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  id = uuidv7() as UUID;

  @Index()
  @ManyToOne(() => Store, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  @IsNotEmpty()
  @Column({ name: 'store_id' })
  store: Store | UUID;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'logo' })
  logo?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'banner' })
  banner?: string;

  @Column({ type: 'text', nullable: true, name: 'about_us' })
  aboutUs?: string;

  @Column({ type: 'text', nullable: true, name: 'refund_policy' })
  refundPolicy?: string;

  @Column({ type: 'text', nullable: true, name: 'terms_of_use' })
  termsOfUse?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'email',
  })
  email?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'phone',
  })
  phone?: string;

  @Column({
    type: 'text',
    array: true,
    nullable: true,
    name: 'social_handles',
  })
  socialHandles?: string[];
}

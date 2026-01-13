import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import { Storefront } from './storefront.entity';

@Entity('stores')
export class Store extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Business relation
  @Index()
  @ManyToOne(() => Business, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'business_id' })
  @IsNotEmpty()
  business: Business | UUID;

  // Storefront relation
  // @OneToOne(() => Storefront, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'storefront_id' })
  // storefront?: Storefront;

  // @Column({ type: 'uuid', nullable: true })
  // storefront_id?: UUID;
}

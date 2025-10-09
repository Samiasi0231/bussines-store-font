import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { BaseEntity } from './base.entity';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';
import { IsNotEmpty } from 'class-validator';

@Entity('stores')
export class Store extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @ManyToOne(() => Business, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  @IsNotEmpty()
  @Column({ name: 'business_id' })
  business: Business | UUID;
}

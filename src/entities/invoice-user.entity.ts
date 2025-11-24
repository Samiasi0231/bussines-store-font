import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  AfterLoad,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';
import { BaseEntity } from './base.entity';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Business } from './business.entity';

@Entity('invoice_users')
export class InvoiceUser extends BaseEntity {
  @PrimaryColumn('uuid')
  id: UUID = uuidv7() as UUID;

  @Index()
  @ManyToOne(() => Business, { nullable: false })
  @JoinColumn({ name: 'business_id' })
  @Column({ type: 'uuid', name: 'business_id' })
  @IsNotEmpty()
  business: UUID;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  @IsEmail()
  email: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  @IsNotEmpty()
  phone: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  @IsNotEmpty()
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  @IsOptional()
  lastName?: string;

  fullName?: string;

  @AfterLoad()
  generateFullName?() {
    this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ');
  }
}


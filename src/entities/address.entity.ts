import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Kyc } from './kyc.entity';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';
import { IsNotEmpty } from 'class-validator';

@Entity('addresses')
export class Address extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Column({ type: 'varchar', length: 100 })
  state: string;

  @Column({ type: 'varchar', length: 100, default: 'Nigeria' })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lga: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  street: string;

  @Column({
    name: 'utility_bill',
    type: 'varchar',
    nullable: true,
  })
  utilityBill: string;

  @Column({
    name: 'utility_bill_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  utilityBillType: string;

  @Column({
    name: 'building_number',
    type: 'varchar',
    length: 50,
  })
  buildingNumber: string;

  @Index()
  @ManyToOne(() => User, (user) => user, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  @Column({ name: 'user_id' })
  @IsNotEmpty()
  user: User | UUID;

  @Index()
  @Column({
    nullable: false,
    name: 'kyc_id',
  })
  kycId: UUID;

  @ManyToOne(() => Kyc, (kyc) => kyc, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @IsNotEmpty()
  @JoinColumn({ name: 'kyc_id' })
  kyc?: Kyc;
}

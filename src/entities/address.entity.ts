import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Kyc } from './kyc.entity';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';

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
    name: 'building_number',
    type: 'varchar',
    length: 50,
  })
  buildingNumber: string;

  @ManyToOne(() => User, (user) => user, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Column({ name: 'user_id' })
  user: User;

  @Column({ name: 'kyc_id' })
  kycId: User;

  @ManyToOne(() => Kyc, (kyc) => kyc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kyc_id' })
  kyc: Kyc;
}

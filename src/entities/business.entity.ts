import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { Status } from '../@common/constants/status.constant';
import { Address } from './address.entity';
import { UUID } from 'crypto';
import { IsNotEmpty } from 'class-validator';
import { User } from './user.entity';
import { Store } from './store.entity';
import { BusinessType } from '../@common/constants/business-type.contant';

@Entity('businesses')
export class Business extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Index()
  @ManyToOne(() => User, (user) => user, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  @Column({ name: 'user_id' })
  @IsNotEmpty()
  user: User | UUID;

  @Column({ name: 'cac_number', nullable: true })
  cacNumber?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  // Proposed names (for CAC name reservation)
  @Column({ name: 'proposed_name_1', type: 'varchar', length: 255, nullable: true })
  proposedName1?: string;

  @Column({ name: 'proposed_name_2', type: 'varchar', length: 255, nullable: true })
  proposedName2?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo?: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.PENDING,
  })
  status?: Status;

  @Column({
    type: 'enum',
    enum: BusinessType,
    nullable: true,
    default: BusinessType.CAC_VERIFIED,
  })
  businessType?: BusinessType;

  // type-specific data stored as jsonb for flexibility (directors, trustees, shareholders, objects...)
  @Column({ name: 'extra_data', type: 'jsonb', nullable: true })
  extraData?: any;

  @OneToMany(() => Address, (address) => address.kyc, { cascade: true })
  addresses?: Address[];

  @OneToMany(() => Store, (store) => store.business, { cascade: true })
  stores?: Store[];
}

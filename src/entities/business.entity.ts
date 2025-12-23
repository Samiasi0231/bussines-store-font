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
import { BusinessCategory } from './business-category.entity';
import { BusinessType } from './business-type.entity';

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
  @Column({
    name: 'proposed_name_1',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  proposedName1?: string;

  @Column({
    name: 'proposed_name_2',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
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

  // @Column({
  //   type: 'enum',
  //   enum: BusinessType,
  //   nullable: true,
  //   default: BusinessType.CAC_VERIFIED,
  // })
  // businessType?: BusinessType;

  @Index()
  @ManyToOne(() => BusinessType, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'business_type_id' })
  @Column({ name: 'business_type_id', nullable: true })
  businessType?: BusinessType | UUID;

  @Index()
  @ManyToOne(() => BusinessCategory, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  @Column({ name: 'category_id', nullable: true })
  category?: BusinessCategory | UUID;

  @Index()
  @ManyToOne(() => BusinessCategory, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sub_category_id' })
  @Column({ name: 'sub_category_id', nullable: true })
  subCategory?: BusinessCategory | UUID;

  @Column({
    name: 'cac_certificate_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  cacCertificateUrl?: string;

  @Column({
    name: 'status_report_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  statusReportUrl?: string;
  // type-specific data stored as jsonb for flexibility (directors, trustees, shareholders, objects...)
  @Column({ name: 'extra_data', type: 'jsonb', nullable: true })
  extraData?: any;

  @OneToMany(() => Address, (address) => address.kyc, { cascade: true })
  addresses?: Address[];

  @OneToMany(() => Store, (store) => store.business, { cascade: true })
  stores?: Store[];
}

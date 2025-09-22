import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Tier } from '../@common/constants/tier.constant';
import { Status } from '../@common/constants/status.constant';
import { IdentityVerificationType } from '../kyc/dtos/identity.dto';
import { BaseEntity } from './base.entity';
import { uuidv7 } from 'uuidv7';
import { UUID } from 'crypto';
import { Address } from './address.entity';
import { User } from './user.entity';
import { IsNotEmpty } from 'class-validator';

const VerificationStatus = [
  Status.PENDING,
  Status.VERIFIED,
  Status.FAILED,
] as const;
export type VerificationStatus = (typeof VerificationStatus)[number];

const GeneralIdentityVerificationType = [IdentityVerificationType.NIN];
type GeneralIdentityVerificationType =
  (typeof GeneralIdentityVerificationType)[number];

@Entity('kycs')
export class Kyc extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'enum', enum: Tier, default: Tier.ZERO })
  tier?: Tier;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bvn?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  @Column({ name: 'user_id' })
  @IsNotEmpty()
  user: User | UUID;

  @Column({
    name: 'bvn_verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: Status.PENDING,
  })
  bvnVerificationStatus?: VerificationStatus;

  @Column({
    name: 'is_profile_complete',
    type: 'varchar',
    default: false,
  })
  isProfileComplete?: boolean;

  @Column({
    name: 'identity_document_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  identityDocumentNumber?: string;

  @Column({
    name: 'identity_verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: Status.PENDING,
  })
  identityVerificationStatus?: VerificationStatus;

  @Column({
    name: 'face_verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: Status.PENDING,
  })
  faceVerificationStatus?: VerificationStatus;

  @Column({
    name: 'identity_verification_type',
    type: 'enum',
    enum: GeneralIdentityVerificationType,
    nullable: true,
  })
  identityVerificationType?: IdentityVerificationType;

  @OneToMany(() => Address, (address) => address.kyc, { cascade: true })
  addresses?: Address[];
}

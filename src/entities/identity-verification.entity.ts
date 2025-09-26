import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { IdentityVerificationType } from '../kyc/dtos/identity.dto';
import { BaseEntity } from './base.entity';
import { UUID } from 'crypto';
import { uuidv7 } from 'uuidv7';
import { Status } from '../@common/constants/status.constant';

type VerificationField = {
  expected: string;
  provided: string;
};

type NameVerificationField = {
  expected: { firstName: string; lastName: string; otherName: string };
  provided: { firstName: string; lastName: string; otherName: string };
};

type IdentityVerificationResult = {
  name?: NameVerificationField;
  dateOfBirth?: VerificationField;
  face?: VerificationField;
};

@Entity('identity_verifications')
export class IdentityVerification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  @Column({ name: 'user_id' })
  user: User | UUID;

  @Column({ type: 'enum', enum: IdentityVerificationType })
  type: IdentityVerificationType;

  @Column({ name: 'verification_data', type: 'jsonb' })
  verificationData: Record<string, unknown>;

  @Column({ type: 'varchar', length: 100 })
  provider?: string;

  @Column({ name: 'provider_response', type: 'jsonb', nullable: true })
  providerResponse?: Record<string, unknown>;

  @Column({ name: 'invalid_data', type: 'jsonb', nullable: true })
  invalidData?: IdentityVerificationResult;

  @Column({ type: 'enum', enum: Status, default: Status.ACTIVE })
  status: Status;

  //TODO: add nullable field for approver
}

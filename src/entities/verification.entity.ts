import { UUID } from 'crypto';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';
import { Status } from './status.entity';
import {
  VerificationChannel,
  VerificationIntent,
} from '../@common/constants/verification.constant';

@Entity('verifications')
export class Verification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Column({ name: 'entity_id', type: 'varchar', length: 50 })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  channel: VerificationChannel;

  @Column({
    name: 'verification_data',
    type: 'varchar',
  })
  verificationData: string;

  @Column({
    type: 'varchar',
  })
  intent: VerificationIntent;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => Status, { eager: true })
  @JoinColumn({ name: 'status' })
  status: Status;
}

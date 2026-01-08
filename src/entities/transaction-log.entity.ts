import { UUID } from 'crypto';
import {
  Entity,
  Index,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { BaseEntity } from './base.entity';

@Entity('transaction_logs')
@Index(['transactionId'])
@Index(['entityId', 'entityType'])
@Index(['createdAt'])
export class TransactionLog extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ type: 'uuid', name: 'transaction_id', nullable: true })
  transactionId?: UUID;

  @Index()
  @Column({ type: 'uuid', name: 'entity_id', nullable: true })
  entityId?: UUID;

  @Index()
  @Column({ type: 'varchar', length: 100, name: 'entity_type', nullable: true })
  entityType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  status?: string;

  @Column({ type: 'bigint', nullable: true })
  amount?: number;

  @Column({ type: 'text', nullable: true, name: 'message' })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}


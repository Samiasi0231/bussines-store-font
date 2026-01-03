import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { UUID } from 'crypto';
import { BaseEntity } from './base.entity';
import { uuidv7 } from 'uuidv7';

@Entity('webhook_events')
@Index(['source', 'idempotencyKey'])
@Index(['correlationId'])
@Index(['status', 'createdAt'])
export class WebhookEvent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Column({ type: 'varchar', name: 'event_type' })
  eventType: string;

  @Column({ type: 'varchar' })
  source: string; 

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ nullable: true, type: 'text' })
  signature: string;

  @Column({ nullable: true, type: 'varchar', name: 'ip_address' })
  ipAddress: string;

  @Column({ nullable: true, type: 'varchar', name: 'user_agent' })
  userAgent: string;

  @Column({ nullable: true, type: 'varchar', name: 'idempotency_key' })
  @Index()
  idempotencyKey: string;

  @Column({ nullable: true, type: 'varchar', name: 'correlation_id' })
  correlationId: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column({ type: 'text', nullable: true, name: 'error_stack' })
  errorStack?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int', nullable: true, name: 'processing_time' })
  processingTime?: number;

  @Column({ type: 'timestamp', nullable: true, name: 'processed_at' })
  processedAt?: Date;
}

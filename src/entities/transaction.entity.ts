import { UUID } from 'crypto';
import {
  Entity,
  Index,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { uuidv7 } from 'uuidv7';
import { Status } from '../@common/constants/status.constant';
import {
  TransactionChannel,
  TransactionPurpose,
} from '../@common/constants/transaction.constant';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from './base.entity';

export const TransactionStatus = [
  Status.SUCCESSFUL,
  Status.FAILED,
  Status.PENDING,
  Status.PROCESSING,
  Status.REVERSED,
] as const;

export type TransactionStatus = (typeof TransactionStatus)[number];

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @Index()
  @Column({ nullable: true, name: 'wallet_id' })
  @ManyToOne(() => Wallet, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'wallet_id' })
  @IsNotEmpty()
  wallet: Wallet | UUID;

  @Column({
    type: 'enum',
    enum: TransactionType,
    name: 'transaction_type',
  })
  type: TransactionType;

  @Column({ type: 'bigint', name: 'amount' })
  amount: number;

  @Column({ type: 'bigint', name: 'balance_before' })
  balanceBefore: number;

  @Column({ type: 'bigint', name: 'balance_after' })
  balanceAfter: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: Status.PENDING,
  })
  status: TransactionStatus;

  @Index()
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  reference: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'group_reference',
  })
  groupReference: string;

  @Column({ type: 'text', nullable: true, name: 'narration' })
  narration: string;

  @Column({
    type: 'enum',
    enum: TransactionChannel,
    nullable: true,
  })
  channel?: TransactionChannel;

  @Column({
    type: 'enum',
    enum: TransactionPurpose,
    nullable: true,
  })
  purpose?: TransactionPurpose;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, unknown>;

  @Column({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  date?: Date;
}

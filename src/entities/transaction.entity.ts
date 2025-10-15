import { UUID } from 'crypto';
import {
  Entity,
  Index,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Wallet } from './wallet.entity';
import { uuidv7 } from 'uuidv7';
import { Status } from '../@common/constants/status.constant';
import { IsNotEmpty } from 'class-validator';
import { BaseEntity } from './base.entity';

const TransactionStatus = [
  Status.SUCCESSFUL,
  Status.FAILED,
  Status.PENDING,
  Status.PROCESSING,
  Status.REVERSED,
] as const;

type TransactionStatus = (typeof TransactionStatus)[number];

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id = uuidv7() as UUID;

  @Index()
  @Column({ nullable: true, name: 'order_id' })
  @ManyToOne(() => Order, (order) => order.transactions, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'order_id' })
  order: Order | UUID;

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

  @Column({ type: 'text', nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'jsonb', nullable: true, name: 'metadata' })
  metadata: Record<string, unknown>;
}

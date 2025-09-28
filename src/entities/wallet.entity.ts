import { IsNotEmpty } from 'class-validator';
import { UUID } from 'crypto';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { Currency } from '../@common/constants/currency.constant';
import { BaseEntity } from './base.entity';
import { uuidv7 } from 'uuidv7';
import { Status } from '../@common/constants/status.constant';
import { WalletType } from '../@common/constants/wallet.constant';

@Entity({ name: 'wallets' })
export class Wallet extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id? = uuidv7() as UUID;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  @Column({ name: 'user_id' })
  @IsNotEmpty()
  user: User | UUID;

  @Column({
    name: 'account_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  accountName?: string;

  @Column({
    name: 'account_number',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  accountNumber?: string;

  @Column({ enum: Currency, length: 10, default: Currency.NGN })
  currency?: Currency;

  @Column({
    name: 'account_provider',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  accountProvider?: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName?: string;

  @Column({ type: 'varchar', length: 50, default: Status.ACTIVE })
  status?: string;

  @Column({ enum: WalletType, length: 50, default: WalletType.PERSONAL })
  type?: WalletType;

  @Column({ name: 'single_transaction_limit', type: 'bigint', default: 0 })
  singleTransactionLimit?: number;

  @Column({ name: 'daily_transaction_limit', type: 'bigint', default: 0 })
  dailyTransactionLimit?: number;

  @Column({ name: 'max_balance_limit', type: 'bigint', default: 0 })
  maxBalanceLimit?: number;

  @Column({ name: 'transaction_pin', type: 'varchar', nullable: true })
  transactionPin?: string;

  @Column({ name: 'ledger_balance', type: 'bigint', default: 0 })
  ledgerBalance?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ type: 'bigint', default: 0 })
  balance?: number;

  @Column({ name: 'debt_balance', type: 'bigint', default: 0 })
  debtBalance?: number;

  @Column({ name: 'limit_balance', type: 'bigint', default: 0 })
  limitBalance?: number;
}

import { IsNotEmpty } from 'class-validator';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Wallet } from './wallet.entity';
import { BaseEntity } from './base.entity';
import { UUID } from 'crypto';

@Entity({ name: 'beneficiaries' })
export class Beneficiary extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id?: string = uuidv7();

  @Index()
  @ManyToOne(() => Wallet, { nullable: false })
  @JoinColumn({ name: 'wallet_id' })
  @IsNotEmpty()
  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId: Wallet | UUID;

  @Column({ type: 'varchar', name: 'account_number' })
  accountNumber: string;

  @Column({ type: 'varchar', name: 'bank_code' })
  bankCode: string;

  @Column({ type: 'varchar', name: 'bank_name' })
  bankName: string;

  @Column({ type: 'varchar', name: 'account_name' })
  accountName: string;
}

import { Injectable } from '@nestjs/common';
import {
  Transaction,
  TransactionType,
} from '../../entities/transaction.entity';
import { Util } from '../../@common/utilities/helpers.utility';

export type FormattedTransaction = {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  status: string;
  reference?: string;
  narration?: string;
  date?: Date;
};

@Injectable()
export class TransactionSanitizer {
  constructor() {}

  formatTransaction(data: Transaction): FormattedTransaction {
    return {
      id: data.id,
      walletId: typeof data.wallet === 'string' ? data.wallet : data.wallet?.id,
      type: data.type,
      amount: Util.toNaira(data.amount),
      balanceBefore: Util.toNaira(data.balanceBefore),
      balanceAfter: Util.toNaira(data.balanceAfter),
      status: data.status,
      reference: data.reference,
      narration: data.narration,
      date: data.date,
    };
  }
}

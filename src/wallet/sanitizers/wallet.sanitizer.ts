import { Injectable } from '@nestjs/common';
import { Wallet } from '../../entities/wallet.entity';
import { WalletType } from '../../@common/constants/wallet.constant';
import { Currency } from '../../@common/constants/currency.constant';
import { Util } from '../../@common/utilities/helpers.utility';

export type WalletData = {
  id: string;
  balance: number;
  ledgerBalance: number;
  accountNumber: string;
  type: WalletType;
  currency: Currency;
  maxBalanceLimit: number;
  dailyTransactionLimit: number;
  singleTransactionLimit: number;
  bankName: string;
  hasTransactionPin: boolean;
  //   businessId: string;
};

@Injectable()
export class WalletSanitizer {
  constructor() {}

  formatWalletData(wallet: Wallet): WalletData {
    return {
      id: wallet.id,
      balance: Util.toNaira(wallet.balance),
      ledgerBalance: Util.toNaira(wallet.ledgerBalance),
      accountNumber: wallet.accountNumber,
      singleTransactionLimit: Util.toNaira(wallet.singleTransactionLimit),
      dailyTransactionLimit: Util.toNaira(wallet.dailyTransactionLimit),
      maxBalanceLimit: Util.toNaira(wallet.maxBalanceLimit),
      currency: wallet.currency,
      type: wallet.type,
      bankName: wallet.bankName,
      hasTransactionPin: !!wallet.transactionPin,
      //   businessId: wallet.businessId
    };
  }
}

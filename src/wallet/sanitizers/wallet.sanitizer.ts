import { Injectable } from '@nestjs/common';
import { Wallet } from '../../entities/wallet.entity';
import { WalletType } from '../../@common/constants/wallet.constant';
import { Currency } from '../../@common/constants/currency.constant';
import { Util } from '../../@common/utilities/helpers.utility';
import { Beneficiary } from '../../entities/beneficiary.entity';
import { UUID } from 'crypto';

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
  businessId: string;
};
export type BeneficiaryData = {
  bankName: string;
  accountName: string;
  bankCode: string;
  accountNumber: string;
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
      businessId: wallet.business as UUID,
    };
  }

  formatBeneficiaryData(data: Beneficiary): BeneficiaryData {
    return {
      bankName: data.bankName,
      bankCode: data.bankCode,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
    };
  }
}

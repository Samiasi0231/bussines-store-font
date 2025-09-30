import { Tier } from './tier.constant';

export enum WalletType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
}

const INFINITE_LIMIT_VALUE = -100;

export const TRANSACTION_LIMITS: Record<
  Tier,
  {
    singleTransactionLimit: number;
    dailyTransactionLimit: number;
    maxBalanceLimit: number;
  }
> = {
  [Tier.ZERO]: {
    singleTransactionLimit: 0,
    dailyTransactionLimit: 0,
    maxBalanceLimit: 0,
  },
  [Tier.ONE]: {
    singleTransactionLimit: 5000000,
    dailyTransactionLimit: 5000000,
    maxBalanceLimit: 5000000,
  },
  [Tier.TWO]: {
    singleTransactionLimit: 20000000,
    dailyTransactionLimit: 20000000,
    maxBalanceLimit: 20000000,
  },
  [Tier.THREE]: {
    singleTransactionLimit: 100000000,
    dailyTransactionLimit: 100000000,
    maxBalanceLimit: INFINITE_LIMIT_VALUE,
  },
};

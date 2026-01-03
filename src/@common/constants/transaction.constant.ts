export enum TransactionChannel {
  WALLET = 'wallet',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  USSD = 'ussd',
  DIRECT_DEBIT = 'direct_debit',
}

export enum TransactionPurpose {
  ORDER_CREDIT = 'credit:order',
}

export const TransactionReferencePrefix = {
  CHECKOUT: 'CHK-',
  TRANSACTION: 'TRN-',
  GROUP_TRANSACTION: 'GRP-',
};

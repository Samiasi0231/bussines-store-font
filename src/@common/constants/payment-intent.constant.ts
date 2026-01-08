/**
 * Payment Intent Constants
 * Defines the purpose of a payment transaction
 */
export enum PaymentIntent {
  /**
   * Payment for customer order
   */
  ORDER_PAYMENT = 'ORDER_PAYMENT',

  /**
   * Wallet top-up/funding
   */
  WALLET_FUNDING = 'WALLET_FUNDING',

  /**
   * Subscription payment
   */
  SUBSCRIPTION = 'SUBSCRIPTION',

  /**
   * Service payment (consulting, maintenance, etc.)
   */
  SERVICE_PAYMENT = 'SERVICE_PAYMENT',

  /**
   * Donation
   */
  DONATION = 'DONATION',

  /**
   * Refund to customer
   */
  REFUND = 'REFUND',

  /**
   * General payment (catch-all)
   */
  GENERAL = 'GENERAL',
}

/**
 * Get human-readable description for payment intent
 */
export const PaymentIntentDescription: Record<PaymentIntent, string> = {
  [PaymentIntent.ORDER_PAYMENT]: 'Order Payment',
  [PaymentIntent.WALLET_FUNDING]: 'Wallet Funding',
  [PaymentIntent.SUBSCRIPTION]: 'Subscription Payment',
  [PaymentIntent.SERVICE_PAYMENT]: 'Service Payment',
  [PaymentIntent.DONATION]: 'Donation',
  [PaymentIntent.REFUND]: 'Refund',
  [PaymentIntent.GENERAL]: 'General Payment',
};
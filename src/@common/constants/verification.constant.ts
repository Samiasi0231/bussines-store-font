export enum VerificationChannel {
  EMAIL = 'email',
  PHONE = 'phone',
}

export enum VerificationIntent {
  PHONE_NUMBER = 'phone_number',
  EMAIL_ADDRESS = 'email_address',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  TRANSACTION_PIN = 'transaction_pin',
}

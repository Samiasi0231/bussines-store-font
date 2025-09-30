export const ErrorMessage = {
  AN_ERROR_OCCURRED: 'Something went wrong. Please try again.',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  ACTIVE_STATUS_NOT_FOUND: 'Active status not found',
  INVALID_CREDENTIALS: 'Email/phone number or password is incorrect',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',
  NO_VERIFICATION_OTP_FOUND: 'No verification OTP found',
  OTP_HAS_EXPIRED: 'OTP has expired',
  INVALID_OTP: 'Invalid OTP',
  VERIFIED_STATUS_NOT_FOUND: 'Verified status not found',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  RESET_TOKEN_HAS_EXPIRED: 'Reset token has expired',
  GET_ENV: (key: string) => `Missing env key ${key}`,
  IDENTITY_VERIFICATION: (type: string) =>
    `${type.toUpperCase()} verification failed`,
  IDENTITY_VERIFICATION_NAMES_MISMATCH:
    'Identity verification failed due to names mismatch.',
  IDENTITY_VERIFICATION_DOB_MISMATCH:
    'Identity verification failed due to date of birth mismatch.',
  IDENTITY_VERIFICATION_NAMES_AND_DOB_MISMATCH:
    'Identity verification failed due to names and date of birth mismatch.',
  ACCESS_DENIED: 'Unauthorized',
  FACE_COMPARISON: 'An error occurred while comparing faces',
  MISMATCHED_FACES: 'Failed to verify face',
  SEND_EMAIL: 'Failed to send email',
  INVALID_TEMPLATE: 'Invalid template',
  INVALID_VERIFICATION: 'Invalid verification code',
  EXPIRED_VERIFICATION: 'This verification code has expired',
  DB_TRANSACTION_ALREADY_STARTED: 'Transaction already started',
  WALLET_NOT_FOUND: 'Wallet not found',
  INVALID_BVN: 'Invalid BVN',
  INVALID_NIN: 'Invalid NIN',
  ALREADY_VERIFIED_BVN:
    'A valid BVN has been verified and linked to this account.',
  ALREADY_VERIFIED_IDENTITY: 'Identity verifcation already completed',
  NOT_FOUND: (entity: string) => `${entity} not found`,
  PROFILE_SETUP_COMPLETED: 'Profile setup has already been completed.',
  CANNOT_USE_EMAIL_VERIFICATION_CHANNEL:
    'You are yet to add an email to your account. Please do so or select an alternative verification channel',
  PHONE_NUMBER_EXISTS: 'User with phone number exists',
};

export type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage];

export const SuccessMessage = {
  IDENTITY_VERIFICATION: (type: string) => `${type} verified successfully`,
  GENERIC_IDENTITY_VERIFICATION: 'Identity verified successfully',
  OPERATION_SUCCESSFUL: 'Operation successful',
  USER_REGISTERED: 'Signup successful',
  USER_LOGGED_IN: 'User logged in successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset email sent successfully',
  PASSWORD_RESET: 'Password reset successfully',
  EMAIL_VERIFICATION_EMAIL_SENT: 'Email verification email sent successfully',
  FACE_COMPARISON: 'Faces compared successfully',
  EMAIL_SENT: 'Email sent successfully',
  SUCCESSFUL_VERIFICATION: 'Verification successful',
  INITIATE_VERIFICATION: 'Verification initiated successfully',
  RETRIEVE_WALLETS: 'Wallets retrieved successfully',
  RETRIEVE_WALLET: 'Wallet retrieved successfully',
  RETRIEVE_BENEFICIARIES: 'Beneficiaries retrieved successfully',
  RETRIEVE_BENEFICIARY: 'Beneficiary retrieved successfully',
  DELETE_BENEFICIARY: 'Beneficiary deleted successfully',
  ADD_BENEFICIARY: 'Beneficiary added successfully',
  LOGOUT: 'You’ve logged out. See you again soon!',
};

export type SuccessMessage =
  (typeof SuccessMessage)[keyof typeof SuccessMessage];

export type ResponseMessage = ErrorMessage | SuccessMessage;

export const ErrorMessage = {
  AN_ERROR_OCCURED: 'Something went wrong. Please try again.',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  ACTIVE_STATUS_NOT_FOUND: 'Active status not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_ALREADY_VERIFIED: 'Email already verified',
  NO_VERIFICATION_OTP_FOUND: 'No verification OTP found',
  OTP_HAS_EXPIRED: 'OTP has expired',
  INVALID_OTP: 'Invalid OTP',
  VERIFIED_STATUS_NOT_FOUND: 'Verified status not found',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  RESET_TOKEN_HAS_EXPIRED: 'Reset token has expired',
  GET_ENV: (key: string) => `Missing env key ${key}`,
};

export type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage];

export const SuccessMessage = {
  OPERATION_SUCCESSFUL: 'Operation successful',
  USER_REGISTERED:
    'User registered successfully. Please check your email for verification code.',
  USER_LOGGED_IN: 'User logged in successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset email sent successfully',
  PASSWORD_RESET: 'Password reset successfully',
  EMAIL_VERIFICATION_EMAIL_SENT: 'Email verification email sent successfully',
};

export type SuccessMessage =
  (typeof SuccessMessage)[keyof typeof SuccessMessage];

export type ResponseMessage = ErrorMessage | SuccessMessage;

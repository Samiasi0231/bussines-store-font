export enum EmailTemplate {
  OTP = 'otp',
  PASSWORD_RESET = 'password-reset',
  ADMIN_NOTIFICATION_FOR_ADDRESS_VERIFICATION = 'notify-admin-address-verification',
}

export enum EmailNotificationType {
  OTP = 'otp',
  PASSWORD_RESET = 'password_reset',
}

export interface Template {
  key: string;
  email: {
    subject: string;
    path: string;
  };
}

export enum EmailTemplate {
  OTP = 'otp',
  PASSWORD_RESET = 'password-reset',
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

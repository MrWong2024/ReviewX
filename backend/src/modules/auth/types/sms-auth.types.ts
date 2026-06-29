export type SmsAuthProvider = 'stub' | 'aliyun';

export type NormalizedSmsPhone = {
  countryCode: '86';
  phoneNumber: string;
};

export type SendSmsCodeResult = {
  success: true;
};

export type CheckSmsCodeResult = {
  verified: boolean;
};

export type SmsCodeResponse = {
  success: true;
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
};

export type SmsLoginCodeResponse = SmsCodeResponse;

export type PasswordResetCodeResponse = SmsCodeResponse;

export type SmsLoginInput = {
  phone: string;
  verifyCode: string;
  userAgent?: string;
  ip?: string;
};

export type ResetPasswordWithSmsInput = {
  phone: string;
  verifyCode: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordResetResponse = {
  success: true;
  message: string;
};

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

export type SmsLoginCodeResponse = {
  success: true;
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
};

export type SmsLoginInput = {
  phone: string;
  verifyCode: string;
  userAgent?: string;
  ip?: string;
};

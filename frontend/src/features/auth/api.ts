import { apiRequest } from '@/src/lib/api/client';
import type {
  ChangePasswordInput,
  CurrentUser,
  LoginInput,
  SendSmsLoginCodeInput,
  SendSmsLoginCodeResponse,
  SmsLoginInput,
} from './types';

export function login(input: LoginInput) {
  return apiRequest<CurrentUser>('/auth/login', {
    body: {
      password: input.password,
      phone: input.phone.trim(),
    },
    method: 'POST',
  });
}

export function sendSmsLoginCode(input: SendSmsLoginCodeInput) {
  return apiRequest<SendSmsLoginCodeResponse>('/auth/sms-login/code', {
    body: {
      phone: input.phone.trim(),
    },
    method: 'POST',
  });
}

export function smsLogin(input: SmsLoginInput) {
  return apiRequest<CurrentUser>('/auth/sms-login', {
    body: {
      phone: input.phone.trim(),
      verifyCode: input.verifyCode.trim(),
    },
    method: 'POST',
  });
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>('/auth/me', {
    method: 'GET',
  });
}

export function changeOwnPassword(input: ChangePasswordInput) {
  return apiRequest<CurrentUser>('/auth/me/password', {
    body: {
      confirmPassword: input.confirmPassword,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
    method: 'PATCH',
  });
}

export function logout() {
  return apiRequest<{ success: true }>('/auth/logout', {
    method: 'POST',
  });
}

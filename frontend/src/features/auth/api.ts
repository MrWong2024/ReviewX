import { apiRequest } from '@/src/lib/api/client';
import type { ChangePasswordInput, CurrentUser, LoginInput } from './types';

export function login(input: LoginInput) {
  return apiRequest<CurrentUser>('/auth/login', {
    body: {
      password: input.password,
      phone: input.phone.trim(),
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

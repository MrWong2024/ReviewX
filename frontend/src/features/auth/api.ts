import { apiRequest } from '@/src/lib/api/client';
import type { CurrentUser, LoginInput } from './types';

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

export function logout() {
  return apiRequest<{ success: true }>('/auth/logout', {
    method: 'POST',
  });
}

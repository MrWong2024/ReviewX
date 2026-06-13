import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse } from '@/src/lib/api/types';
import type {
  AdminUser,
  CreateAdminUserInput,
  ListUsersParams,
  ResetAdminUserPasswordInput,
  UpdateAdminUserInput,
  UpdateAdminUserStatusInput,
} from '../types/users';

export function listUsers(params: ListUsersParams = {}) {
  return apiRequest<PaginatedResponse<AdminUser>>('/admin/users', {
    method: 'GET',
    params,
  });
}

export function createUser(input: CreateAdminUserInput) {
  return apiRequest<AdminUser>('/admin/users', {
    body: input,
    method: 'POST',
  });
}

export function getUser(id: string) {
  return apiRequest<AdminUser>(`/admin/users/${id}`, {
    method: 'GET',
  });
}

export function updateUser(id: string, input: UpdateAdminUserInput) {
  return apiRequest<AdminUser>(`/admin/users/${id}`, {
    body: input,
    method: 'PATCH',
  });
}

export function updateUserStatus(
  id: string,
  input: UpdateAdminUserStatusInput,
) {
  return apiRequest<AdminUser>(`/admin/users/${id}/status`, {
    body: input,
    method: 'PATCH',
  });
}

export function resetUserPassword(
  id: string,
  input: ResetAdminUserPasswordInput,
) {
  return apiRequest<AdminUser>(`/admin/users/${id}/reset-password`, {
    body: input,
    method: 'POST',
  });
}

import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse, QueryParams } from '@/src/lib/api/types';
import type {
  Batch,
  BatchFormInput,
  Dictionary,
  DictionaryFormInput,
  Organization,
  OrganizationFormInput,
  ReviewScheme,
  ReviewSchemeFormInput,
  TreeDictionary,
  TreeDictionaryFormInput,
} from './types';

export function listBatches(params: QueryParams = {}) {
  return apiRequest<PaginatedResponse<Batch>>('/admin/batches', {
    method: 'GET',
    params: { pageSize: 1000, ...params },
  });
}

export function createBatch(input: BatchFormInput) {
  return apiRequest<Batch>('/admin/batches', {
    body: input,
    method: 'POST',
  });
}

export function updateBatch(id: string, input: Partial<BatchFormInput>) {
  return apiRequest<Batch>(`/admin/batches/${id}`, {
    body: input,
    method: 'PATCH',
  });
}

export function deleteBatch(id: string) {
  return apiRequest<Batch>(`/admin/batches/${id}`, {
    method: 'DELETE',
  });
}

export function listDictionaries(params: QueryParams = {}) {
  return apiRequest<Dictionary[]>('/admin/dictionaries', {
    method: 'GET',
    params,
  });
}

export function createDictionary(input: DictionaryFormInput) {
  return apiRequest<Dictionary>('/admin/dictionaries', {
    body: input,
    method: 'POST',
  });
}

export function updateDictionary(
  id: string,
  input: Partial<DictionaryFormInput>,
) {
  return apiRequest<Dictionary>(`/admin/dictionaries/${id}`, {
    body: input,
    method: 'PATCH',
  });
}

export function deleteDictionary(id: string) {
  return apiRequest<Dictionary>(`/admin/dictionaries/${id}`, {
    method: 'DELETE',
  });
}

export function listTreeDictionaries(params: QueryParams = {}) {
  return apiRequest<TreeDictionary[]>('/admin/tree-dictionaries', {
    method: 'GET',
    params,
  });
}

export function createTreeDictionary(input: TreeDictionaryFormInput) {
  return apiRequest<TreeDictionary>('/admin/tree-dictionaries', {
    body: input,
    method: 'POST',
  });
}

export function updateTreeDictionary(
  id: string,
  input: Partial<TreeDictionaryFormInput>,
) {
  return apiRequest<TreeDictionary>(`/admin/tree-dictionaries/${id}`, {
    body: input,
    method: 'PATCH',
  });
}

export function deleteTreeDictionary(id: string) {
  return apiRequest<TreeDictionary>(`/admin/tree-dictionaries/${id}`, {
    method: 'DELETE',
  });
}

export function listOrganizations(params: QueryParams = {}) {
  return apiRequest<PaginatedResponse<Organization>>('/admin/organizations', {
    method: 'GET',
    params: { pageSize: 1000, ...params },
  });
}

export function createOrganization(input: OrganizationFormInput) {
  return apiRequest<Organization>('/admin/organizations', {
    body: input,
    method: 'POST',
  });
}

export function updateOrganization(
  id: string,
  input: Partial<OrganizationFormInput>,
) {
  return apiRequest<Organization>(`/admin/organizations/${id}`, {
    body: input,
    method: 'PATCH',
  });
}

export function deleteOrganization(id: string) {
  return apiRequest<Organization>(`/admin/organizations/${id}`, {
    method: 'DELETE',
  });
}

export function listReviewSchemes(params: QueryParams = {}) {
  return apiRequest<ReviewScheme[]>('/admin/review-schemes', {
    method: 'GET',
    params,
  });
}

export function createReviewScheme(input: ReviewSchemeFormInput) {
  return apiRequest<ReviewScheme>('/admin/review-schemes', {
    body: input,
    method: 'POST',
  });
}

export function updateReviewScheme(
  id: string,
  input: Partial<ReviewSchemeFormInput>,
) {
  return apiRequest<ReviewScheme>(`/admin/review-schemes/${id}`, {
    body: input,
    method: 'PATCH',
  });
}

export function deleteReviewScheme(id: string) {
  return apiRequest<ReviewScheme>(`/admin/review-schemes/${id}`, {
    method: 'DELETE',
  });
}

export * from './api/users';
export * from './api/project-review-organization';
export * from './api/project-imports';
export * from './api/project-import-field-mappings';

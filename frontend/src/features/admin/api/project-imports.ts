import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse } from '@/src/lib/api/types';
import type {
  BulkConfirmProjectImportResponse,
  DeleteProjectImportJobResponse,
  ListProjectImportJobsParams,
  ListProjectImportRowsParams,
  ProjectImportJob,
  ProjectImportRow,
  UpdateProjectImportRowInput,
  UploadProjectImportInput,
} from '../types/project-imports';

export function uploadProjectImport(input: UploadProjectImportInput) {
  const formData = new FormData();

  formData.append('file', input.file);
  formData.append('batchId', input.batchId);

  return apiRequest<ProjectImportJob>('/admin/project-imports/upload', {
    body: formData,
    method: 'POST',
  });
}

export function listProjectImportJobs(
  params: ListProjectImportJobsParams = {},
) {
  return apiRequest<PaginatedResponse<ProjectImportJob>>(
    '/admin/project-imports',
    {
      method: 'GET',
      params,
    },
  );
}

export function getProjectImportJob(id: string) {
  return apiRequest<ProjectImportJob>(`/admin/project-imports/${id}`, {
    method: 'GET',
  });
}

export function deleteProjectImportJob(id: string) {
  return apiRequest<DeleteProjectImportJobResponse>(
    `/admin/project-imports/${id}`,
    {
      method: 'DELETE',
    },
  );
}

export function listProjectImportRows(
  jobId: string,
  params: ListProjectImportRowsParams = {},
) {
  return apiRequest<PaginatedResponse<ProjectImportRow>>(
    `/admin/project-imports/${jobId}/rows`,
    {
      method: 'GET',
      params,
    },
  );
}

export function updateProjectImportRow(
  jobId: string,
  rowId: string,
  input: UpdateProjectImportRowInput,
) {
  return apiRequest<ProjectImportRow>(
    `/admin/project-imports/${jobId}/rows/${rowId}`,
    {
      body: input,
      method: 'PATCH',
    },
  );
}

export function confirmProjectImportRow(jobId: string, rowId: string) {
  return apiRequest<ProjectImportRow>(
    `/admin/project-imports/${jobId}/rows/${rowId}/confirm`,
    {
      method: 'POST',
    },
  );
}

export function confirmProjectImportJob(jobId: string) {
  return apiRequest<BulkConfirmProjectImportResponse>(
    `/admin/project-imports/${jobId}/confirm`,
    {
      method: 'POST',
    },
  );
}

export function skipProjectImportRow(jobId: string, rowId: string) {
  return apiRequest<ProjectImportRow>(
    `/admin/project-imports/${jobId}/rows/${rowId}/skip`,
    {
      method: 'POST',
    },
  );
}

import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse } from '@/src/lib/api/types';
import type {
  AdminDeleteProjectMaterialResult,
  AdminProjectMaterial,
  AdminProjectMaterialDownloadUrlResult,
  AppendExpertsResult,
  AppendProjectExpertsInput,
  BatchProjectExpertsInput,
  BatchProjectExpertsResult,
  BatchReviewAssignmentResult,
  BatchUpdateReviewAssignmentInput,
  DeleteAdminProjectMaterialInput,
  ExpertBasic,
  ExpertCandidatePage,
  ListProjectExpertCandidatesParams,
  ListProjectsParams,
  Project,
  RemoveExpertResult,
  ReplaceExpertsResult,
  UpdateProjectExpertsInput,
  UpdateProjectScheduleInput,
  UpdateReviewAssignmentInput,
} from '../types/project-review-organization';

export function getProject(id: string) {
  return apiRequest<Project>(`/admin/projects/${id}`, {
    method: 'GET',
  });
}

export function updateProjectReviewAssignment(
  id: string,
  input: UpdateReviewAssignmentInput,
) {
  return apiRequest<Project>(`/admin/projects/${id}/review-assignment`, {
    body: input,
    method: 'PATCH',
  });
}

export function batchUpdateProjectReviewAssignment(
  input: BatchUpdateReviewAssignmentInput,
) {
  return apiRequest<BatchReviewAssignmentResult>(
    '/admin/projects/review-assignment/batch',
    {
      body: input,
      method: 'PATCH',
    },
  );
}

export function updateProjectSchedule(
  id: string,
  input: UpdateProjectScheduleInput,
) {
  return apiRequest<Project>(`/admin/projects/${id}/schedule`, {
    body: input,
    method: 'PATCH',
  });
}

export function listProjectExpertCandidates(
  projectId: string,
  params: ListProjectExpertCandidatesParams = {},
) {
  return apiRequest<ExpertCandidatePage>(
    `/admin/projects/${projectId}/expert-candidates`,
    {
      method: 'GET',
      params,
    },
  );
}

export function listAdminProjectMaterials(projectId: string) {
  return apiRequest<AdminProjectMaterial[]>(
    `/admin/projects/${projectId}/materials`,
    {
      method: 'GET',
    },
  );
}

export function getAdminProjectMaterialDownloadUrl(
  projectId: string,
  materialId: string,
) {
  return apiRequest<AdminProjectMaterialDownloadUrlResult>(
    `/admin/projects/${projectId}/materials/${materialId}/download-url`,
    {
      method: 'GET',
    },
  );
}

export function deleteAdminProjectMaterial(
  projectId: string,
  materialId: string,
  input: DeleteAdminProjectMaterialInput,
) {
  return apiRequest<AdminDeleteProjectMaterialResult>(
    `/admin/projects/${projectId}/materials/${materialId}`,
    {
      body: input,
      method: 'DELETE',
    },
  );
}

export function resolveAdminProjectMaterialDownloadUrl(
  response: AdminProjectMaterialDownloadUrlResult,
): string | null {
  if (typeof response === 'string') {
    return response.trim() || null;
  }

  const url = response.url ?? response.downloadUrl;

  if (!url || typeof url !== 'string') {
    return null;
  }

  return url.trim() || null;
}

export function listAssignedProjectExperts(projectId: string) {
  return apiRequest<ExpertBasic[]>(
    `/review-manager/projects/${projectId}/experts`,
    {
      method: 'GET',
    },
  );
}

export function appendProjectExperts(
  projectId: string,
  input: AppendProjectExpertsInput,
) {
  return apiRequest<AppendExpertsResult>(
    `/review-manager/projects/${projectId}/experts`,
    {
      body: input,
      method: 'POST',
    },
  );
}

export function replaceProjectExperts(
  projectId: string,
  input: UpdateProjectExpertsInput,
) {
  return apiRequest<ReplaceExpertsResult>(
    `/review-manager/projects/${projectId}/experts`,
    {
      body: input,
      method: 'PUT',
    },
  );
}

export function removeProjectExpert(projectId: string, expertUserId: string) {
  return apiRequest<RemoveExpertResult>(
    `/review-manager/projects/${projectId}/experts/${expertUserId}`,
    {
      method: 'DELETE',
    },
  );
}

export function batchUpdateProjectExperts(input: BatchProjectExpertsInput) {
  return apiRequest<BatchProjectExpertsResult>(
    '/review-manager/projects/experts/batch',
    {
      body: input,
      method: 'PUT',
    },
  );
}

export function listProjects(params: ListProjectsParams = {}) {
  return apiRequest<PaginatedResponse<Project>>('/admin/projects', {
    method: 'GET',
    params: { pageSize: 100, ...params },
  });
}

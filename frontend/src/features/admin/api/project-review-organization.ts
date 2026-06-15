import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse } from '@/src/lib/api/types';
import type {
  AppendExpertsResult,
  AppendProjectExpertsInput,
  BatchProjectExpertsInput,
  BatchProjectExpertsResult,
  BatchReviewAssignmentResult,
  BatchUpdateReviewAssignmentInput,
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

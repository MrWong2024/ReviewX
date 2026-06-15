import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse } from '@/src/lib/api/types';
import type {
  DeleteProjectMaterialResult,
  ProjectMaterial,
  ProjectMaterialDownloadUrlResponse,
  ProjectOwnerProject,
  QueryProjectMaterialsParams,
  QueryProjectOwnerProjectsParams,
  UpdateFollowUpNeedsInput,
  UploadProjectMaterialsInput,
  UploadProjectMaterialsResult,
} from './types';

export const MATERIAL_TYPE_CONTRACT_GAP_MESSAGE =
  '材料类型接口暂不可用：当前后端仅提供 admin-only 普通字典接口，project_owner 无法读取 dictType=material_type。';

export function listProjectOwnerProjects(
  params: QueryProjectOwnerProjectsParams = {},
) {
  return apiRequest<PaginatedResponse<ProjectOwnerProject>>(
    '/project-owner/projects',
    {
      method: 'GET',
      params,
    },
  );
}

export function getProjectOwnerProject(projectId: string) {
  return apiRequest<ProjectOwnerProject>(
    `/project-owner/projects/${projectId}`,
    {
      method: 'GET',
    },
  );
}

export function updateProjectOwnerFollowUpNeeds(
  projectId: string,
  input: UpdateFollowUpNeedsInput,
) {
  return apiRequest<ProjectOwnerProject>(
    `/project-owner/projects/${projectId}/follow-up-needs`,
    {
      body: { followUpNeeds: input.followUpNeeds },
      method: 'PATCH',
    },
  );
}

export function listProjectOwnerMaterials(
  projectId: string,
  params: QueryProjectMaterialsParams = {},
) {
  return apiRequest<ProjectMaterial[]>(
    `/project-owner/projects/${projectId}/materials`,
    {
      method: 'GET',
      params,
    },
  );
}

export function uploadProjectOwnerMaterials(input: UploadProjectMaterialsInput) {
  const formData = new FormData();

  formData.append('materialTypeId', input.materialTypeId);
  input.files.forEach((file) => formData.append('files', file));

  if (input.remark) {
    formData.append('remark', input.remark);
  }

  return apiRequest<UploadProjectMaterialsResult>(
    `/project-owner/projects/${input.projectId}/materials`,
    {
      body: formData,
      method: 'POST',
    },
  );
}

export function getProjectOwnerMaterialDownloadUrl(
  projectId: string,
  materialId: string,
) {
  return apiRequest<ProjectMaterialDownloadUrlResponse>(
    `/project-owner/projects/${projectId}/materials/${materialId}/download-url`,
    {
      method: 'GET',
    },
  );
}

export function deleteProjectOwnerMaterial(
  projectId: string,
  materialId: string,
) {
  return apiRequest<DeleteProjectMaterialResult>(
    `/project-owner/projects/${projectId}/materials/${materialId}`,
    {
      method: 'DELETE',
    },
  );
}

export function resolveProjectMaterialDownloadUrl(
  response: ProjectMaterialDownloadUrlResponse,
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

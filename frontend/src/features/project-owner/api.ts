import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse, QueryParams } from '@/src/lib/api/types';
import type {
  DeleteProjectMaterialResult,
  PortalBatchSummary,
  PortalDictionarySummary,
  PortalListResponse,
  PortalOrganizationSummary,
  PortalReviewSchemeSummary,
  PortalTreeDictionarySummary,
  PortalUserSummary,
  ProjectMaterial,
  ProjectMaterialDownloadUrlResponse,
  ProjectOwnerReferenceData,
  ProjectOwnerProject,
  QueryProjectMaterialsParams,
  QueryProjectOwnerProjectsParams,
  SubmitProjectMaterialsInput,
  SubmitProjectMaterialsResult,
  UpdateFollowUpNeedsInput,
  UploadProjectMaterialsInput,
  UploadProjectMaterialsResult,
} from './types';

type PortalDictionaryQueryParams = QueryParams & {
  dictType?: string;
  dictTypes?: string;
  isActive?: boolean;
  keyword?: string;
};

type PortalTreeDictionaryQueryParams = QueryParams & {
  isActive?: boolean;
  keyword?: string;
  treeType?: string;
  treeTypes?: string;
};

type PortalCommonQueryParams = QueryParams & {
  isActive?: boolean;
  keyword?: string;
};

type PortalUsersQueryParams = PortalCommonQueryParams & {
  role?: 'expert' | 'project_owner' | 'review_manager';
  roles?: string;
};

const PROJECT_OWNER_DICTIONARY_TYPES = 'material_type,project_status';
const PROJECT_OWNER_TREE_TYPES =
  'project_type,discipline,department,administrative_division';

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

export function listPortalDictionaries(
  params: PortalDictionaryQueryParams = {},
) {
  return apiRequest<PortalListResponse<PortalDictionarySummary>>(
    '/portal/reference-data/dictionaries',
    {
      method: 'GET',
      params,
    },
  );
}

export function listPortalTreeDictionaries(
  params: PortalTreeDictionaryQueryParams = {},
) {
  return apiRequest<PortalListResponse<PortalTreeDictionarySummary>>(
    '/portal/reference-data/tree-dictionaries',
    {
      method: 'GET',
      params,
    },
  );
}

export function listPortalBatches(params: PortalCommonQueryParams = {}) {
  return apiRequest<PortalListResponse<PortalBatchSummary>>(
    '/portal/reference-data/batches',
    {
      method: 'GET',
      params,
    },
  );
}

export function listPortalOrganizations(params: PortalCommonQueryParams = {}) {
  return apiRequest<PortalListResponse<PortalOrganizationSummary>>(
    '/portal/reference-data/organizations',
    {
      method: 'GET',
      params,
    },
  );
}

export function listPortalReviewSchemes(params: PortalCommonQueryParams = {}) {
  return apiRequest<PortalListResponse<PortalReviewSchemeSummary>>(
    '/portal/reference-data/review-schemes',
    {
      method: 'GET',
      params,
    },
  );
}

export function listPortalUsers(params: PortalUsersQueryParams) {
  return apiRequest<PortalListResponse<PortalUserSummary>>(
    '/portal/reference-data/users',
    {
      method: 'GET',
      params,
    },
  );
}

export async function loadProjectOwnerReferenceData(): Promise<ProjectOwnerReferenceData> {
  const [
    dictionariesResponse,
    treeDictionariesResponse,
    batchesResponse,
    organizationsResponse,
    reviewSchemesResponse,
    reviewManagersResponse,
  ] = await Promise.all([
    listPortalDictionaries({ dictTypes: PROJECT_OWNER_DICTIONARY_TYPES }),
    listPortalTreeDictionaries({ treeTypes: PROJECT_OWNER_TREE_TYPES }),
    listPortalBatches(),
    listPortalOrganizations(),
    listPortalReviewSchemes(),
    listPortalUsers({ role: 'review_manager' }),
  ]);

  const dictionaries = sortDictionaries(dictionariesResponse.items);
  const treeDictionaries = sortTreeDictionaries(treeDictionariesResponse.items);
  const materialTypes = dictionaries.filter(
    (item) => item.dictType === 'material_type' && item.isActive,
  );
  const projectStatuses = dictionaries.filter(
    (item) => item.dictType === 'project_status' && item.isActive,
  );

  return {
    batches: sortNamedItems(batchesResponse.items),
    dictionaries,
    materialTypes,
    organizations: sortNamedItems(organizationsResponse.items),
    projectStatuses,
    reviewManagers: sortNamedItems(reviewManagersResponse.items),
    reviewSchemes: sortNamedItems(reviewSchemesResponse.items),
    treeDictionaries,
  };
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

export function submitProjectOwnerMaterials(
  projectId: string,
  input: SubmitProjectMaterialsInput = {},
) {
  return apiRequest<SubmitProjectMaterialsResult>(
    `/project-owner/projects/${projectId}/materials/submit`,
    {
      body: input,
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

function sortDictionaries(
  items: PortalDictionarySummary[],
): PortalDictionarySummary[] {
  return [...items].sort(compareBySortOrderThenName);
}

function sortTreeDictionaries(
  items: PortalTreeDictionarySummary[],
): PortalTreeDictionarySummary[] {
  return [...items].sort(compareBySortOrderThenName);
}

function sortNamedItems<T extends { id: string; name: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const nameCompare = left.name.localeCompare(right.name, 'zh-CN');

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.id.localeCompare(right.id);
  });
}

function compareBySortOrderThenName(
  left: { id: string; name: string; sortOrder: number },
  right: { id: string; name: string; sortOrder: number },
): number {
  const sortOrderCompare = left.sortOrder - right.sortOrder;

  if (sortOrderCompare !== 0) {
    return sortOrderCompare;
  }

  const nameCompare = left.name.localeCompare(right.name, 'zh-CN');

  if (nameCompare !== 0) {
    return nameCompare;
  }

  return left.id.localeCompare(right.id);
}

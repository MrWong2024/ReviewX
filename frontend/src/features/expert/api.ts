import { apiRequest } from '@/src/lib/api/client';
import type { PaginatedResponse, QueryParams } from '@/src/lib/api/types';
import type {
  ExpertMaterial,
  ExpertMaterialDownloadUrlResponse,
  ExpertReferenceData,
  ExpertReview,
  ExpertReviewTask,
  ExpertReviewTaskDetail,
  PortalBatchSummary,
  PortalDictionarySummary,
  PortalListResponse,
  PortalOrganizationSummary,
  PortalReviewSchemeSummary,
  PortalTreeDictionarySummary,
  PortalUserSummary,
  QueryExpertProjectMaterialsParams,
  QueryExpertReviewTasksParams,
  SaveExpertReviewInput,
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

const EXPERT_DICTIONARY_TYPES = 'material_type,project_status';
const EXPERT_TREE_TYPES =
  'project_type,discipline,department,administrative_division';

export function listExpertReviewTasks(
  params: QueryExpertReviewTasksParams = {},
) {
  return apiRequest<PaginatedResponse<ExpertReviewTask>>(
    '/expert/review-tasks',
    {
      method: 'GET',
      params,
    },
  );
}

export function getExpertReviewTask(projectId: string) {
  return apiRequest<ExpertReviewTaskDetail>(
    `/expert/review-tasks/${projectId}`,
    {
      method: 'GET',
    },
  );
}

export function saveExpertReviewDraft(
  projectId: string,
  input: SaveExpertReviewInput,
) {
  return apiRequest<ExpertReview>(`/expert/review-tasks/${projectId}`, {
    body: { items: input.items },
    method: 'PUT',
  });
}

export function submitExpertReview(
  projectId: string,
  input: SaveExpertReviewInput,
) {
  return apiRequest<ExpertReview>(
    `/expert/review-tasks/${projectId}/submit`,
    {
      body: { items: input.items },
      method: 'POST',
    },
  );
}

export function deleteExpertReviewDraft(projectId: string): Promise<void> {
  return apiRequest<void>(`/expert/review-tasks/${projectId}/draft`, {
    method: 'DELETE',
  });
}

export function listExpertProjectMaterials(
  projectId: string,
  params: QueryExpertProjectMaterialsParams = {},
) {
  return apiRequest<ExpertMaterial[]>(`/expert/projects/${projectId}/materials`, {
    method: 'GET',
    params,
  });
}

export function getExpertProjectMaterialDownloadUrl(
  projectId: string,
  materialId: string,
) {
  return apiRequest<ExpertMaterialDownloadUrlResponse>(
    `/expert/projects/${projectId}/materials/${materialId}/download-url`,
    {
      method: 'GET',
    },
  );
}

export function resolveExpertMaterialDownloadUrl(
  response: ExpertMaterialDownloadUrlResponse,
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

export async function loadExpertReferenceData(): Promise<ExpertReferenceData> {
  const [
    dictionariesResponse,
    treeDictionariesResponse,
    batchesResponse,
    organizationsResponse,
    reviewSchemesResponse,
    reviewManagersResponse,
  ] = await Promise.all([
    listPortalDictionaries({ dictTypes: EXPERT_DICTIONARY_TYPES }),
    listPortalTreeDictionaries({ treeTypes: EXPERT_TREE_TYPES }),
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

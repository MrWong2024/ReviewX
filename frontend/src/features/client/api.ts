import { apiRequest } from '@/src/lib/api/client';
import type { QueryParams } from '@/src/lib/api/types';
import type {
  ClientDashboardOverviewResponse,
  ClientDashboardProjectsResponse,
  ClientReferenceData,
  PortalBatchSummary,
  PortalDictionarySummary,
  PortalListResponse,
  PortalOrganizationSummary,
  PortalReviewSchemeSummary,
  PortalTreeDictionarySummary,
  PortalUserSummary,
  QueryClientDashboardParams,
  QueryClientDashboardProjectsParams,
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

const CLIENT_DICTIONARY_TYPES = 'project_status,review_level';
const CLIENT_TREE_TYPES =
  'project_type,discipline,department,administrative_division';

export function listClientDashboardOverview(
  params: QueryClientDashboardParams = {},
) {
  return apiRequest<ClientDashboardOverviewResponse>(
    '/client/dashboard/overview',
    {
      method: 'GET',
      params,
    },
  );
}

export function listClientDashboardProjects(
  params: QueryClientDashboardProjectsParams = {},
) {
  return apiRequest<ClientDashboardProjectsResponse>(
    '/client/dashboard/projects',
    {
      method: 'GET',
      params,
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

export async function loadClientReferenceData(): Promise<ClientReferenceData> {
  const [
    dictionariesResponse,
    treeDictionariesResponse,
    batchesResponse,
    organizationsResponse,
    reviewSchemesResponse,
    reviewManagersResponse,
    projectOwnersResponse,
  ] = await Promise.all([
    listPortalDictionaries({ dictTypes: CLIENT_DICTIONARY_TYPES }),
    listPortalTreeDictionaries({ treeTypes: CLIENT_TREE_TYPES }),
    listPortalBatches(),
    listPortalOrganizations(),
    listPortalReviewSchemes(),
    listPortalUsers({ role: 'review_manager' }),
    listPortalUsers({ role: 'project_owner' }),
  ]);

  const dictionaries = sortDictionaries(dictionariesResponse.items);
  const treeDictionaries = sortTreeDictionaries(treeDictionariesResponse.items);
  const projectStatuses = dictionaries.filter(
    (item) => item.dictType === 'project_status' && item.isActive,
  );
  const reviewLevels = dictionaries.filter(
    (item) => item.dictType === 'review_level' && item.isActive,
  );

  return {
    batches: sortNamedItems(batchesResponse.items),
    dictionaries,
    organizations: sortNamedItems(organizationsResponse.items),
    projectOwners: sortNamedItems(projectOwnersResponse.items),
    projectStatuses,
    reviewLevels,
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

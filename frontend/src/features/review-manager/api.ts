import { apiRequest } from '@/src/lib/api/client';
import { isApiError } from '@/src/lib/api/errors';
import type { QueryParams } from '@/src/lib/api/types';
import type {
  AppendReviewManagerProjectExpertsInput,
  AppendReviewManagerProjectExpertsResult,
  ConfirmConsensusReviewPayload,
  ConsensusReviewResponse,
  ExpertReviewDetail,
  ExpertReviewListItem,
  GenerateConsensusDraftOptions,
  HandleReviewManagerAppealInput,
  ListReviewManagerExpertCandidatesParams,
  PortalBatchSummary,
  PortalDictionarySummary,
  PortalListResponse,
  PortalOrganizationSummary,
  PortalReviewSchemeSummary,
  PortalTreeDictionarySummary,
  PortalUserSummary,
  QueryReviewManagerProjectsParams,
  RemoveReviewManagerProjectExpertResult,
  ReplaceReviewManagerProjectExpertsResult,
  ReviewManagerAssignedExpert,
  ReviewManagerExpertCandidatePage,
  ReviewManagerProjectMaterialDownloadUrlResult,
  ReviewManagerProjectMaterialListItem,
  ReviewManagerProjectSchedulePayload,
  ReviewManagerProjectListItem,
  ReviewManagerProjectsResponse,
  ReviewManagerReferenceData,
  ReviewSummaryResponse,
  ProjectAppeal,
  ProjectAppealAttachment,
  ProjectAppealAttachmentDownloadUrlResponse,
  ProjectAppealDetail,
  UpdateReviewManagerProjectExpertsInput,
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

const REVIEW_MANAGER_DICTIONARY_TYPES =
  'project_status,review_level,material_type';
const REVIEW_MANAGER_TREE_TYPES =
  'project_type,discipline,department,administrative_division';
const PROJECT_SUMMARY_PAGE_SIZE = 1000;

export function listReviewManagerProjects(
  params: QueryReviewManagerProjectsParams = {},
) {
  return apiRequest<ReviewManagerProjectsResponse>(
    '/review-manager/projects',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getReviewManagerProjectSummary(
  projectId: string,
): Promise<ReviewManagerProjectListItem | null> {
  // 当前后端没有 GET /review-manager/projects/:id。
  // ReviewX 年度数据量很小，详情页摘要临时通过大页项目列表前端匹配。
  const response = await listReviewManagerProjects({
    page: 1,
    pageSize: PROJECT_SUMMARY_PAGE_SIZE,
  });

  return response.items.find((project) => project.id === projectId) ?? null;
}

export function listReviewManagerProjectExpertCandidates(
  projectId: string,
  params: ListReviewManagerExpertCandidatesParams = {},
) {
  return apiRequest<ReviewManagerExpertCandidatePage>(
    `/review-manager/projects/${projectId}/expert-candidates`,
    {
      method: 'GET',
      params,
    },
  );
}

export function listReviewManagerAssignedProjectExperts(projectId: string) {
  return apiRequest<ReviewManagerAssignedExpert[]>(
    `/review-manager/projects/${projectId}/experts`,
    {
      method: 'GET',
    },
  );
}

export function appendReviewManagerProjectExperts(
  projectId: string,
  input: AppendReviewManagerProjectExpertsInput,
) {
  return apiRequest<AppendReviewManagerProjectExpertsResult>(
    `/review-manager/projects/${projectId}/experts`,
    {
      body: input,
      method: 'POST',
    },
  );
}

export function replaceReviewManagerProjectExperts(
  projectId: string,
  input: UpdateReviewManagerProjectExpertsInput,
) {
  return apiRequest<ReplaceReviewManagerProjectExpertsResult>(
    `/review-manager/projects/${projectId}/experts`,
    {
      body: input,
      method: 'PUT',
    },
  );
}

export function removeReviewManagerProjectExpert(
  projectId: string,
  expertUserId: string,
) {
  return apiRequest<RemoveReviewManagerProjectExpertResult>(
    `/review-manager/projects/${projectId}/experts/${expertUserId}`,
    {
      method: 'DELETE',
    },
  );
}

export function updateReviewManagerProjectSchedule(
  projectId: string,
  payload: ReviewManagerProjectSchedulePayload,
) {
  return apiRequest<ReviewManagerProjectListItem>(
    `/review-manager/projects/${projectId}/schedule`,
    {
      body: payload,
      method: 'PATCH',
    },
  );
}

export function listReviewManagerProjectMaterials(projectId: string) {
  return apiRequest<ReviewManagerProjectMaterialListItem[]>(
    `/review-manager/projects/${projectId}/materials`,
    {
      method: 'GET',
    },
  );
}

export function getReviewManagerProjectMaterialDownloadUrl(
  projectId: string,
  materialId: string,
) {
  return apiRequest<ReviewManagerProjectMaterialDownloadUrlResult>(
    `/review-manager/projects/${projectId}/materials/${materialId}/download-url`,
    {
      method: 'GET',
    },
  );
}

export function resolveReviewManagerProjectMaterialDownloadUrl(
  response: ReviewManagerProjectMaterialDownloadUrlResult,
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

export function listProjectExpertReviews(projectId: string) {
  return apiRequest<ExpertReviewListItem[]>(
    `/review-manager/projects/${projectId}/expert-reviews`,
    {
      method: 'GET',
    },
  );
}

export function getProjectExpertReview(
  projectId: string,
  expertUserId: string,
) {
  return apiRequest<ExpertReviewDetail>(
    `/review-manager/projects/${projectId}/expert-reviews/${expertUserId}`,
    {
      method: 'GET',
    },
  );
}

export function returnProjectExpertReview(
  projectId: string,
  expertUserId: string,
  returnReason: string,
) {
  return apiRequest<ExpertReviewDetail>(
    `/review-manager/projects/${projectId}/expert-reviews/${expertUserId}/return`,
    {
      body: { returnReason },
      method: 'POST',
    },
  );
}

export function getProjectReviewSummary(projectId: string) {
  return apiRequest<ReviewSummaryResponse>(
    `/review-manager/projects/${projectId}/review-summary`,
    {
      method: 'GET',
    },
  );
}

export async function getProjectConsensus(
  projectId: string,
): Promise<ConsensusReviewResponse | null> {
  try {
    return await apiRequest<ConsensusReviewResponse>(
      `/review-manager/projects/${projectId}/consensus`,
      {
        method: 'GET',
      },
    );
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function generateProjectConsensusDraft(
  projectId: string,
  options: GenerateConsensusDraftOptions = {},
) {
  return apiRequest<ConsensusReviewResponse>(
    `/review-manager/projects/${projectId}/consensus/draft`,
    {
      method: 'POST',
      params: { force: options.force },
    },
  );
}

export function confirmProjectConsensus(
  projectId: string,
  payload: ConfirmConsensusReviewPayload,
) {
  return apiRequest<ConsensusReviewResponse>(
    `/review-manager/projects/${projectId}/consensus/confirm`,
    {
      body: payload,
      method: 'POST',
    },
  );
}

export function listReviewManagerAppeals(projectId: string) {
  return apiRequest<ProjectAppeal[]>(
    `/review-manager/projects/${projectId}/appeals`,
    {
      method: 'GET',
    },
  );
}

export function getReviewManagerAppeal(projectId: string, appealId: string) {
  return apiRequest<ProjectAppealDetail>(
    `/review-manager/projects/${projectId}/appeals/${appealId}`,
    {
      method: 'GET',
    },
  );
}

export function listReviewManagerAppealAttachments(
  projectId: string,
  appealId: string,
) {
  return apiRequest<ProjectAppealAttachment[]>(
    `/review-manager/projects/${projectId}/appeals/${appealId}/attachments`,
    {
      method: 'GET',
    },
  );
}

export function getReviewManagerAppealAttachmentDownloadUrl(
  projectId: string,
  appealId: string,
  attachmentId: string,
) {
  return apiRequest<ProjectAppealAttachmentDownloadUrlResponse>(
    `/review-manager/projects/${projectId}/appeals/${appealId}/attachments/${attachmentId}/download-url`,
    {
      method: 'GET',
    },
  );
}

export function handleReviewManagerAppeal(
  projectId: string,
  appealId: string,
  input: HandleReviewManagerAppealInput,
) {
  return apiRequest<ProjectAppealDetail>(
    `/review-manager/projects/${projectId}/appeals/${appealId}/handle`,
    {
      body: input,
      method: 'POST',
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

export async function loadReviewManagerReferenceData(): Promise<ReviewManagerReferenceData> {
  const [
    dictionariesResponse,
    treeDictionariesResponse,
    batchesResponse,
    organizationsResponse,
    reviewSchemesResponse,
    projectOwnersResponse,
    reviewManagersResponse,
  ] = await Promise.all([
    listPortalDictionaries({ dictTypes: REVIEW_MANAGER_DICTIONARY_TYPES }),
    listPortalTreeDictionaries({ treeTypes: REVIEW_MANAGER_TREE_TYPES }),
    listPortalBatches(),
    listPortalOrganizations(),
    listPortalReviewSchemes(),
    listPortalUsers({ role: 'project_owner' }),
    listPortalUsers({ role: 'review_manager' }),
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
    reviewManagers: sortNamedItems(reviewManagersResponse.items),
    projectStatuses,
    reviewLevels,
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

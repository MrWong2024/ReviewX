import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import type {
  ExpertReviewListItem,
  ExpertReviewViewStatus,
  PortalDictionarySummary,
  ReviewManagerLookupMaps,
  ReviewManagerReferenceData,
  ReviewSchemeSnapshot,
} from './types';

export const RETURN_REASON_MAX_LENGTH = 1000;
export const FINAL_OPINION_MAX_LENGTH = 10000;

export const EXPERT_REVIEW_STATUS_OPTIONS: Array<{
  label: string;
  value: ExpertReviewViewStatus;
}> = [
  { label: '未开始', value: 'not_started' },
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
  { label: '已退回', value: 'returned' },
];

export const FALLBACK_REVIEW_LEVEL_OPTIONS: PortalDictionarySummary[] = [
  createFallbackReviewLevel('A'),
  createFallbackReviewLevel('B'),
  createFallbackReviewLevel('C'),
  createFallbackReviewLevel('D'),
];

export function getExpertReviewStatusView(status: ExpertReviewViewStatus): {
  description: string;
  label: string;
  tone: 'danger' | 'success' | 'muted' | 'warning' | 'primary';
} {
  switch (status) {
    case 'not_started':
      return {
        description: '该专家尚未开始评分',
        label: '未开始',
        tone: 'muted',
      };
    case 'draft':
      return {
        description: '该专家已保存草稿，尚未提交',
        label: '草稿',
        tone: 'warning',
      };
    case 'submitted':
      return {
        description: '该专家评分已提交，可由评审负责人退回',
        label: '已提交',
        tone: 'success',
      };
    case 'returned':
      return {
        description: '该专家评分已退回，等待专家修改重提',
        label: '已退回',
        tone: 'danger',
      };
  }
}

export function canReturnExpertReview(
  item: Pick<ExpertReviewListItem, 'status'>,
): boolean {
  return item.status === 'submitted';
}

export function createEmptyReviewManagerLookupMaps(): ReviewManagerLookupMaps {
  return {
    batchNameById: new Map<string, string>(),
    dictionaryNameById: new Map<string, string>(),
    organizationNameById: new Map<string, string>(),
    reviewLevelLabelByValue: new Map<string, string>(),
    reviewSchemeNameById: new Map<string, string>(),
    treeNameById: new Map<string, string>(),
    userNameById: new Map<string, string>(),
  };
}

export function buildReviewManagerLookupMaps(
  referenceData: ReviewManagerReferenceData,
): ReviewManagerLookupMaps {
  const reviewLevels =
    referenceData.reviewLevels.length > 0
      ? referenceData.reviewLevels
      : FALLBACK_REVIEW_LEVEL_OPTIONS;

  return {
    batchNameById: new Map(
      referenceData.batches.map((item) => [item.id, item.name]),
    ),
    dictionaryNameById: new Map(
      referenceData.dictionaries.map((item) => [item.id, item.name]),
    ),
    organizationNameById: new Map(
      referenceData.organizations.map((item) => [item.id, item.name]),
    ),
    reviewLevelLabelByValue: new Map(
      reviewLevels.flatMap((item) => [
        [item.code, item.name],
        [item.name, item.name],
      ]),
    ),
    reviewSchemeNameById: new Map(
      referenceData.reviewSchemes.map((item) => [item.id, item.name]),
    ),
    treeNameById: new Map(
      referenceData.treeDictionaries.map((item) => [item.id, item.name]),
    ),
    userNameById: new Map(
      [...referenceData.projectOwners, ...referenceData.reviewManagers].map((item) => [
        item.id,
        formatUserName(item),
      ]),
    ),
  };
}

export function getReviewLevelOptions(
  referenceData: ReviewManagerReferenceData | null,
): PortalDictionarySummary[] {
  const levels = referenceData?.reviewLevels ?? [];

  return levels.length > 0 ? levels : FALLBACK_REVIEW_LEVEL_OPTIONS;
}

export function formatUserName(user: { name: string; phone?: string }): string {
  const name = user.name.trim();
  const phone = user.phone?.trim();

  return phone ? `${name}（${phone}）` : name;
}

export function shortId(id: string): string {
  const trimmed = id.trim();

  if (trimmed.length <= 8) {
    return trimmed;
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function formatLookupName(
  id: string | null | undefined,
  nameById: Map<string, string>,
  unknownLabel = '未知项',
): string {
  if (!id) {
    return '-';
  }

  return nameById.get(id) ?? `${unknownLabel}（${shortId(id)}）`;
}

export function formatNames(
  ids: string[],
  nameById: Map<string, string>,
  unknownLabel = '未知项',
): string {
  if (ids.length === 0) {
    return '-';
  }

  return ids.map((id) => formatLookupName(id, nameById, unknownLabel)).join('、');
}

export function formatExpertOrganizations(
  expert: {
    organizationIds?: string[];
    organizationNames?: string[];
  },
  organizationNameById: Map<string, string>,
): string {
  if (expert.organizationNames && expert.organizationNames.length > 0) {
    return expert.organizationNames.join('、');
  }

  return formatNames(expert.organizationIds ?? [], organizationNameById, '未知单位');
}

export function formatScore(value?: number | null, emptyText = '-'): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return emptyText;
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function parseScoreInput(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

export function getReviewSchemeTotalScore(
  snapshot?: ReviewSchemeSnapshot | Record<string, unknown> | null,
): number | null {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const totalScore = snapshot.totalScore;

  return typeof totalScore === 'number' && Number.isFinite(totalScore)
    ? totalScore
    : null;
}

export function formatConsensusDraftSource(source: string): string {
  switch (source) {
    case 'rule_based':
      return '规则生成';
    case 'manual':
      return '人工填写';
    case 'ai':
      return 'AI 生成';
    default:
      return source || '-';
  }
}

export function isDraftAlreadyExistsError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.status === 409 &&
    error.message.includes('Consensus draft already exists')
  );
}

export function isConfirmedConsensusError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.status === 409 &&
    error.message.includes('Confirmed consensus review cannot be overwritten')
  );
}

export function formatReviewManagerErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 403) {
      return '当前账号无权访问该项目。';
    }

    if (error.status === 404) {
      return '资源不存在或当前账号无权访问。';
    }

    return getErrorMessage(error);
  }

  return getErrorMessage(error);
}

function createFallbackReviewLevel(code: string): PortalDictionarySummary {
  return {
    code,
    dictType: 'review_level',
    id: code,
    isActive: true,
    name: code,
    sortOrder: code.charCodeAt(0),
  };
}

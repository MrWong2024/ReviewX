import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import type {
  ExpertLookupMaps,
  ExpertReferenceData,
  ExpertReviewItem,
  ExpertReviewProjectSummary,
  ExpertReviewViewStatus,
  ReviewSchemeSnapshotItem,
} from './types';

export const DEFAULT_SUGGESTION_REQUIRED_THRESHOLD_RATIO = 0.8;

export const EXPERT_REVIEW_STATUS_OPTIONS: Array<{
  label: string;
  value: ExpertReviewViewStatus;
}> = [
  { label: '未开始', value: 'not_started' },
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
  { label: '已退回', value: 'returned' },
];

export function getExpertReviewStatusView(status: ExpertReviewViewStatus): {
  description: string;
  label: string;
  tone: 'danger' | 'success' | 'muted' | 'warning' | 'primary';
} {
  switch (status) {
    case 'not_started':
      return {
        description: '尚未保存评分，可开始填写并保存草稿',
        label: '未开始',
        tone: 'muted',
      };
    case 'draft':
      return {
        description: '评分草稿已保存，尚未提交',
        label: '草稿',
        tone: 'warning',
      };
    case 'submitted':
      return {
        description: '评分已提交，除非退回不能修改',
        label: '已提交',
        tone: 'success',
      };
    case 'returned':
      return {
        description: '评分已退回，可修改后重新提交',
        label: '已退回',
        tone: 'danger',
      };
  }
}

export function getExpertTaskActionLabel(status: ExpertReviewViewStatus): string {
  switch (status) {
    case 'not_started':
      return '开始评分';
    case 'draft':
      return '继续评分';
    case 'returned':
      return '修改重提';
    case 'submitted':
      return '查看评分';
  }
}

export function isExpertReviewReadonly(status: ExpertReviewViewStatus): boolean {
  return status === 'submitted';
}

export function parseOptionalScore(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

export function validateScoreRange(
  score: number,
  item: ReviewSchemeSnapshotItem,
): string | null {
  if (!Number.isFinite(score)) {
    return '分数必须为数字。';
  }

  if (score < 0) {
    return '分数不能小于 0。';
  }

  if (score > item.maxScore) {
    return `分数不能超过 ${formatScore(item.maxScore)}。`;
  }

  return null;
}

export function isImprovementSuggestionRequired(input: {
  hasMajorIssue: boolean;
  itemSnapshot: ReviewSchemeSnapshotItem;
  score: number | null;
}): boolean {
  if (input.hasMajorIssue) {
    return true;
  }

  if (input.score === null) {
    return false;
  }

  const thresholdRatio =
    input.itemSnapshot.suggestionRequiredThresholdRatio ??
    DEFAULT_SUGGESTION_REQUIRED_THRESHOLD_RATIO;

  return input.score < input.itemSnapshot.maxScore * thresholdRatio;
}

export function getImprovementSuggestionRequiredReason(input: {
  hasMajorIssue: boolean;
  itemSnapshot: ReviewSchemeSnapshotItem;
  score: number | null;
}): string | null {
  if (input.hasMajorIssue) {
    return '已标记重大问题，请填写改进建议。';
  }

  if (input.score === null) {
    return null;
  }

  const thresholdRatio =
    input.itemSnapshot.suggestionRequiredThresholdRatio ??
    DEFAULT_SUGGESTION_REQUIRED_THRESHOLD_RATIO;

  if (input.score < input.itemSnapshot.maxScore * thresholdRatio) {
    return '该项得分低于阈值，请填写改进建议。';
  }

  return null;
}

export function calculateExpertReviewTotalScore(
  items: Array<Pick<ExpertReviewItem, 'score'>>,
): number {
  return Number(
    items
      .reduce((sum, item) => {
        const score = item.score;

        return sum + (typeof score === 'number' ? score : 0);
      }, 0)
      .toFixed(2),
  );
}

export function formatScore(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function createEmptyExpertLookupMaps(): ExpertLookupMaps {
  return {
    batchNameById: new Map<string, string>(),
    dictionaryNameById: new Map<string, string>(),
    materialTypeNameById: new Map<string, string>(),
    organizationNameById: new Map<string, string>(),
    reviewSchemeNameById: new Map<string, string>(),
    treeNameById: new Map<string, string>(),
    userNameById: new Map<string, string>(),
  };
}

export function buildExpertLookupMaps(
  referenceData: ExpertReferenceData,
): ExpertLookupMaps {
  return {
    batchNameById: new Map(
      referenceData.batches.map((item) => [item.id, item.name]),
    ),
    dictionaryNameById: new Map(
      referenceData.dictionaries.map((item) => [item.id, item.name]),
    ),
    materialTypeNameById: new Map(
      referenceData.materialTypes.map((item) => [item.id, item.name]),
    ),
    organizationNameById: new Map(
      referenceData.organizations.map((item) => [item.id, item.name]),
    ),
    reviewSchemeNameById: new Map(
      referenceData.reviewSchemes.map((item) => [item.id, item.name]),
    ),
    treeNameById: new Map(
      referenceData.treeDictionaries.map((item) => [item.id, item.name]),
    ),
    userNameById: new Map(
      referenceData.reviewManagers.map((item) => [item.id, item.name]),
    ),
  };
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

export function formatReviewManagerName(
  project: Pick<
    ExpertReviewProjectSummary,
    'reviewManager' | 'reviewManagerId'
  >,
  userNameById: Map<string, string>,
): string {
  const inlineName = project.reviewManager?.name.trim();

  if (inlineName) {
    const phone = project.reviewManager?.phone?.trim();

    return phone ? `${inlineName}（${phone}）` : inlineName;
  }

  if (!project.reviewManagerId) {
    return '未指定评审负责人';
  }

  return (
    userNameById.get(project.reviewManagerId) ??
    `未知评审负责人（${shortId(project.reviewManagerId)}）`
  );
}

export function formatExpertErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 403) {
      return '当前账号无权访问该评审任务。';
    }

    if (error.status === 409) {
      return '评分已提交，不能修改。';
    }

    if (error.status === 400) {
      return getErrorMessage(error);
    }
  }

  return getErrorMessage(error);
}

import {
  CLIENT_DASHBOARD_PROGRESS_STAGE_LABELS,
  EFFECTIVE_FINAL_LEVEL_SOURCE_LABELS,
} from './constants';
import type {
  ClientDashboardProgressStage,
  ClientLookupMaps,
  ClientReferenceData,
  EffectiveFinalLevelSource,
  PortalDictionarySummary,
  PortalTreeDictionarySummary,
} from './types';

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatMoneyWan(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return `${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)} 万元`;
}

export function formatNumber(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return `${new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value * 100)}%`;
}

export function shortId(id?: string | null): string {
  const trimmed = id?.trim() ?? '';

  if (!trimmed) {
    return '-';
  }

  if (trimmed.length <= 8) {
    return trimmed;
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function safeText(value?: string | null): string {
  const trimmed = value?.trim() ?? '';
  return trimmed || '-';
}

export function createEmptyClientLookupMaps(): ClientLookupMaps {
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

export function buildNameMaps(referenceData: ClientReferenceData): ClientLookupMaps {
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
    reviewLevelLabelByValue: buildReviewLevelLabelMap(
      referenceData.reviewLevels,
    ),
    reviewSchemeNameById: new Map(
      referenceData.reviewSchemes.map((item) => [item.id, item.name]),
    ),
    treeNameById: new Map(
      referenceData.treeDictionaries.map((item) => [
        item.id,
        item.fullName?.trim() || item.name,
      ]),
    ),
    userNameById: new Map(
      [...referenceData.reviewManagers, ...referenceData.projectOwners].map(
        (item) => [item.id, formatUserName(item)],
      ),
    ),
  };
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

export function formatBatchName(
  id: string | null | undefined,
  nameById: Map<string, string>,
): string {
  return formatLookupName(id, nameById, '未知批次');
}

export function formatUserLookupName(
  id: string | null | undefined,
  nameById: Map<string, string>,
): string {
  if (!id) {
    return '-';
  }

  return nameById.get(id) ?? '人员信息暂不可用';
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

export function formatReviewLevel(
  value: string | null | undefined,
  reviewLevelLabelByValue: Map<string, string>,
): string {
  const normalized = value?.trim() ?? '';

  if (!normalized) {
    return '未定级';
  }

  return reviewLevelLabelByValue.get(normalized) ?? normalized;
}

export function formatProgressStage(
  stage: ClientDashboardProgressStage,
): string {
  return CLIENT_DASHBOARD_PROGRESS_STAGE_LABELS[stage];
}

export function formatProgressStages(
  stages: ClientDashboardProgressStage[],
): string {
  if (stages.length === 0) {
    return '-';
  }

  return stages.map((stage) => formatProgressStage(stage)).join('、');
}

export function formatEffectiveFinalLevelSource(
  source: EffectiveFinalLevelSource | null | undefined,
): string {
  return EFFECTIVE_FINAL_LEVEL_SOURCE_LABELS[source ?? 'null'];
}

export function getTreeOptions(
  referenceData: ClientReferenceData | null,
  treeType: string,
): PortalTreeDictionarySummary[] {
  return (
    referenceData?.treeDictionaries.filter(
      (item) => item.treeType === treeType && item.isActive,
    ) ?? []
  );
}

export function formatConsensusStatus(status: string | null | undefined): string {
  switch (status) {
    case 'draft':
      return '合议草稿';
    case 'confirmed':
      return '合议已确认';
    case 'reopened':
      return '已重新打开';
    default:
      return '暂无合议';
  }
}

export function formatAppealStatus(status: string | null | undefined): string {
  switch (status) {
    case 'submitted':
      return '已提交';
    case 'processing':
      return '处理中';
    case 'accepted':
      return '已通过';
    case 'rejected':
      return '已驳回';
    case 'canceled':
      return '已取消';
    default:
      return '-';
  }
}

function buildReviewLevelLabelMap(
  reviewLevels: PortalDictionarySummary[],
): Map<string, string> {
  return new Map(
    reviewLevels.flatMap((item) => [
      [item.code, item.name],
      [item.name, item.name],
    ]),
  );
}

function formatUserName(user: { name: string; phone?: string | null }): string {
  const name = user.name.trim();
  const phone = user.phone?.trim();

  return phone ? `${name}（${phone}）` : name;
}

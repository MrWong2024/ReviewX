import type {
  MaterialStatusView,
  MaterialTypeSummary,
  ProjectMaterial,
  ProjectMaterialStatus,
  ProjectOwnerLookupMaps,
  ProjectOwnerReferenceData,
} from './types';

export const MAX_PROJECT_MATERIAL_FILES = 20;
export const MAX_PROJECT_MATERIAL_FILE_SIZE_BYTES = 500 * 1024 * 1024;
export const FOLLOW_UP_NEEDS_MAX_LENGTH = 5000;
export const MATERIAL_REMARK_MAX_LENGTH = 1000;

export const ALLOWED_PROJECT_MATERIAL_EXTENSIONS = [
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
  'zip',
  'rar',
  '7z',
  'txt',
  'csv',
] as const;

export const BLOCKED_PROJECT_MATERIAL_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'sh',
  'js',
  'mjs',
  'cjs',
  'php',
  'jsp',
  'asp',
  'aspx',
  'dll',
  'so',
  'ps1',
] as const;

const allowedExtensions = new Set<string>(ALLOWED_PROJECT_MATERIAL_EXTENSIONS);
const blockedExtensions = new Set<string>(BLOCKED_PROJECT_MATERIAL_EXTENSIONS);

export function getFileExtension(filename: string): string {
  const segments = filename.trim().split('.');

  if (segments.length < 2) {
    return '';
  }

  return segments[segments.length - 1]?.toLowerCase() ?? '';
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

export function validateProjectMaterialFiles(files: File[]): string | null {
  if (files.length === 0) {
    return '请选择需要上传的材料文件。';
  }

  if (files.length > MAX_PROJECT_MATERIAL_FILES) {
    return `一次最多上传 ${MAX_PROJECT_MATERIAL_FILES} 个文件。`;
  }

  const invalidFile = files.find((file) => {
    const extension = getFileExtension(file.name);

    return (
      !extension ||
      blockedExtensions.has(extension) ||
      !allowedExtensions.has(extension) ||
      file.size > MAX_PROJECT_MATERIAL_FILE_SIZE_BYTES
    );
  });

  if (!invalidFile) {
    return null;
  }

  if (invalidFile.size > MAX_PROJECT_MATERIAL_FILE_SIZE_BYTES) {
    return `文件 ${invalidFile.name} 超过 500MB。`;
  }

  const extension = getFileExtension(invalidFile.name);

  if (!extension) {
    return `文件 ${invalidFile.name} 缺少扩展名。`;
  }

  if (blockedExtensions.has(extension)) {
    return `文件 ${invalidFile.name} 的扩展名 ${extension} 不允许上传。`;
  }

  return `文件 ${invalidFile.name} 的扩展名 ${extension} 不在允许范围内。`;
}

export function formatMoney(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

export function collectMaterialTypesFromMaterials(
  materials: ProjectMaterial[],
): MaterialTypeSummary[] {
  const byId = new Map<string, MaterialTypeSummary>();

  materials.forEach((material) => {
    if (material.materialType) {
      byId.set(material.materialType.id, material.materialType);
    }
  });

  return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isDraftLikeMaterial(material: ProjectMaterial): boolean {
  return material.status === 'draft' || material.status === 'active';
}

export function isSubmittedMaterial(material: ProjectMaterial): boolean {
  return material.status === 'submitted';
}

export function canProjectOwnerDeleteMaterial(
  material: ProjectMaterial,
): boolean {
  return isDraftLikeMaterial(material);
}

export function canSubmitMaterial(material: ProjectMaterial): boolean {
  return isDraftLikeMaterial(material);
}

export function getMaterialStatusView(
  status: ProjectMaterialStatus | string,
): MaterialStatusView {
  switch (status) {
    case 'draft':
      return {
        description: '尚未提交评审，评审负责人和专家不可见，可删除',
        label: '草稿',
        tone: 'warning',
      };
    case 'submitted':
      return {
        description: '评审负责人和专家可见，项目负责人不可删除',
        label: '已提交评审',
        tone: 'success',
      };
    case 'active':
      return {
        description: '历史数据兼容状态，按草稿处理，可提交或删除',
        label: '历史草稿',
        tone: 'primary',
      };
    case 'deleted':
      return {
        description: '历史删除状态，不应出现在当前列表',
        label: '已删除',
        tone: 'muted',
      };
    default:
      return {
        description: '无法识别该材料状态，请联系管理员',
        label: '未知状态',
        tone: 'danger',
      };
  }
}

export function getMaterialStatusLabel(
  status: ProjectMaterialStatus | string,
): string {
  return getMaterialStatusView(status).label;
}

export function getMaterialStatusDescription(
  status: ProjectMaterialStatus | string,
): string {
  return getMaterialStatusView(status).description;
}

export function getMaterialDeleteDisabledReason(
  material: ProjectMaterial,
): string | null {
  if (canProjectOwnerDeleteMaterial(material)) {
    return null;
  }

  if (isSubmittedMaterial(material)) {
    return '已提交评审，不能删除';
  }

  if (material.status === 'deleted') {
    return '该材料已删除，不能操作';
  }

  return '未知状态，不能删除';
}

export function formatSubmitSkippedReason(reason: string): string {
  switch (reason) {
    case 'not_found':
      return '材料不存在';
    case 'not_in_project':
      return '材料不属于当前项目';
    case 'already_submitted':
      return '材料已提交';
    case 'not_submittable':
      return '材料不可提交';
    case 'unknown':
      return '未知原因';
    default:
      return reason || '未知原因';
  }
}

export function createEmptyProjectOwnerLookupMaps(): ProjectOwnerLookupMaps {
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

export function buildProjectOwnerLookupMaps(
  referenceData: ProjectOwnerReferenceData,
): ProjectOwnerLookupMaps {
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

export function formatOptionalName(
  id: string | null | undefined,
  nameById: Map<string, string>,
  unknownLabel = '未知项',
): string {
  return formatLookupName(id, nameById, unknownLabel);
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

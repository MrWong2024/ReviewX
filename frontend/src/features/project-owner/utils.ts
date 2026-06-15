import type { MaterialTypeSummary, ProjectMaterial } from './types';

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

export function formatOptionalName(
  id: string | null | undefined,
  nameById: Map<string, string>,
): string {
  if (!id) {
    return '-';
  }

  return nameById.get(id) ?? id;
}

export function formatNames(
  ids: string[],
  nameById: Map<string, string>,
): string {
  if (ids.length === 0) {
    return '-';
  }

  return ids.map((id) => nameById.get(id) ?? id).join('、');
}

import type { ProjectImportStandardField } from '@/src/features/admin/types';

export type FieldMappingBadgeTone =
  | 'danger'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning';

const STANDARD_FIELD_FALLBACK_LABELS: Record<ProjectImportStandardField, string> = {
  allocatedFunding: '已拨款',
  cooperationOrganizationNames: '合作单位',
  departmentName: '受理处室',
  disciplineName: '学科',
  leadOrganizationName: '承担单位',
  name: '项目名称',
  organizationContactName: '单位联系人',
  organizationContactPhone: '单位联系人电话',
  ownerName: '项目负责人',
  ownerPhone: '负责人手机号',
  projectNo: '项目编号',
  projectTypeName: '项目类型',
  statusName: '项目状态',
  totalFunding: '拨款总额',
};

export function getProjectImportStandardFieldFallbackLabel(
  standardField: ProjectImportStandardField,
): string {
  return STANDARD_FIELD_FALLBACK_LABELS[standardField];
}

export function getFieldRequiredLabel(required: boolean): string {
  return required ? '必填' : '选填';
}

export function getFieldRequiredTone(required: boolean): FieldMappingBadgeTone {
  return required ? 'warning' : 'muted';
}

export function getFieldConfiguredLabel(isConfigured: boolean): string {
  return isConfigured ? '已配置' : '使用默认';
}

export function getFieldConfiguredTone(
  isConfigured: boolean,
): FieldMappingBadgeTone {
  return isConfigured ? 'primary' : 'muted';
}

export function getFieldActiveLabel(
  isConfigured: boolean,
  isActive: boolean,
): string {
  if (!isConfigured) {
    return '默认';
  }

  return isActive ? '启用' : '停用';
}

export function getFieldActiveTone(
  isConfigured: boolean,
  isActive: boolean,
): FieldMappingBadgeTone {
  if (!isConfigured) {
    return 'muted';
  }

  return isActive ? 'success' : 'warning';
}

export function getFieldFallbackHint(
  isConfigured: boolean,
  isActive: boolean,
): string {
  if (!isConfigured) {
    return '未配置，当前使用默认别名';
  }

  if (!isActive) {
    return '已停用，当前生效为默认别名';
  }

  return '启用后优先使用自定义别名';
}

export function formatAliasList(aliases: string[], emptyText = '-'): string {
  if (aliases.length === 0) {
    return emptyText;
  }

  return aliases.join('、');
}

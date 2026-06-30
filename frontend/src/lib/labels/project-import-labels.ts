export type ProjectImportBadgeTone =
  | 'danger'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning';

const JOB_STATUS_LABELS: Record<string, string> = {
  canceled: '已取消',
  completed: '已完成',
  failed: '失败',
  parsing: '解析中',
  pending_confirmation: '待处理',
};

const JOB_STATUS_TONES: Record<string, ProjectImportBadgeTone> = {
  canceled: 'muted',
  completed: 'success',
  failed: 'danger',
  parsing: 'primary',
  pending_confirmation: 'warning',
};

const ROW_STATUS_LABELS: Record<string, string> = {
  confirmed: '已确认',
  failed: '失败',
  importable: '可导入',
  pending_confirmation: '待确认',
  skipped: '已跳过',
};

const ROW_STATUS_TONES: Record<string, ProjectImportBadgeTone> = {
  confirmed: 'success',
  failed: 'danger',
  importable: 'primary',
  pending_confirmation: 'warning',
  skipped: 'muted',
};

const ISSUE_CODE_LABELS: Record<string, string> = {
  cooperation_organization_ambiguous: '合作单位存在多个候选，请选择正确单位。',
  cooperation_organization_not_found:
    '未能自动匹配合作单位。请先在当前弹窗选择正确合作单位；如果系统中确实没有该单位，再到单位管理中维护。',
  department_ambiguous: '受理处室存在多个候选，请选择正确处室。',
  department_not_found:
    '未能自动匹配受理处室。通常是 Excel 中的处室写法不规范，请先在当前弹窗选择正确受理处室；如果系统中确实没有该处室，再到树形字典维护。',
  discipline_ambiguous: '学科存在多个候选，请选择正确学科。',
  discipline_not_found:
    '未能自动匹配学科。通常是 Excel 中的学科写法不规范，请先在当前弹窗选择正确学科；如果系统中确实没有该学科，再到树形字典维护。',
  duplicate_project_no_in_file: '项目编号在本次导入中重复，请修正后再确认。',
  existing_project_matched: '已匹配到同批次已有项目，确认后将更新已有项目。',
  funding_inconsistent: '已拨款金额不能大于拨款总额。',
  invalid_number: '金额字段格式不正确，请填写非负数字。',
  lead_organization_ambiguous: '承担单位存在多个候选，请选择正确单位。',
  lead_organization_duplicated_in_cooperation:
    '承担单位同时出现在合作单位中，确认时会跳过重复合作单位。',
  lead_organization_not_found:
    '未能自动匹配承担单位。请先在当前弹窗选择正确承担单位；如果系统中确实没有该单位，再到单位管理中维护。',
  owner_ambiguous: '项目负责人存在多个候选，请选择正确负责人。',
  owner_not_found:
    '未能自动匹配项目负责人。请先在当前弹窗选择正确项目负责人；如果系统中确实没有该人员，再到用户管理中维护。',
  project_type_ambiguous: '项目类型存在多个候选，请选择正确类型。',
  project_type_not_found:
    '未能自动匹配项目类型。通常是 Excel 中的项目类型写法不规范，请先在当前弹窗选择正确项目类型；如果系统中确实没有该类型，再到树形字典维护。',
  required_field_missing: '必填字段缺失，请补充后再确认。',
  status_ambiguous: '项目状态存在多个候选，请选择正确状态。',
  status_not_found:
    '未能自动匹配项目状态。通常是 Excel 中的状态写法不规范，请先在当前弹窗选择正确状态；如果系统中确实没有该状态，再到普通字典维护。',
  unknown_error: '导入行处理异常，请检查数据后重试。',
};

const FIELD_LABELS: Record<string, string> = {
  allocatedFunding: '已拨款',
  cooperationOrganizationIds: '合作单位',
  cooperationOrganizationNames: '合作单位',
  departmentId: '受理处室',
  departmentName: '受理处室',
  disciplineIds: '学科',
  disciplineName: '学科',
  disciplineNames: '学科',
  leadOrganizationId: '承担单位',
  leadOrganizationName: '承担单位',
  name: '项目名称',
  organizationContactName: '单位联系人',
  organizationContactPhone: '单位联系人电话',
  ownerName: '项目负责人',
  ownerPhone: '负责人手机号',
  ownerUserId: '项目负责人',
  projectId: '已有项目',
  projectNo: '项目编号',
  projectTypeId: '项目类型',
  projectTypeName: '项目类型',
  row: '导入行',
  statusId: '项目状态',
  statusName: '项目状态',
  totalFunding: '拨款总额',
};

export function getProjectImportJobStatusLabel(status: string): string {
  return JOB_STATUS_LABELS[status] ?? status;
}

export function getProjectImportJobStatusTone(
  status: string,
): ProjectImportBadgeTone {
  return JOB_STATUS_TONES[status] ?? 'muted';
}

export function getProjectImportRowStatusLabel(status: string): string {
  return ROW_STATUS_LABELS[status] ?? status;
}

export function getProjectImportRowStatusTone(
  status: string,
): ProjectImportBadgeTone {
  return ROW_STATUS_TONES[status] ?? 'muted';
}

export function getProjectImportIssueLabel(code: string): string {
  return ISSUE_CODE_LABELS[code] ?? '导入行存在待处理问题，请检查后重试。';
}

export function getProjectImportIssueTone(code: string): ProjectImportBadgeTone {
  if (
    code === 'existing_project_matched' ||
    code === 'lead_organization_duplicated_in_cooperation'
  ) {
    return 'warning';
  }

  return 'danger';
}

export function getProjectImportFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export const PROJECT_IMPORT_JOB_STATUS_OPTIONS = [
  { label: '解析中', value: 'parsing' },
  { label: '待处理', value: 'pending_confirmation' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'canceled' },
] as const;

export const PROJECT_IMPORT_ROW_STATUS_OPTIONS = [
  { label: '可导入', value: 'importable' },
  { label: '待确认', value: 'pending_confirmation' },
  { label: '已确认', value: 'confirmed' },
  { label: '已跳过', value: 'skipped' },
  { label: '失败', value: 'failed' },
] as const;

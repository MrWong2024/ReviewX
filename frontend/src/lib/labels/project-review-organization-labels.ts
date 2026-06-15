import type { Project } from '@/src/features/admin/types/project-review-organization';

export type OrganizationStatusTone = 'success' | 'warning' | 'muted';

export type OrganizationStatus = {
  label: string;
  tone: OrganizationStatusTone;
};

export function getProjectOrganizationStatus(
  project: Pick<
    Project,
    'reviewLocation' | 'reviewManagerId' | 'reviewSchemeId' | 'reviewTime'
  >,
): OrganizationStatus {
  if (!project.reviewManagerId) {
    return { label: '未分配负责人', tone: 'warning' };
  }

  if (!project.reviewSchemeId) {
    return { label: '未分配方案', tone: 'warning' };
  }

  if (!project.reviewTime) {
    return { label: '待安排评审', tone: 'muted' };
  }

  return { label: '已安排评审', tone: 'success' };
}

const EXPERT_FAILURE_REASON_LABELS: Record<string, string> = {
  cooperation_organization_conflict: '专家所属单位与项目合作单位冲突',
  discipline_mismatch: '专家学科与项目学科不匹配',
  duplicate_expert: '专家已分配',
  expert_discipline_missing: '专家尚未维护学科',
  expert_inactive: '专家未启用',
  expert_not_found: '专家不存在',
  expert_role_missing: '用户不具备专家角色',
  invalid_object_id: '提交的专家或项目标识不合法',
  lead_organization_conflict: '专家所属单位与项目承担单位冲突',
  project_discipline_missing: '项目尚未维护学科',
  project_inactive: '项目未启用',
  project_not_found: '项目不存在',
};

export function getExpertFailureReasonLabel(reason: string): string {
  return EXPERT_FAILURE_REASON_LABELS[reason] ?? reason;
}

export function formatExpertFailureReasons(reasons: string[]): string {
  if (reasons.length === 0) {
    return '不符合分配规则';
  }

  return reasons.map(getExpertFailureReasonLabel).join('；');
}

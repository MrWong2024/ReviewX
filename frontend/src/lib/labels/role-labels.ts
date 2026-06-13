import type { UserRole } from '@/src/features/admin/types/users';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理员',
  client: '甲方',
  expert: '评审专家',
  project_owner: '项目负责人',
  review_manager: '评审负责人',
};

export const ROLE_OPTIONS: Array<{ label: string; value: UserRole }> = [
  { label: ROLE_LABELS.admin, value: 'admin' },
  { label: ROLE_LABELS.client, value: 'client' },
  { label: ROLE_LABELS.review_manager, value: 'review_manager' },
  { label: ROLE_LABELS.expert, value: 'expert' },
  { label: ROLE_LABELS.project_owner, value: 'project_owner' },
];

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function formatRoles(roles: UserRole[]): string {
  return roles.map((role) => roleLabel(role)).join('、');
}

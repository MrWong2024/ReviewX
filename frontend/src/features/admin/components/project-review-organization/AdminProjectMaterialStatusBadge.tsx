import { Badge } from '@/src/components/feedback/Badge';
import type { AdminProjectMaterialStatus } from '../../types/project-review-organization';

type AdminProjectMaterialStatusBadgeProps = {
  status: AdminProjectMaterialStatus | string;
};

type AdminMaterialStatusView = {
  description: string;
  label: string;
  tone: 'danger' | 'muted' | 'primary' | 'success' | 'warning';
};

export function AdminProjectMaterialStatusBadge({
  status,
}: AdminProjectMaterialStatusBadgeProps) {
  const view = getAdminMaterialStatusView(status);

  return (
    <span title={view.description}>
      <Badge tone={view.tone}>{view.label}</Badge>
    </span>
  );
}

export function getAdminMaterialStatusView(
  status: AdminProjectMaterialStatus | string,
): AdminMaterialStatusView {
  switch (status) {
    case 'draft':
      return {
        description: '项目负责人尚未提交评审，评审负责人和专家不可见',
        label: '草稿',
        tone: 'warning',
      };
    case 'submitted':
      return {
        description: '评审负责人和专家可见',
        label: '已提交评审',
        tone: 'success',
      };
    case 'active':
      return {
        description: '历史兼容状态，按草稿处理',
        label: '历史草稿',
        tone: 'primary',
      };
    case 'deleted':
      return {
        description: '历史删除状态，通常不应出现在当前列表',
        label: '已删除',
        tone: 'muted',
      };
    default:
      return {
        description: '无法识别该材料状态',
        label: '未知状态',
        tone: 'danger',
      };
  }
}

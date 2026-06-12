export const USER_ROLES = [
  'admin',
  'client',
  'review_manager',
  'expert',
  'project_owner',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type CurrentUser = {
  id: string;
  phone: string;
  name: string;
  roles: UserRole[];
  organizationIds: string[];
  disciplineIds: string[];
  mustChangePassword: boolean;
  isActive: boolean;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
};

export type LoginInput = {
  password: string;
  phone: string;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理员',
  client: '甲方',
  expert: '评审专家',
  project_owner: '项目负责人',
  review_manager: '评审负责人',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: '维护基础数据，查看项目列表。',
  client: '甲方工作台将在后续阶段建设。',
  expert: '专家评分工作台将在后续阶段建设。',
  project_owner: '材料与申诉工作台将在后续阶段建设。',
  review_manager: '评审组织工作台将在后续阶段建设。',
};

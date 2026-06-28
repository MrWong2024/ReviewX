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
  client: '查看项目评审进度、结果分布、申诉状态和评审现场入口。',
  expert: '查看评审任务、项目材料并完成专家评分。',
  project_owner: '查看本人负责项目、评审安排和材料提交情况。',
  review_manager: '查看负责项目、专家评分并确认最终合议。',
};

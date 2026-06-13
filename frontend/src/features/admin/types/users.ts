export const USER_ROLES = [
  'admin',
  'client',
  'review_manager',
  'expert',
  'project_owner',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AdminUser = {
  createdAt: string;
  disciplineIds: string[];
  id: string;
  isActive: boolean;
  mustChangePassword: boolean;
  name: string;
  organizationIds: string[];
  phone: string;
  roles: UserRole[];
  updatedAt: string;
};

export type ListUsersParams = {
  disciplineId?: string;
  isActive?: boolean | '';
  keyword?: string;
  organizationId?: string;
  page?: number;
  pageSize?: number;
  role?: UserRole | '';
};

export type CreateAdminUserInput = {
  disciplineIds?: string[];
  isActive?: boolean;
  mustChangePassword?: boolean;
  name: string;
  organizationIds?: string[];
  password?: string;
  phone: string;
  roles: UserRole[];
};

export type UpdateAdminUserInput = {
  disciplineIds?: string[];
  isActive?: boolean;
  mustChangePassword?: boolean;
  name?: string;
  organizationIds?: string[];
  roles?: UserRole[];
};

export type UpdateAdminUserStatusInput = {
  isActive: boolean;
};

export type ResetAdminUserPasswordInput = {
  mustChangePassword?: boolean;
  password?: string;
};

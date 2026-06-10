export const USER_ROLES = [
  'admin',
  'client',
  'review_manager',
  'expert',
  'project_owner',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const DEFAULT_LOCAL_USER_ROLES: UserRole[] = ['admin'];

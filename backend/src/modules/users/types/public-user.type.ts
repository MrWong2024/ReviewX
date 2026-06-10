import { UserRole } from './user-role.type';
import { UserStatus } from './user-status.type';

export interface PublicUser {
  id: string;
  phone: string;
  name: string;
  roles: UserRole[];
  organizationIds: string[];
  disciplineIds: string[];
  mustChangePassword: boolean;
  isActive: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
}

export interface AuthIdentity {
  id: string;
  phone: string;
  passwordHash: string;
  roles: UserRole[];
  isActive: boolean;
  status: UserStatus;
}

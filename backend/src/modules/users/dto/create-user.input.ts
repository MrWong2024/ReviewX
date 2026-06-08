import { UserRole } from '../types/user-role.type';
import { UserStatus } from '../types/user-status.type';

export interface CreateUserInput {
  phone: string;
  passwordHash: string;
  name: string;
  roles?: UserRole[];
  status?: UserStatus;
}

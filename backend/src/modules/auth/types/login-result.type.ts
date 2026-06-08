import { PublicUser } from '../../users/types/public-user.type';

export interface LoginInput {
  phone: string;
  password: string;
  userAgent?: string;
  ip?: string;
}

export interface LoginResult {
  user: PublicUser;
  sessionToken: string;
  expiresAt: Date;
}

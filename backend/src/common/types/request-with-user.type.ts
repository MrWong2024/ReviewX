import { Request } from 'express';
import { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';

export interface RequestWithUser extends Request {
  cookies: Record<string, string | undefined>;
  user?: AuthenticatedUser;
}

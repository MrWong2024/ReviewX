import { PublicSession } from '../../sessions/types/public-session.type';
import { PublicUser } from '../../users/types/public-user.type';

export interface AuthenticatedUser {
  user: PublicUser;
  session: PublicSession;
}

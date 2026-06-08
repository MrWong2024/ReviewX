import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestWithUser } from '../../../common/types/request-with-user.type';
import { AuthService } from '../auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const cookieName =
      this.configService.getOrThrow<string>('session.cookieName');
    const token = request.cookies?.[cookieName];

    if (!token) {
      throw new UnauthorizedException();
    }

    request.user = await this.authService.getCurrentUserFromToken(token);
    return true;
  }
}

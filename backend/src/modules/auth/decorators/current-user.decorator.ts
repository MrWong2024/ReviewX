import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../../../common/types/request-with-user.type';
import { AuthenticatedUser } from '../types/authenticated-user.type';

export const CurrentUser = createParamDecorator(
  (
    _data: unknown,
    context: ExecutionContext,
  ): AuthenticatedUser | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);

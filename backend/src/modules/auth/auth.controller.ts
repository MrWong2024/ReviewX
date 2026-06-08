import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { RequestWithUser } from '../../common/types/request-with-user.type';
import type { PublicUser } from '../users/types/public-user.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import type { AuthenticatedUser } from './types/authenticated-user.type';

type LogoutResponse = {
  success: true;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicUser> {
    const result = await this.authService.login({
      phone: dto.phone,
      password: dto.password,
      userAgent: request.get('user-agent'),
      ip: request.ip,
    });

    response.cookie(
      this.getSessionCookieName(),
      result.sessionToken,
      this.getSessionCookieOptions(),
    );

    return result.user;
  }

  @Post('logout')
  async logout(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    const cookieName = this.getSessionCookieName();

    await this.authService.logout(request.cookies?.[cookieName]);
    response.clearCookie(cookieName, this.getClearSessionCookieOptions());

    return { success: true };
  }

  @UseGuards(SessionAuthGuard)
  @Get('me')
  me(@CurrentUser() currentUser: AuthenticatedUser | undefined): PublicUser {
    if (!currentUser) {
      throw new UnauthorizedException();
    }

    return currentUser.user;
  }

  private getSessionCookieName(): string {
    return this.configService.getOrThrow<string>('session.cookieName');
  }

  private getSessionCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      maxAge: this.configService.getOrThrow<number>('session.ttlMs'),
      path: '/',
      sameSite: this.configService.getOrThrow<'lax' | 'strict' | 'none'>(
        'session.cookieSameSite',
      ),
      secure: this.configService.getOrThrow<boolean>('session.cookieSecure'),
    };
  }

  private getClearSessionCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      path: '/',
      sameSite: this.configService.getOrThrow<'lax' | 'strict' | 'none'>(
        'session.cookieSameSite',
      ),
      secure: this.configService.getOrThrow<boolean>('session.cookieSecure'),
    };
  }
}

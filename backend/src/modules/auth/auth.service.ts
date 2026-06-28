import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { PublicUser } from '../users/types/public-user.type';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { LoginInput, LoginResult } from './types/login-result.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly configService: ConfigService,
  ) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const identity = await this.usersService.findAuthIdentityByPhone(
      input.phone,
    );

    if (
      !identity ||
      identity.status !== 'active' ||
      identity.isActive === false
    ) {
      throw new UnauthorizedException();
    }

    const isPasswordValid = await compare(
      input.password,
      identity.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException();
    }

    const session = await this.sessionsService.createSession({
      userId: identity.id,
      ttlMs: this.configService.getOrThrow<number>('session.ttlMs'),
      userAgent: input.userAgent,
      ip: input.ip,
    });

    await this.sessionsService.pruneOldSessionsForUser(
      identity.id,
      this.configService.getOrThrow<number>('session.maxActiveSessionsPerUser'),
    );

    const user =
      (await this.usersService.updateLastLoginAt(identity.id)) ??
      (await this.usersService.findById(identity.id));

    if (!user || user.status !== 'active' || user.isActive === false) {
      await this.sessionsService.revokeByToken(session.token);
      throw new UnauthorizedException();
    }

    return {
      user,
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    };
  }

  async getCurrentUserFromToken(token: string): Promise<AuthenticatedUser> {
    const session = await this.sessionsService.touchSession(token);

    if (!session) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(session.userId);

    if (!user || user.status !== 'active' || user.isActive === false) {
      throw new UnauthorizedException();
    }

    return {
      user,
      session,
    };
  }

  async changeOwnPassword(
    userId: string,
    dto: ChangeOwnPasswordDto,
  ): Promise<PublicUser> {
    return this.usersService.changeOwnPassword({
      userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      confirmPassword: dto.confirmPassword,
    });
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.sessionsService.revokeByToken(token);
  }
}

import {
  BadRequestException,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AuthIdentity, PublicUser } from '../users/types/public-user.type';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';
import {
  AliyunSmsAuthService,
  SmsAuthConfigurationError,
  SmsAuthProviderError,
} from './services/aliyun-sms-auth.service';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { LoginInput, LoginResult } from './types/login-result.type';
import {
  SmsLoginCodeResponse,
  SmsLoginInput,
  PasswordResetCodeResponse,
  PasswordResetResponse,
  ResetPasswordWithSmsInput,
} from './types/sms-auth.types';

type LoginSessionContext = {
  userAgent?: string;
  ip?: string;
};

const SMS_CODE_RESPONSE_MESSAGE =
  '如果手机号已在系统中登记，将收到验证码。';
const PASSWORD_RESET_SUCCESS_MESSAGE = '密码已重置，请使用新密码登录。';
const SMS_VERIFY_FAILED_MESSAGE = '验证码错误或已过期';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly configService: ConfigService,
    @Optional()
    private readonly smsAuthService?: AliyunSmsAuthService,
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

    return this.createLoginSessionForIdentity(identity, input);
  }

  async sendSmsLoginCode(phone: string): Promise<SmsLoginCodeResponse> {
    const smsAuthService = this.getSmsAuthService();
    const response = this.buildSmsCodeResponse();
    const identity = await this.usersService.findAuthIdentityByPhone(phone);

    if (!this.isActiveIdentity(identity)) {
      return response;
    }

    if (!smsAuthService.normalizePhoneForAliyun(phone)) {
      return response;
    }

    try {
      await smsAuthService.sendSmsVerifyCode(phone);
    } catch (error) {
      this.throwSmsServiceException(error, '验证码发送失败，请稍后再试');
    }

    return response;
  }

  async sendPasswordResetCode(
    phone: string,
  ): Promise<PasswordResetCodeResponse> {
    const smsAuthService = this.getSmsAuthService();
    const response = this.buildSmsCodeResponse();
    const identity = await this.usersService.findAuthIdentityByPhone(phone);

    if (!this.isActiveIdentity(identity)) {
      return response;
    }

    if (!smsAuthService.normalizePhoneForAliyun(phone)) {
      return response;
    }

    try {
      await smsAuthService.sendSmsVerifyCode(phone);
    } catch (error) {
      this.throwSmsServiceException(error, '验证码发送失败，请稍后再试');
    }

    return response;
  }

  async loginWithSmsCode(input: SmsLoginInput): Promise<LoginResult> {
    const smsAuthService = this.getSmsAuthService();

    if (!smsAuthService.normalizePhoneForAliyun(input.phone)) {
      throw new BadRequestException('手机号格式不正确');
    }

    const identity = await this.usersService.findAuthIdentityByPhone(
      input.phone,
    );

    if (!this.isActiveIdentity(identity)) {
      throw new UnauthorizedException();
    }

    let verified = false;

    try {
      const result = await smsAuthService.checkSmsVerifyCode(
        input.phone,
        input.verifyCode,
      );
      verified = result.verified;
    } catch (error) {
      this.throwSmsServiceException(error, '验证码校验失败，请稍后再试');
    }

    if (!verified) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    return this.createLoginSessionForIdentity(identity, input);
  }

  async resetPasswordWithSms(
    input: ResetPasswordWithSmsInput,
  ): Promise<PasswordResetResponse> {
    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException('两次输入的新密码不一致');
    }

    const smsAuthService = this.getSmsAuthService();

    if (!smsAuthService.normalizePhoneForAliyun(input.phone)) {
      throw new BadRequestException('手机号格式不正确');
    }

    const identity = await this.usersService.findAuthIdentityByPhone(
      input.phone,
    );

    if (!this.isActiveIdentity(identity)) {
      throw new UnauthorizedException(SMS_VERIFY_FAILED_MESSAGE);
    }

    let verified = false;

    try {
      const result = await smsAuthService.checkSmsVerifyCode(
        input.phone,
        input.verifyCode,
      );
      verified = result.verified;
    } catch (error) {
      this.throwSmsServiceException(error, '验证码校验失败，请稍后再试');
    }

    if (!verified) {
      throw new UnauthorizedException(SMS_VERIFY_FAILED_MESSAGE);
    }

    await this.usersService.resetPasswordAfterVerifiedSms({
      userId: identity.id,
      newPassword: input.newPassword,
      confirmPassword: input.confirmPassword,
    });
    await this.sessionsService.revokeSessionsForUser(identity.id);

    return {
      success: true,
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
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

  private async createLoginSessionForIdentity(
    identity: AuthIdentity,
    input: LoginSessionContext,
  ): Promise<LoginResult> {
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

  private buildSmsCodeResponse(): SmsLoginCodeResponse {
    const smsAuthService = this.getSmsAuthService();

    return {
      success: true,
      message: SMS_CODE_RESPONSE_MESSAGE,
      cooldownSeconds: smsAuthService.getCooldownSeconds(),
      expiresInSeconds: smsAuthService.getExpiresInSeconds(),
    };
  }

  private getSmsAuthService(): AliyunSmsAuthService {
    if (!this.smsAuthService) {
      throw new ServiceUnavailableException('短信验证码服务未配置');
    }

    return this.smsAuthService;
  }

  private isActiveIdentity(
    identity: AuthIdentity | null,
  ): identity is AuthIdentity {
    return (
      !!identity &&
      identity.status === 'active' &&
      identity.isActive !== false
    );
  }

  private throwSmsServiceException(error: unknown, message: string): never {
    if (error instanceof SmsAuthConfigurationError) {
      throw new ServiceUnavailableException('短信验证码服务未配置');
    }

    if (error instanceof SmsAuthProviderError) {
      throw new ServiceUnavailableException(message);
    }

    throw error;
  }
}

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { SessionsService } from '../sessions/sessions.service';
import { PublicSession } from '../sessions/types/public-session.type';
import { UsersService } from '../users/users.service';
import { AuthIdentity, PublicUser } from '../users/types/public-user.type';
import { AuthService } from './auth.service';

type UsersServiceMock = {
  findAuthIdentityByPhone: jest.MockedFunction<
    UsersService['findAuthIdentityByPhone']
  >;
  findById: jest.MockedFunction<UsersService['findById']>;
  updateLastLoginAt: jest.MockedFunction<UsersService['updateLastLoginAt']>;
};

type SessionsServiceMock = {
  createSession: jest.MockedFunction<SessionsService['createSession']>;
  pruneOldSessionsForUser: jest.MockedFunction<
    SessionsService['pruneOldSessionsForUser']
  >;
  revokeByToken: jest.MockedFunction<SessionsService['revokeByToken']>;
  touchSession: jest.MockedFunction<SessionsService['touchSession']>;
};

type ConfigServiceMock = {
  getOrThrow: jest.MockedFunction<<T>(key: string) => T>;
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersServiceMock;
  let sessionsService: SessionsServiceMock;
  let configService: ConfigServiceMock;
  let passwordHash: string;

  beforeEach(async () => {
    passwordHash = await hash('correct-password', 4);
    usersService = {
      findAuthIdentityByPhone: jest.fn(),
      findById: jest.fn(),
      updateLastLoginAt: jest.fn(),
    };
    sessionsService = {
      createSession: jest.fn(),
      pruneOldSessionsForUser: jest.fn(),
      revokeByToken: jest.fn(),
      touchSession: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn(<T>(key: string): T => {
        const values = new Map<string, unknown>([
          ['session.ttlMs', 86_400_000],
          ['session.maxActiveSessionsPerUser', 5],
        ]);

        return values.get(key) as T;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: SessionsService, useValue: sessionsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  it('logs in an active phone user and keeps token internal to the service result', async () => {
    usersService.findAuthIdentityByPhone.mockResolvedValue(authIdentity());
    sessionsService.createSession.mockResolvedValue(createdSession());
    sessionsService.pruneOldSessionsForUser.mockResolvedValue(0);
    usersService.updateLastLoginAt.mockResolvedValue(publicUser());

    const result = await authService.login({
      phone: '+8613800000000',
      password: 'correct-password',
      userAgent: 'Jest',
      ip: '127.0.0.1',
    });

    expect(result.user).toMatchObject({
      id: '64f000000000000000000001',
      phone: '+8613800000000',
      status: 'active',
    });
    expect('passwordHash' in result.user).toBe(false);
    expect(result.sessionToken).toBe('session-token');
    expect(sessionsService.createSession).toHaveBeenCalledWith({
      userId: '64f000000000000000000001',
      ttlMs: 86_400_000,
      userAgent: 'Jest',
      ip: '127.0.0.1',
    });
    expect(sessionsService.pruneOldSessionsForUser).toHaveBeenCalledWith(
      '64f000000000000000000001',
      5,
    );
    expect(usersService.updateLastLoginAt).toHaveBeenCalledWith(
      '64f000000000000000000001',
    );
  });

  it('rejects missing users with a generic unauthorized error', async () => {
    usersService.findAuthIdentityByPhone.mockResolvedValue(null);

    await expect(
      authService.login({
        phone: '+8613800000000',
        password: 'correct-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessionsService.createSession).not.toHaveBeenCalled();
  });

  it('rejects invalid passwords with a generic unauthorized error', async () => {
    usersService.findAuthIdentityByPhone.mockResolvedValue(authIdentity());

    await expect(
      authService.login({
        phone: '+8613800000000',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessionsService.createSession).not.toHaveBeenCalled();
  });

  it('rejects disabled users with a generic unauthorized error', async () => {
    usersService.findAuthIdentityByPhone.mockResolvedValue(
      authIdentity('disabled'),
    );

    await expect(
      authService.login({
        phone: '+8613800000000',
        password: 'correct-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessionsService.createSession).not.toHaveBeenCalled();
  });

  it('gets the current user from a valid session token', async () => {
    sessionsService.touchSession.mockResolvedValue(publicSession());
    usersService.findById.mockResolvedValue(publicUser());

    const result = await authService.getCurrentUserFromToken('session-token');

    expect(result.user.id).toBe('64f000000000000000000001');
    expect(result.session.id).toBe('64f000000000000000000099');
    expect(sessionsService.touchSession).toHaveBeenCalledWith('session-token');
  });

  it('rejects missing or invalid sessions', async () => {
    sessionsService.touchSession.mockResolvedValue(null);

    await expect(
      authService.getCurrentUserFromToken('session-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects disabled users when resolving current user', async () => {
    sessionsService.touchSession.mockResolvedValue(publicSession());
    usersService.findById.mockResolvedValue(publicUser('disabled'));

    await expect(
      authService.getCurrentUserFromToken('session-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs out by revoking the provided session token', async () => {
    sessionsService.revokeByToken.mockResolvedValue(true);

    await authService.logout('session-token');

    expect(sessionsService.revokeByToken).toHaveBeenCalledWith('session-token');
  });

  it('keeps logout idempotent when no token is provided', async () => {
    await authService.logout(undefined);

    expect(sessionsService.revokeByToken).not.toHaveBeenCalled();
  });

  function authIdentity(
    status: AuthIdentity['status'] = 'active',
  ): AuthIdentity {
    return {
      id: '64f000000000000000000001',
      phone: '+8613800000000',
      passwordHash,
      roles: [],
      status,
    };
  }
});

function publicUser(status: PublicUser['status'] = 'active'): PublicUser {
  return {
    id: '64f000000000000000000001',
    phone: '+8613800000000',
    name: 'Test User',
    roles: [],
    status,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastLoginAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function publicSession(): PublicSession {
  return {
    id: '64f000000000000000000099',
    userId: '64f000000000000000000001',
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    revokedAt: null,
    lastSeenAt: new Date('2026-01-01T00:00:00.000Z'),
    userAgent: 'Jest',
    ip: '127.0.0.1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function createdSession() {
  return {
    token: 'session-token',
    session: publicSession(),
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

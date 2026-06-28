import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { compare, hash } from 'bcryptjs';
import { Connection, Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

type SessionTokenLean = {
  _id: Types.ObjectId;
  token: string;
  revokedAt?: Date | null;
};

type StoredPasswordLean = {
  _id: Types.ObjectId;
  passwordHash: string;
  mustChangePassword?: boolean;
};

type CreateTestUserOptions = {
  phone?: string;
  password?: string;
  name?: string;
  status?: 'active' | 'disabled';
  isActive?: boolean;
  mustChangePassword?: boolean;
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    httpServer = app.getHttpServer() as Server;
    connection = app.get<Connection>(getConnectionToken());
    userModel = app.get<Model<User>>(getModelToken(User.name));
    sessionModel = app.get<Model<Session>>(getModelToken(Session.name));
    await userModel.syncIndexes();
    await sessionModel.syncIndexes();
  });

  beforeEach(async () => {
    await sessionModel.deleteMany({}).exec();
    await userModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await sessionModel.deleteMany({}).exec();
    await userModel.deleteMany({}).exec();
    await connection.close();
    await app.close();
  });

  it('logs in, returns current user from HttpOnly Cookie, and logs out', async () => {
    const user = await createUser();

    const loginResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        phone: ' +8613800000000 ',
        password: 'correct-password',
      })
      .expect(200);

    const loginBody = getJsonBody(loginResponse);
    expect(loginBody).toMatchObject({
      id: user._id.toString(),
      phone: '+8613800000000',
      name: 'Test User',
      roles: [],
      status: 'active',
    });
    expect(loginBody.passwordHash).toBeUndefined();
    expect(loginBody.token).toBeUndefined();
    expect(loginBody.sessionToken).toBeUndefined();

    const sessionCookie = getSessionCookie(loginResponse);
    expect(sessionCookie).toContain('reviewx_session=');
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('Path=/');
    expect(sessionCookie).toContain('SameSite=Lax');
    expect(sessionCookie).toContain('Max-Age=86400');
    expect(sessionCookie).not.toContain('Secure');

    const meResponse = await request(httpServer)
      .get('/auth/me')
      .set('Cookie', toRequestCookie(sessionCookie))
      .expect(200);
    const meBody = getJsonBody(meResponse);
    expect(meBody).toMatchObject({
      id: user._id.toString(),
      phone: '+8613800000000',
      name: 'Test User',
    });
    expect(meBody.passwordHash).toBeUndefined();
    expect(meBody.token).toBeUndefined();

    const storedSession = await sessionModel
      .findOne({ userId: user._id })
      .lean<SessionTokenLean | null>()
      .exec();
    expect(storedSession?.token).toBeTruthy();

    const logoutResponse = await request(httpServer)
      .post('/auth/logout')
      .set('Cookie', toRequestCookie(sessionCookie))
      .expect(200);
    expect(getJsonBody(logoutResponse)).toEqual({ success: true });
    expect(getSessionCookie(logoutResponse)).toContain('reviewx_session=');

    const revokedSession = await sessionModel
      .findById(storedSession?._id)
      .lean<SessionTokenLean | null>()
      .exec();
    expect(revokedSession?.revokedAt).toBeTruthy();

    await request(httpServer)
      .get('/auth/me')
      .set('Cookie', toRequestCookie(sessionCookie))
      .expect(401);
  });

  it('rejects unauthenticated me requests', async () => {
    await request(httpServer).get('/auth/me').expect(401);
  });

  it('does not expose X-Powered-By on stable responses', async () => {
    const response = await request(httpServer).get('/health').expect(200);

    expect(getHeaderValue(response, 'x-powered-by')).toBeUndefined();
  });

  it('rejects login for missing users without leaking account existence', async () => {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8613800000000',
        password: 'correct-password',
      })
      .expect(401);

    expect(getJsonBody(response).message).toBe('Unauthorized');
  });

  it('rejects login with a wrong password without leaking the reason', async () => {
    await createUser();

    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8613800000000',
        password: 'wrong-password',
      })
      .expect(401);

    expect(getJsonBody(response).message).toBe('Unauthorized');
  });

  it('rejects disabled users without leaking the reason', async () => {
    await createUser({ status: 'disabled' });

    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8613800000000',
        password: 'correct-password',
      })
      .expect(401);

    expect(getJsonBody(response).message).toBe('Unauthorized');
  });

  it('rejects unauthenticated own password change requests', async () => {
    await request(httpServer)
      .patch('/auth/me/password')
      .send({
        currentPassword: 'correct-password',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
      })
      .expect(401);
  });

  it('rejects own password change when current password is wrong', async () => {
    await createUser();
    const sessionCookie = await loginAndGetSessionCookie();

    const response = await request(httpServer)
      .patch('/auth/me/password')
      .set('Cookie', toRequestCookie(sessionCookie))
      .send({
        currentPassword: 'wrong-password',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
      })
      .expect(400);

    expect(getJsonBody(response).message).toBe('当前密码不正确');
  });

  it('rejects own password change when confirmation does not match', async () => {
    await createUser();
    const sessionCookie = await loginAndGetSessionCookie();

    const response = await request(httpServer)
      .patch('/auth/me/password')
      .set('Cookie', toRequestCookie(sessionCookie))
      .send({
        currentPassword: 'correct-password',
        newPassword: 'new-password-1',
        confirmPassword: 'different-password',
      })
      .expect(400);

    expect(getJsonBody(response).message).toBe('两次输入的新密码不一致');
  });

  it('rejects own password change when new password matches current password', async () => {
    await createUser();
    const sessionCookie = await loginAndGetSessionCookie();

    const response = await request(httpServer)
      .patch('/auth/me/password')
      .set('Cookie', toRequestCookie(sessionCookie))
      .send({
        currentPassword: 'correct-password',
        newPassword: 'correct-password',
        confirmPassword: 'correct-password',
      })
      .expect(400);

    expect(getJsonBody(response).message).toBe(
      '新密码不能与当前密码相同',
    );
  });

  it('rejects own password change when new password is shorter than 8 characters', async () => {
    await createUser();
    const sessionCookie = await loginAndGetSessionCookie();

    const response = await request(httpServer)
      .patch('/auth/me/password')
      .set('Cookie', toRequestCookie(sessionCookie))
      .send({
        currentPassword: 'correct-password',
        newPassword: 'short',
        confirmPassword: 'short',
      })
      .expect(400);

    expect(String(getJsonBody(response).message)).toContain('newPassword');
  });

  it('changes own password, keeps the current session valid, and returns public user data', async () => {
    const user = await createUser({ mustChangePassword: true });
    const sessionCookie = await loginAndGetSessionCookie();

    const response = await request(httpServer)
      .patch('/auth/me/password')
      .set('Cookie', toRequestCookie(sessionCookie))
      .send({
        currentPassword: 'correct-password',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
      })
      .expect(200);

    const body = getJsonBody(response);
    expect(body).toMatchObject({
      id: user._id.toString(),
      phone: '+8613800000000',
      name: 'Test User',
      mustChangePassword: false,
    });
    expectNoSensitiveFields(body);

    const storedUser = await userModel
      .findById(user._id)
      .select('+passwordHash')
      .lean<StoredPasswordLean | null>()
      .exec();

    if (!storedUser) {
      throw new Error('Stored user not found');
    }

    expect(storedUser.mustChangePassword).toBe(false);
    expect(storedUser.passwordHash).toBeTruthy();
    expect(await compare('correct-password', storedUser.passwordHash)).toBe(
      false,
    );
    expect(await compare('new-password-1', storedUser.passwordHash)).toBe(true);

    await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8613800000000',
        password: 'correct-password',
      })
      .expect(401);

    const nextLoginResponse = await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8613800000000',
        password: 'new-password-1',
      })
      .expect(200);
    expectNoSensitiveFields(getJsonBody(nextLoginResponse));

    const meResponse = await request(httpServer)
      .get('/auth/me')
      .set('Cookie', toRequestCookie(sessionCookie))
      .expect(200);
    expect(getJsonBody(meResponse)).toMatchObject({
      id: user._id.toString(),
      mustChangePassword: false,
    });
  });

  it('rejects disabled users with an existing session when changing own password', async () => {
    const user = await createUser();
    const sessionCookie = await loginAndGetSessionCookie();

    await userModel
      .updateOne({ _id: user._id }, { $set: { isActive: false } })
      .exec();

    await request(httpServer)
      .patch('/auth/me/password')
      .set('Cookie', toRequestCookie(sessionCookie))
      .send({
        currentPassword: 'correct-password',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
      })
      .expect(401);
  });

  async function createUser(options: CreateTestUserOptions = {}) {
    return userModel.create({
      phone: options.phone ?? '+8613800000000',
      passwordHash: await hash(options.password ?? 'correct-password', 4),
      name: options.name ?? 'Test User',
      roles: [],
      status: options.status ?? 'active',
      isActive: options.isActive ?? true,
      mustChangePassword: options.mustChangePassword ?? false,
    });
  }

  async function loginAndGetSessionCookie(
    password = 'correct-password',
  ): Promise<string> {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8613800000000',
        password,
      })
      .expect(200);

    return getSessionCookie(response);
  }
});

function getSessionCookie(response: Response): string {
  const setCookie: unknown = response.headers['set-cookie'];

  if (Array.isArray(setCookie)) {
    return (
      setCookie
        .filter((cookie): cookie is string => typeof cookie === 'string')
        .find((cookie) => cookie.startsWith('reviewx_session=')) ?? ''
    );
  }

  return typeof setCookie === 'string' ? setCookie : '';
}

function toRequestCookie(setCookie: string): string {
  return setCookie.split(';')[0] ?? '';
}

function getJsonBody(response: Response): Record<string, unknown> {
  const body: unknown = response.body;
  return isRecord(body) ? body : {};
}

function expectNoSensitiveFields(value: Record<string, unknown>): void {
  expect(value.passwordHash).toBeUndefined();
  expect(value.token).toBeUndefined();
  expect(value.sessionToken).toBeUndefined();
}

function getHeaderValue(
  response: Response,
  headerName: string,
): string | string[] | undefined {
  const value: unknown = response.headers[headerName];

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

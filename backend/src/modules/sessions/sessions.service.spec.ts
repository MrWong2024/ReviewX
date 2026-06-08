import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model, Types } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from '../../config/configuration';
import { envValidationSchema } from '../../config/env.validation';
import { Session } from './schemas/session.schema';
import { SessionsModule } from './sessions.module';
import { SessionsService } from './sessions.service';
import { PublicSession } from './types/public-session.type';

process.env.NODE_ENV = 'test';

describe('SessionsService', () => {
  let moduleRef: TestingModule;
  let sessionsService: SessionsService;
  let connection: Connection;
  let sessionModel: Model<Session>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
          load: [configuration],
          validationSchema: envValidationSchema,
        }),
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            uri: configService.getOrThrow<string>('mongo.uri'),
            autoIndex: configService.getOrThrow<boolean>('mongo.autoIndex'),
            serverSelectionTimeoutMS: configService.getOrThrow<number>(
              'mongo.serverSelectionTimeoutMs',
            ),
          }),
        }),
        SessionsModule,
      ],
    }).compile();

    sessionsService = moduleRef.get(SessionsService);
    connection = moduleRef.get<Connection>(getConnectionToken());
    sessionModel = moduleRef.get<Model<Session>>(getModelToken(Session.name));
    await sessionModel.syncIndexes();
  });

  beforeEach(async () => {
    await sessionModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await sessionModel.deleteMany({}).exec();
    await connection.close();
    await moduleRef.close();
  });

  it('creates a session and returns a generated token', async () => {
    const result = await createSession();

    expect(result.token).toHaveLength(64);
    expect(result.session.userId).toBe(defaultUserId.toString());
    expect(result.expiresAt.toISOString()).toBe(
      result.session.expiresAt.toISOString(),
    );
    expect(hasToken(result.session)).toBe(false);
  });

  it('generates random tokens for separate sessions', async () => {
    const first = await createSession();
    const second = await createSession();

    expect(first.token).toHaveLength(64);
    expect(second.token).toHaveLength(64);
    expect(first.token).not.toBe(second.token);
  });

  it('finds a valid session by token without exposing token', async () => {
    const created = await createSession();

    const found = await sessionsService.findValidByToken(created.token);

    expect(found?.id).toBe(created.session.id);
    expect(found && hasToken(found)).toBe(false);
  });

  it('returns null for expired sessions without relying on TTL cleanup', async () => {
    const created = await sessionsService.createSession({
      userId: defaultUserId,
      expiresAt: new Date(Date.now() - 1000),
    });

    const found = await sessionsService.findValidByToken(created.token);

    expect(found).toBeNull();
  });

  it('returns null for revoked sessions', async () => {
    const created = await createSession();

    await sessionsService.revokeByToken(created.token);
    const found = await sessionsService.findValidByToken(created.token);

    expect(found).toBeNull();
  });

  it('revokes a session by token idempotently', async () => {
    const created = await createSession();

    await expect(sessionsService.revokeByToken(created.token)).resolves.toBe(
      true,
    );
    await expect(sessionsService.revokeByToken(created.token)).resolves.toBe(
      true,
    );
    await expect(
      sessionsService.findValidByToken(created.token),
    ).resolves.toBeNull();
  });

  it('revokes all active sessions for a user', async () => {
    const otherUserId = new Types.ObjectId();
    const first = await createSession();
    const second = await createSession();
    const other = await createSession(otherUserId);

    const modifiedCount = await sessionsService.revokeAllForUser(defaultUserId);

    expect(modifiedCount).toBe(2);
    await expect(
      sessionsService.findValidByToken(first.token),
    ).resolves.toBeNull();
    await expect(
      sessionsService.findValidByToken(second.token),
    ).resolves.toBeNull();
    await expect(
      sessionsService.findValidByToken(other.token),
    ).resolves.not.toBeNull();
  });

  it('defines an expiresAt TTL index', async () => {
    const indexes = await sessionModel.collection.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: { expiresAt: 1 },
          expireAfterSeconds: 0,
        }),
      ]),
    );
  });

  it('enforces unique tokens', async () => {
    const created = await createSession();

    await expect(
      sessionModel.create({
        userId: defaultUserId,
        token: created.token,
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('touches a valid session lastSeenAt', async () => {
    const created = await createSession();
    const seenAt = new Date('2026-01-01T00:00:00.000Z');

    const touched = await sessionsService.touchSession(created.token, seenAt);

    expect(touched?.lastSeenAt?.toISOString()).toBe(seenAt.toISOString());
    expect(touched && hasToken(touched)).toBe(false);
  });

  it('prunes older active sessions over the user limit', async () => {
    const first = await createSession();
    await waitForSortableTimestamp();
    const second = await createSession();
    await waitForSortableTimestamp();
    const third = await createSession();

    const modifiedCount = await sessionsService.pruneOldSessionsForUser(
      defaultUserId,
      2,
    );

    expect(modifiedCount).toBe(1);
    await expect(
      sessionsService.findValidByToken(first.token),
    ).resolves.toBeNull();
    await expect(
      sessionsService.findValidByToken(second.token),
    ).resolves.not.toBeNull();
    await expect(
      sessionsService.findValidByToken(third.token),
    ).resolves.not.toBeNull();
  });

  const defaultUserId = new Types.ObjectId();

  async function createSession(userId = defaultUserId) {
    return sessionsService.createSession({
      userId,
      ttlMs: 60_000,
      userAgent: 'Jest',
      ip: '127.0.0.1',
    });
  }
});

function hasToken(session: PublicSession): boolean {
  return 'token' in session;
}

function waitForSortableTimestamp(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 5);
  });
}

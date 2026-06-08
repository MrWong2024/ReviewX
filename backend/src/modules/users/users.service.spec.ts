import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from '../../config/configuration';
import { envValidationSchema } from '../../config/env.validation';
import { User } from './schemas/user.schema';
import { PublicUser } from './types/public-user.type';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';

process.env.NODE_ENV = 'test';

describe('UsersService', () => {
  let moduleRef: TestingModule;
  let usersService: UsersService;
  let connection: Connection;
  let userModel: Model<User>;

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
        UsersModule,
      ],
    }).compile();

    usersService = moduleRef.get(UsersService);
    connection = moduleRef.get<Connection>(getConnectionToken());
    userModel = moduleRef.get<Model<User>>(getModelToken(User.name));
    await userModel.syncIndexes();
  });

  beforeEach(async () => {
    await userModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await userModel.deleteMany({}).exec();
    await connection.close();
    await moduleRef.close();
  });

  it('creates a phone-based user with safe public defaults', async () => {
    const user = await createUser();

    expect(user.phone).toBe('+8613800000000');
    expect(user.name).toBe('Test User');
    expect(user.status).toBe('active');
    expect(user.roles).toEqual([]);
    expect(hasPasswordHash(user)).toBe(false);
  });

  it('finds a public user by phone without passwordHash', async () => {
    await createUser();

    const user = await usersService.findByPhone(' +8613800000000 ');

    expect(user).toMatchObject({
      phone: '+8613800000000',
      name: 'Test User',
      status: 'active',
    });
    expect(user && hasPasswordHash(user)).toBe(false);
  });

  it('finds a public user by id without passwordHash', async () => {
    const created = await createUser();

    const user = await usersService.findById(created.id);

    expect(user?.id).toBe(created.id);
    expect(user && hasPasswordHash(user)).toBe(false);
  });

  it('finds an auth identity by phone with passwordHash selected', async () => {
    await createUser();

    const identity =
      await usersService.findAuthIdentityByPhone('+8613800000000');

    expect(identity).toMatchObject({
      phone: '+8613800000000',
      passwordHash: 'hashed-password',
      roles: [],
      status: 'active',
    });
  });

  it('enforces unique phone values', async () => {
    await createUser();

    await expect(createUser()).rejects.toMatchObject({
      code: 11000,
    });
  });

  it('updates lastLoginAt', async () => {
    const created = await createUser();
    const loginDate = new Date('2026-01-01T00:00:00.000Z');

    const updated = await usersService.updateLastLoginAt(created.id, loginDate);

    expect(updated?.lastLoginAt?.toISOString()).toBe(loginDate.toISOString());
  });

  async function createUser(): Promise<PublicUser> {
    return usersService.create({
      phone: ' +8613800000000 ',
      passwordHash: 'hashed-password',
      name: ' Test User ',
    });
  }
});

function hasPasswordHash(user: PublicUser): boolean {
  return 'passwordHash' in user;
}

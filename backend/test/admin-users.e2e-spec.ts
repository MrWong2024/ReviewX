import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { Connection, Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Organization } from '../src/modules/organizations/schemas/organization.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { TreeDictionary } from '../src/modules/tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

type TestUser = {
  id: string;
  phone: string;
};

describe('Admin users APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let organizationModel: Model<Organization>;
  let treeDictionaryModel: Model<TreeDictionary>;
  let models: Model<unknown>[];

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
    organizationModel = app.get<Model<Organization>>(
      getModelToken(Organization.name),
    );
    treeDictionaryModel = app.get<Model<TreeDictionary>>(
      getModelToken(TreeDictionary.name),
    );
    models = [userModel, sessionModel, organizationModel, treeDictionaryModel];

    for (const model of models) {
      await model.syncIndexes();
    }
  });

  beforeEach(async () => {
    await clearCollections();
  });

  afterAll(async () => {
    await clearCollections();
    await connection.close();
    await app.close();
  });

  it('requires login and admin role', async () => {
    await request(httpServer).get('/admin/users').expect(401);

    const client = await createUser({
      phone: '+8615000000001',
      roles: ['client'],
    });
    const clientCookie = await login(client.phone);

    await request(httpServer)
      .get('/admin/users')
      .set('Cookie', clientCookie)
      .expect(403);

    const admin = await createUser({
      phone: '+8615000000002',
      roles: ['admin'],
    });
    const adminCookie = await login(admin.phone);

    const response = await request(httpServer)
      .get('/admin/users')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(getJsonBody(response)).toMatchObject({
      page: 1,
      pageSize: 100,
      total: 2,
    });
    expectResponseHasNoPasswordHash(response.body);
  });

  it('creates users, validates references, and supports list filters', async () => {
    const admin = await createUser({
      phone: '+8615000000100',
      roles: ['admin'],
    });
    const adminCookie = await login(admin.phone);
    const organization = await organizationModel.create({
      name: 'Active Organization',
      isActive: true,
    });
    const inactiveOrganization = await organizationModel.create({
      name: 'Inactive Organization',
      isActive: false,
    });
    const discipline = await treeDictionaryModel.create({
      treeType: 'discipline',
      name: 'Computer Science',
      pathIds: [],
      level: 1,
      isActive: true,
    });
    const inactiveDiscipline = await treeDictionaryModel.create({
      treeType: 'discipline',
      name: 'Inactive Discipline',
      pathIds: [],
      level: 1,
      isActive: false,
    });
    const department = await treeDictionaryModel.create({
      treeType: 'department',
      name: 'Department Node',
      pathIds: [],
      level: 1,
      isActive: true,
    });

    const createResponse = await request(httpServer)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: ' Expert User ',
        phone: ' +8615000000101 ',
        roles: ['expert', 'review_manager', 'expert'],
        organizationIds: [organization._id.toString()],
        disciplineIds: [discipline._id.toString()],
      })
      .expect(201);
    const created = getJsonBody(createResponse);
    const createdId = getString(created, 'id');

    expect(created).toMatchObject({
      name: 'Expert User',
      phone: '+8615000000101',
      roles: ['expert', 'review_manager'],
      organizationIds: [organization._id.toString()],
      disciplineIds: [discipline._id.toString()],
      isActive: true,
      mustChangePassword: true,
    });
    expectResponseHasNoPasswordHash(createResponse.body);

    await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8615000000101',
        password: '+8615000000101',
      })
      .expect(200);

    await request(httpServer)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Duplicate Phone',
        phone: '+8615000000101',
        roles: ['client'],
      })
      .expect(409);

    await request(httpServer)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Bad Organization',
        phone: '+8615000000102',
        roles: ['expert'],
        organizationIds: [inactiveOrganization._id.toString()],
      })
      .expect(400);

    await request(httpServer)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Bad Discipline Type',
        phone: '+8615000000103',
        roles: ['expert'],
        disciplineIds: [department._id.toString()],
      })
      .expect(400);

    await request(httpServer)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Inactive Discipline User',
        phone: '+8615000000104',
        roles: ['expert'],
        disciplineIds: [inactiveDiscipline._id.toString()],
      })
      .expect(400);

    const filteredResponse = await request(httpServer)
      .get('/admin/users')
      .query({
        page: 1,
        pageSize: 1000,
        keyword: 'Expert',
        role: 'expert',
        isActive: 'true',
        organizationId: organization._id.toString(),
        disciplineId: discipline._id.toString(),
      })
      .set('Cookie', adminCookie)
      .expect(200);
    const filteredBody = getJsonBody(filteredResponse);
    expect(filteredBody).toMatchObject({
      page: 1,
      pageSize: 1000,
      total: 1,
    });
    expect(getRecordArray(filteredBody, 'items')[0]).toMatchObject({
      id: createdId,
      phone: '+8615000000101',
    });
    expectResponseHasNoPasswordHash(filteredResponse.body);

    await request(httpServer)
      .get('/admin/users')
      .query({ pageSize: 1001 })
      .set('Cookie', adminCookie)
      .expect(400);

    await request(httpServer)
      .get('/admin/users')
      .query({ role: 'invalid_role' })
      .set('Cookie', adminCookie)
      .expect(400);
  });

  it('gets, updates, enables, disables, and resets user passwords safely', async () => {
    const admin = await createUser({
      phone: '+8615000000200',
      roles: ['admin'],
    });
    const adminCookie = await login(admin.phone);
    const organizationA = await organizationModel.create({
      name: 'Organization A',
      isActive: true,
    });
    const organizationB = await organizationModel.create({
      name: 'Organization B',
      isActive: true,
    });
    const disciplineA = await treeDictionaryModel.create({
      treeType: 'discipline',
      name: 'Discipline A',
      pathIds: [],
      level: 1,
      isActive: true,
    });
    const disciplineB = await treeDictionaryModel.create({
      treeType: 'discipline',
      name: 'Discipline B',
      pathIds: [],
      level: 1,
      isActive: true,
    });

    const createResponse = await request(httpServer)
      .post('/admin/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Managed Expert',
        phone: '+8615000000201',
        roles: ['expert'],
        password: 'initial-password',
        organizationIds: [organizationA._id.toString()],
        disciplineIds: [disciplineA._id.toString()],
      })
      .expect(201);
    const created = getJsonBody(createResponse);
    const userId = getString(created, 'id');

    await request(httpServer)
      .get('/admin/users/not-a-valid-id')
      .set('Cookie', adminCookie)
      .expect(400);

    await request(httpServer)
      .get(`/admin/users/${new Types.ObjectId().toString()}`)
      .set('Cookie', adminCookie)
      .expect(404);

    const detailResponse = await request(httpServer)
      .get(`/admin/users/${userId}`)
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(detailResponse)).toMatchObject({
      id: userId,
      phone: '+8615000000201',
      roles: ['expert'],
    });
    expectResponseHasNoPasswordHash(detailResponse.body);

    const updateResponse = await request(httpServer)
      .patch(`/admin/users/${userId}`)
      .set('Cookie', adminCookie)
      .send({
        name: 'Updated Expert',
        roles: ['expert', 'project_owner'],
        isActive: false,
        organizationIds: [organizationB._id.toString()],
        disciplineIds: [disciplineB._id.toString()],
        mustChangePassword: false,
      })
      .expect(200);
    expect(getJsonBody(updateResponse)).toMatchObject({
      name: 'Updated Expert',
      roles: ['expert', 'project_owner'],
      isActive: false,
      organizationIds: [organizationB._id.toString()],
      disciplineIds: [disciplineB._id.toString()],
      mustChangePassword: false,
    });
    expectResponseHasNoPasswordHash(updateResponse.body);

    const inactiveFilterResponse = await request(httpServer)
      .get('/admin/users')
      .query({ isActive: 'false', role: 'project_owner' })
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(inactiveFilterResponse)).toMatchObject({ total: 1 });

    const enabledResponse = await request(httpServer)
      .patch(`/admin/users/${userId}/status`)
      .set('Cookie', adminCookie)
      .send({ isActive: true })
      .expect(200);
    expect(getJsonBody(enabledResponse)).toMatchObject({ isActive: true });

    await request(httpServer)
      .patch(`/admin/users/${userId}`)
      .set('Cookie', adminCookie)
      .send({ password: 'wrong-endpoint' })
      .expect(400);

    const resetResponse = await request(httpServer)
      .post(`/admin/users/${userId}/reset-password`)
      .set('Cookie', adminCookie)
      .send({})
      .expect(201);
    expect(getJsonBody(resetResponse)).toMatchObject({
      id: userId,
      mustChangePassword: true,
    });
    expectResponseHasNoPasswordHash(resetResponse.body);

    await request(httpServer)
      .post('/auth/login')
      .send({
        phone: '+8615000000201',
        password: '+8615000000201',
      })
      .expect(200);
  });

  it('protects current admin and keeps at least one enabled admin', async () => {
    const admin = await createUser({
      phone: '+8615000000300',
      roles: ['admin'],
    });
    const adminCookie = await login(admin.phone);

    await request(httpServer)
      .patch(`/admin/users/${admin.id}/status`)
      .set('Cookie', adminCookie)
      .send({ isActive: false })
      .expect(409);

    await request(httpServer)
      .patch(`/admin/users/${admin.id}`)
      .set('Cookie', adminCookie)
      .send({ roles: ['client'] })
      .expect(409);

    const otherAdmin = await createUser({
      phone: '+8615000000301',
      roles: ['admin'],
    });

    const disableOtherResponse = await request(httpServer)
      .patch(`/admin/users/${otherAdmin.id}/status`)
      .set('Cookie', adminCookie)
      .send({ isActive: false })
      .expect(200);
    expect(getJsonBody(disableOtherResponse)).toMatchObject({
      id: otherAdmin.id,
      isActive: false,
    });

    const adminAfterAttempts = await userModel
      .findById(admin.id)
      .select({ roles: 1, isActive: 1 })
      .lean<{ roles: string[]; isActive?: boolean } | null>()
      .exec();
    expect(adminAfterAttempts).toMatchObject({
      roles: ['admin'],
      isActive: true,
    });
  });

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }

  async function createUser(input: {
    phone: string;
    roles: string[];
    isActive?: boolean;
  }): Promise<TestUser> {
    const userId = new Types.ObjectId();

    await userModel.create({
      _id: userId,
      phone: input.phone,
      passwordHash: await hash('correct-password', 4),
      name: 'Test User',
      roles: input.roles,
      status: 'active',
      isActive: input.isActive ?? true,
    });

    return { id: userId.toString(), phone: input.phone };
  }

  async function login(phone: string): Promise<string> {
    const response = await request(httpServer)
      .post('/auth/login')
      .send({
        phone,
        password: 'correct-password',
      })
      .expect(200);

    return toRequestCookie(getSessionCookie(response));
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

function getString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`);
  }

  return value;
}

function getRecordArray(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown>[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array`);
  }

  return value.filter(isRecord);
}

function expectResponseHasNoPasswordHash(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      expectResponseHasNoPasswordHash(item);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  expect(value).not.toHaveProperty('passwordHash');

  for (const childValue of Object.values(value)) {
    expectResponseHasNoPasswordHash(childValue);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

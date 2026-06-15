import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { Connection, Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Batch } from '../src/modules/batches/schemas/batch.schema';
import { Dictionary } from '../src/modules/dictionaries/schemas/dictionary.schema';
import { Organization } from '../src/modules/organizations/schemas/organization.schema';
import { ReviewScheme } from '../src/modules/review-schemes/schemas/review-scheme.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { TreeDictionary } from '../src/modules/tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

type SeedData = {
  admin: TestUser;
  client: TestUser;
  owner: TestUser;
  noRoleUser: TestUser;
  reviewManager: TestUser;
  materialTypeId: string;
  projectStatusId: string;
  disciplineId: string;
};

type TestUser = {
  id: string;
  phone: string;
};

describe('Portal reference data APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let dictionaryModel: Model<Dictionary>;
  let treeDictionaryModel: Model<TreeDictionary>;
  let batchModel: Model<Batch>;
  let organizationModel: Model<Organization>;
  let reviewSchemeModel: Model<ReviewScheme>;
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
    dictionaryModel = app.get<Model<Dictionary>>(
      getModelToken(Dictionary.name),
    );
    treeDictionaryModel = app.get<Model<TreeDictionary>>(
      getModelToken(TreeDictionary.name),
    );
    batchModel = app.get<Model<Batch>>(getModelToken(Batch.name));
    organizationModel = app.get<Model<Organization>>(
      getModelToken(Organization.name),
    );
    reviewSchemeModel = app.get<Model<ReviewScheme>>(
      getModelToken(ReviewScheme.name),
    );
    models = [
      userModel,
      sessionModel,
      dictionaryModel,
      treeDictionaryModel,
      batchModel,
      organizationModel,
      reviewSchemeModel,
    ];

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

  it('requires login and an allowed portal role', async () => {
    const data = await seedData();
    const noRoleCookie = await login(data.noRoleUser.phone);

    await request(httpServer)
      .get('/portal/reference-data/dictionaries')
      .expect(401);

    await request(httpServer)
      .get('/portal/reference-data/dictionaries')
      .set('Cookie', noRoleCookie)
      .expect(403);
  });

  it('allows project_owner to read project display reference summaries', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);

    const materialTypesResponse = await request(httpServer)
      .get('/portal/reference-data/dictionaries')
      .query({ dictType: 'material_type' })
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getItems(materialTypesResponse)).toEqual([
      expect.objectContaining({
        id: data.materialTypeId,
        dictType: 'material_type',
        code: 'ppt',
        name: '汇报 PPT',
        isActive: true,
      }),
    ]);
    expectResponseHasNoForbiddenFields(materialTypesResponse.body);

    const projectStatusResponse = await request(httpServer)
      .get('/portal/reference-data/dictionaries')
      .query({ dictType: 'project_status' })
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getItems(projectStatusResponse)).toEqual([
      expect.objectContaining({
        id: data.projectStatusId,
        dictType: 'project_status',
        code: 'in_progress',
      }),
    ]);

    const disciplineResponse = await request(httpServer)
      .get('/portal/reference-data/tree-dictionaries')
      .query({ treeType: 'discipline' })
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getItems(disciplineResponse)).toEqual([
      expect.objectContaining({
        id: data.disciplineId,
        treeType: 'discipline',
        code: 'cs',
        name: '计算机科学技术',
      }),
    ]);

    const batchesResponse = await request(httpServer)
      .get('/portal/reference-data/batches')
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getItems(batchesResponse)).toEqual([
      expect.objectContaining({ name: '2026', isActive: true }),
    ]);

    const organizationsResponse = await request(httpServer)
      .get('/portal/reference-data/organizations')
      .set('Cookie', ownerCookie)
      .expect(200);
    const organizations = getItems(organizationsResponse);
    expect(organizations).toEqual([
      expect.objectContaining({
        name: '重庆测试单位',
        isActive: true,
      }),
    ]);
    expect(organizations[0]).not.toHaveProperty('contactName');
    expect(organizations[0]).not.toHaveProperty('contactPhone');

    const reviewSchemesResponse = await request(httpServer)
      .get('/portal/reference-data/review-schemes')
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getItems(reviewSchemesResponse)).toEqual([
      expect.objectContaining({
        name: '验收评审方案',
        totalScore: 100,
        isActive: true,
      }),
    ]);

    const usersResponse = await request(httpServer)
      .get('/portal/reference-data/users')
      .query({ role: 'review_manager' })
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getItems(usersResponse)).toEqual([
      expect.objectContaining({
        id: data.reviewManager.id,
        name: '评审负责人',
        phone: data.reviewManager.phone,
        roles: ['review_manager'],
      }),
    ]);
    expectResponseHasNoForbiddenFields(usersResponse.body);
  });

  it('rejects unsafe user summary queries', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);

    await request(httpServer)
      .get('/portal/reference-data/users')
      .set('Cookie', ownerCookie)
      .expect(400);

    await request(httpServer)
      .get('/portal/reference-data/users')
      .query({ role: 'admin' })
      .set('Cookie', ownerCookie)
      .expect(400);

    await request(httpServer)
      .get('/portal/reference-data/users')
      .query({ roles: 'review_manager,admin' })
      .set('Cookie', ownerCookie)
      .expect(400);
  });

  it('allows admin reuse and exposes no write endpoints', async () => {
    const data = await seedData();
    const adminCookie = await login(data.admin.phone);

    await request(httpServer)
      .get('/portal/reference-data/dictionaries')
      .query({ dictTypes: 'material_type,project_status' })
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(getItems(response)).toHaveLength(2);
      });

    await request(httpServer)
      .post('/portal/reference-data/dictionaries')
      .set('Cookie', adminCookie)
      .send({ dictType: 'material_type', code: 'new', name: '新材料' })
      .expect(404);

    await request(httpServer)
      .patch('/portal/reference-data/dictionaries')
      .set('Cookie', adminCookie)
      .send({ name: '不应存在' })
      .expect(404);

    await request(httpServer)
      .delete('/portal/reference-data/dictionaries')
      .set('Cookie', adminCookie)
      .expect(404);
  });

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }

  async function seedData(): Promise<SeedData> {
    const admin = await createUser('+8613910000001', ['admin'], '管理员');
    const client = await createUser('+8613910000002', ['client'], '甲方用户');
    const owner = await createUser(
      '+8613910000003',
      ['project_owner'],
      '项目负责人',
    );
    const noRoleUser = await createUser('+8613910000004', [], '无角色用户');
    const reviewManager = await createUser(
      '+8613910000005',
      ['review_manager'],
      '评审负责人',
    );
    await createUser(
      '+8613910000006',
      ['admin', 'review_manager'],
      '管理员兼负责人',
    );

    const materialType = await dictionaryModel.create({
      dictType: 'material_type',
      code: 'ppt',
      name: '汇报 PPT',
      sortOrder: 1,
      isActive: true,
      description: 'not returned',
    });
    await dictionaryModel.create({
      dictType: 'material_type',
      code: 'old',
      name: '停用材料类型',
      sortOrder: 2,
      isActive: false,
    });
    const projectStatus = await dictionaryModel.create({
      dictType: 'project_status',
      code: 'in_progress',
      name: '实施中',
      sortOrder: 1,
      isActive: true,
    });
    const discipline = await treeDictionaryModel.create({
      treeType: 'discipline',
      code: 'cs',
      name: '计算机科学技术',
      pathIds: [],
      level: 1,
      sortOrder: 1,
      isActive: true,
      fullName: 'not returned',
    });
    await treeDictionaryModel.create({
      treeType: 'discipline',
      code: 'old',
      name: '停用学科',
      pathIds: [],
      level: 1,
      sortOrder: 2,
      isActive: false,
    });
    await treeDictionaryModel.create({
      treeType: 'project_type',
      code: 'tech',
      name: '科技项目',
      pathIds: [],
      level: 1,
      sortOrder: 1,
      isActive: true,
    });
    const region = await treeDictionaryModel.create({
      treeType: 'administrative_division',
      code: '500000',
      name: '重庆市',
      pathIds: [],
      level: 1,
      sortOrder: 1,
      isActive: true,
    });
    await treeDictionaryModel.create({
      treeType: 'department',
      code: 'gx',
      name: '高新处',
      pathIds: [],
      level: 1,
      sortOrder: 1,
      isActive: true,
    });
    await batchModel.create({
      name: '2026',
      year: 2026,
      description: 'not returned',
      isActive: true,
    });
    await batchModel.create({
      name: '2025',
      isActive: false,
    });
    await organizationModel.create({
      name: '重庆测试单位',
      contactName: '联系人',
      contactPhone: '+8613910000999',
      regionId: region._id,
      isActive: true,
    });
    await organizationModel.create({
      name: '停用单位',
      isActive: false,
    });
    await reviewSchemeModel.create({
      name: '验收评审方案',
      description: 'not returned',
      items: [{ name: '技术', maxScore: 100 }],
      totalScore: 100,
      isActive: true,
    });

    return {
      admin,
      client,
      owner,
      noRoleUser,
      reviewManager,
      materialTypeId: materialType._id.toString(),
      projectStatusId: projectStatus._id.toString(),
      disciplineId: discipline._id.toString(),
    };
  }

  async function createUser(
    phone: string,
    roles: string[],
    name: string,
  ): Promise<TestUser> {
    const userId = new Types.ObjectId();

    await userModel.create({
      _id: userId,
      phone,
      passwordHash: await hash('correct-password', 4),
      name,
      roles,
      status: 'active',
      isActive: true,
      mustChangePassword: true,
    });

    return { id: userId.toString(), phone };
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

function getItems(response: Response): Record<string, unknown>[] {
  const body = getJsonBody(response);
  const items = body.items;

  if (!Array.isArray(items)) {
    throw new Error('response body items must be an array');
  }

  return items.filter(isRecord);
}

function getJsonBody(response: Response): Record<string, unknown> {
  const body: unknown = response.body;
  return isRecord(body) ? body : {};
}

function expectResponseHasNoForbiddenFields(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      expectResponseHasNoForbiddenFields(item);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  expect(value).not.toHaveProperty('passwordHash');
  expect(value).not.toHaveProperty('mustChangePassword');
  expect(value).not.toHaveProperty('token');
  expect(value).not.toHaveProperty('sessionToken');
  expect(value).not.toHaveProperty('session');

  for (const childValue of Object.values(value)) {
    expectResponseHasNoForbiddenFields(childValue);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

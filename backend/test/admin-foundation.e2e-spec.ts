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
import { Project } from '../src/modules/projects/schemas/project.schema';
import { ReviewScheme } from '../src/modules/review-schemes/schemas/review-scheme.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { TreeDictionary } from '../src/modules/tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

describe('Admin foundation APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
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
    models = [
      userModel,
      sessionModel,
      app.get<Model<Batch>>(getModelToken(Batch.name)),
      app.get<Model<Dictionary>>(getModelToken(Dictionary.name)),
      app.get<Model<TreeDictionary>>(getModelToken(TreeDictionary.name)),
      app.get<Model<Organization>>(getModelToken(Organization.name)),
      app.get<Model<ReviewScheme>>(getModelToken(ReviewScheme.name)),
      app.get<Model<Project>>(getModelToken(Project.name)),
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

  it('requires login and admin role for admin APIs', async () => {
    await request(httpServer).get('/admin/batches').expect(401);

    await createUser({
      phone: '+8613800000001',
      roles: ['client'],
    });
    const nonAdminCookie = await login('+8613800000001');

    await request(httpServer)
      .get('/admin/batches')
      .set('Cookie', nonAdminCookie)
      .expect(403);

    await createUser({
      phone: '+8613800000002',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613800000002');

    const response = await request(httpServer)
      .get('/admin/batches')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(getJsonBody(response)).toMatchObject({
      items: [],
      page: 1,
      pageSize: 100,
      total: 0,
    });
  });

  it('creates and validates first-stage master data and projects', async () => {
    await createUser({
      phone: '+8613800000010',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613800000010');

    const batch = await post(adminCookie, '/admin/batches', {
      name: '2026',
      year: 2026,
    });
    const batchId = getString(batch, 'id');
    await request(httpServer)
      .post('/admin/batches')
      .set('Cookie', adminCookie)
      .send({ name: '2026' })
      .expect(409);

    const status = await post(adminCookie, '/admin/dictionaries', {
      dictType: 'project_status',
      code: 'in_progress',
      name: '实施中',
    });
    const statusId = getString(status, 'id');
    const dictionariesResponse = await request(httpServer)
      .get('/admin/dictionaries')
      .query({ dictType: 'project_status' })
      .set('Cookie', adminCookie)
      .expect(200);
    const dictionariesBody = getJsonArray(dictionariesResponse);
    expect(dictionariesBody).toHaveLength(1);
    expect(dictionariesBody[0]).toMatchObject({
      id: statusId,
      dictType: 'project_status',
      code: 'in_progress',
    });
    expect(hasPaginationWrapper(dictionariesBody)).toBe(false);

    await request(httpServer)
      .post('/admin/dictionaries')
      .set('Cookie', adminCookie)
      .send({
        dictType: 'project_status',
        code: 'in_progress',
        name: '实施中2',
      })
      .expect(409);

    const region = await post(adminCookie, '/admin/tree-dictionaries', {
      treeType: 'region',
      code: '500000',
      name: '重庆市',
    });
    const regionId = getString(region, 'id');
    const childRegion = await post(adminCookie, '/admin/tree-dictionaries', {
      treeType: 'region',
      parentId: regionId,
      code: '500100',
      name: '市辖区',
    });
    expect(childRegion).toMatchObject({
      parentId: regionId,
      level: 2,
      pathIds: [regionId],
    });
    await request(httpServer)
      .delete(`/admin/tree-dictionaries/${regionId}`)
      .set('Cookie', adminCookie)
      .expect(409);

    const projectType = await post(adminCookie, '/admin/tree-dictionaries', {
      treeType: 'project_type',
      name: '自然科学基金',
    });
    const projectTypeId = getString(projectType, 'id');
    const discipline = await post(adminCookie, '/admin/tree-dictionaries', {
      treeType: 'discipline',
      name: '计算机科学技术',
    });
    const disciplineId = getString(discipline, 'id');
    const department = await post(adminCookie, '/admin/tree-dictionaries', {
      treeType: 'department',
      name: '高新处',
    });
    const departmentId = getString(department, 'id');
    const treeDictionariesResponse = await request(httpServer)
      .get('/admin/tree-dictionaries')
      .query({ treeType: 'discipline' })
      .set('Cookie', adminCookie)
      .expect(200);
    const treeDictionariesBody = getJsonArray(treeDictionariesResponse);
    expect(treeDictionariesBody).toHaveLength(1);
    expect(treeDictionariesBody[0]).toMatchObject({
      id: disciplineId,
      treeType: 'discipline',
      level: 1,
    });
    expect(hasPaginationWrapper(treeDictionariesBody)).toBe(false);

    const organization = await post(adminCookie, '/admin/organizations', {
      name: '重庆测试单位',
      contactName: '联系人',
      contactPhone: '+8613800000099',
      regionId,
    });
    const organizationId = getString(organization, 'id');
    const cooperationOrganization = await post(
      adminCookie,
      '/admin/organizations',
      {
        name: '重庆合作单位',
        regionId,
      },
    );
    const cooperationOrganizationId = getString(cooperationOrganization, 'id');
    await request(httpServer)
      .post('/admin/organizations')
      .set('Cookie', adminCookie)
      .send({ name: '重庆测试单位' })
      .expect(409);

    const reviewScheme = await post(adminCookie, '/admin/review-schemes', {
      name: '验收评审方案',
      items: [
        {
          name: '技术指标',
          maxScore: 60,
          scoringGuide: '按完成度评分',
          sortOrder: 1,
        },
        {
          name: '经费使用',
          maxScore: 40,
          suggestionRequiredThresholdRatio: 0.7,
          sortOrder: 2,
        },
      ],
    });
    expect(reviewScheme).toMatchObject({ totalScore: 100 });
    const reviewSchemeId = getString(reviewScheme, 'id');
    const reviewSchemeItems = getRecordArray(reviewScheme, 'items');
    expect(reviewSchemeItems[1]).toMatchObject({
      suggestionRequiredThresholdRatio: 0.7,
    });
    const reviewSchemesResponse = await request(httpServer)
      .get('/admin/review-schemes')
      .query({ keyword: '验收' })
      .set('Cookie', adminCookie)
      .expect(200);
    const reviewSchemesBody = getJsonArray(reviewSchemesResponse);
    expect(reviewSchemesBody).toHaveLength(1);
    expect(reviewSchemesBody[0]).toMatchObject({
      id: reviewSchemeId,
      totalScore: 100,
    });
    expect(hasPaginationWrapper(reviewSchemesBody)).toBe(false);

    const owner = await createUser({
      phone: '+8613800000011',
      roles: ['project_owner'],
    });
    const reviewManager = await createUser({
      phone: '+8613800000012',
      roles: ['review_manager'],
    });

    const project = await post(adminCookie, '/admin/projects', {
      batchId,
      projectNo: 'P-2026-001',
      name: '科技项目一',
      projectTypeId,
      statusId,
      ownerUserId: owner.id,
      leadOrganizationId: organizationId,
      cooperationOrganizationIds: [
        cooperationOrganizationId,
        cooperationOrganizationId,
      ],
      totalFunding: 100,
      allocatedFunding: 50,
      disciplineIds: [disciplineId, disciplineId],
      departmentId,
      reviewManagerId: reviewManager.id,
      reviewSchemeId,
      reviewLocation: '会议室 A',
    });

    expect(project).toMatchObject({
      batchId,
      projectNo: 'P-2026-001',
      projectTypeId,
      statusId,
      ownerUserId: owner.id,
      leadOrganizationId: organizationId,
      disciplineIds: [disciplineId],
      departmentId,
      reviewManagerId: reviewManager.id,
      reviewSchemeId,
    });
    expect(getStringArray(project, 'cooperationOrganizationIds')).toEqual([
      cooperationOrganizationId,
    ]);

    const projectsResponse = await request(httpServer)
      .get('/admin/projects')
      .query({ batchId, page: 1, pageSize: 1000 })
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(projectsResponse)).toMatchObject({
      page: 1,
      pageSize: 1000,
      total: 1,
    });
    expect(getRecordArray(getJsonBody(projectsResponse), 'items')).toHaveLength(
      1,
    );

    await request(httpServer)
      .get('/admin/projects')
      .query({ pageSize: 1001 })
      .set('Cookie', adminCookie)
      .expect(400);

    const organizationsResponse = await request(httpServer)
      .get('/admin/organizations')
      .query({ page: 1, pageSize: 1000 })
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(organizationsResponse)).toMatchObject({
      page: 1,
      pageSize: 1000,
      total: 2,
    });
    expect(
      getRecordArray(getJsonBody(organizationsResponse), 'items'),
    ).toHaveLength(2);

    await request(httpServer)
      .get('/admin/organizations')
      .query({ pageSize: 1001 })
      .set('Cookie', adminCookie)
      .expect(400);

    await request(httpServer)
      .post('/admin/projects')
      .set('Cookie', adminCookie)
      .send({
        batchId,
        projectNo: 'P-2026-001',
        name: '重复项目',
      })
      .expect(409);

    await request(httpServer)
      .post('/admin/projects')
      .set('Cookie', adminCookie)
      .send({
        batchId,
        projectNo: 'P-2026-002',
        name: '错误负责人项目',
        ownerUserId: reviewManager.id,
      })
      .expect(400);
  });

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }

  async function createUser(input: {
    phone: string;
    roles: string[];
  }): Promise<{ id: string }> {
    const userId = new Types.ObjectId();

    await userModel.create({
      _id: userId,
      phone: input.phone,
      passwordHash: await hash('correct-password', 4),
      name: 'Test User',
      roles: input.roles,
      status: 'active',
      isActive: true,
    });

    return { id: userId.toString() };
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

  async function post(
    cookie: string,
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const response = await request(httpServer)
      .post(path)
      .set('Cookie', cookie)
      .send(body)
      .expect(201);

    return getJsonBody(response);
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

function getJsonArray(response: Response): Record<string, unknown>[] {
  const body: unknown = response.body;

  if (!Array.isArray(body)) {
    throw new Error('response body must be an array');
  }

  return body.filter(isRecord);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`);
  }

  return value;
}

function getStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw new Error(`${key} must be an array`);
  }

  return value.filter((item): item is string => typeof item === 'string');
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

function hasPaginationWrapper(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    'items' in value &&
    'page' in value &&
    'pageSize' in value &&
    'total' in value
  );
}

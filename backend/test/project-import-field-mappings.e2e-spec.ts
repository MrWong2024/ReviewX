import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { Connection, Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ProjectImportFieldMapping } from '../src/modules/project-imports/schemas/project-import-field-mapping.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

describe('Project import field mapping admin APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let fieldMappingModel: Model<ProjectImportFieldMapping>;
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
    fieldMappingModel = app.get<Model<ProjectImportFieldMapping>>(
      getModelToken(ProjectImportFieldMapping.name),
    );
    models = [userModel, sessionModel, fieldMappingModel];

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
    await request(httpServer)
      .get('/admin/project-import-field-mappings/standard-fields')
      .expect(401);

    await createUser({
      phone: '+8613820000001',
      name: 'Client User',
      roles: ['client'],
    });
    const nonAdminCookie = await login('+8613820000001');

    await request(httpServer)
      .get('/admin/project-import-field-mappings/standard-fields')
      .set('Cookie', nonAdminCookie)
      .expect(403);

    await createUser({
      phone: '+8613820000002',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613820000002');

    const response = await request(httpServer)
      .get('/admin/project-import-field-mappings/standard-fields')
      .set('Cookie', adminCookie)
      .expect(200);

    const items = getRecordArray(getJsonBody(response), 'items');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toMatchObject({
      standardField: 'projectNo',
      label: '项目编号',
      required: true,
    });
  });

  it('upserts, lists, patches, resets, and deletes field mappings', async () => {
    const adminId = await createUser({
      phone: '+8613820000010',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613820000010');

    const upsertResponse = await request(httpServer)
      .put('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .send({
        aliases: [' 项目唯一编号 ', '项目合同号'],
        isActive: true,
        description: '本地 Excel 常见表头',
      })
      .expect(200);
    expect(getJsonBody(upsertResponse)).toMatchObject({
      standardField: 'projectNo',
      aliases: ['项目唯一编号', '项目合同号'],
      effectiveAliases: ['项目唯一编号', '项目合同号'],
      isConfigured: true,
      isActive: true,
      description: '本地 Excel 常见表头',
      createdByUserId: adminId,
      updatedByUserId: adminId,
    });

    const listResponse = await request(httpServer)
      .get('/admin/project-import-field-mappings')
      .set('Cookie', adminCookie)
      .expect(200);
    const projectNo = findField(
      getRecordArray(getJsonBody(listResponse), 'items'),
      'projectNo',
    );
    expect(projectNo).toMatchObject({
      standardField: 'projectNo',
      aliases: ['项目唯一编号', '项目合同号'],
      effectiveAliases: ['项目唯一编号', '项目合同号'],
      isConfigured: true,
    });

    const detailResponse = await request(httpServer)
      .get('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(detailResponse)).toMatchObject({
      standardField: 'projectNo',
      aliases: ['项目唯一编号', '项目合同号'],
    });

    const patchResponse = await request(httpServer)
      .patch('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .send({ isActive: false })
      .expect(200);
    expect(getJsonBody(patchResponse)).toMatchObject({
      standardField: 'projectNo',
      isActive: false,
      effectiveAliases: ['项目编号', '编号', '项目代码', '项目合同编号'],
    });

    const resetResponse = await request(httpServer)
      .post('/admin/project-import-field-mappings/projectNo/reset-defaults')
      .set('Cookie', adminCookie)
      .expect(201);
    expect(getJsonBody(resetResponse)).toMatchObject({
      standardField: 'projectNo',
      aliases: ['项目编号', '编号', '项目代码', '项目合同编号'],
      effectiveAliases: ['项目编号', '编号', '项目代码', '项目合同编号'],
      isConfigured: true,
      isActive: true,
    });

    await request(httpServer)
      .delete('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .expect(200)
      .expect({ success: true });

    const fallbackResponse = await request(httpServer)
      .get('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(fallbackResponse)).toMatchObject({
      standardField: 'projectNo',
      aliases: [],
      effectiveAliases: ['项目编号', '编号', '项目代码', '项目合同编号'],
      isConfigured: false,
      isActive: true,
    });
  });

  it('rejects invalid fields, empty aliases, duplicate aliases, and conflicts', async () => {
    await createUser({
      phone: '+8613820000020',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613820000020');

    await request(httpServer)
      .put('/admin/project-import-field-mappings/unknownField')
      .set('Cookie', adminCookie)
      .send({ aliases: ['未知'] })
      .expect(400);

    await request(httpServer)
      .put('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .send({ aliases: [] })
      .expect(400);

    await request(httpServer)
      .put('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .send({ aliases: ['   '] })
      .expect(400);

    await request(httpServer)
      .put('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .send({ aliases: ['项目唯一编号', ' 项目唯一编号 '] })
      .expect(400);

    await request(httpServer)
      .put('/admin/project-import-field-mappings/name')
      .set('Cookie', adminCookie)
      .send({ aliases: ['本地项目名称'], isActive: false })
      .expect(200);

    await request(httpServer)
      .put('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .send({ aliases: ['本地项目名称'] })
      .expect(409);
  });

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }

  async function createUser(input: {
    phone: string;
    name: string;
    roles: string[];
  }): Promise<string> {
    const userId = new Types.ObjectId();

    await userModel.create({
      _id: userId,
      phone: input.phone,
      passwordHash: await hash('correct-password', 4),
      name: input.name,
      roles: input.roles,
      status: 'active',
      isActive: true,
      mustChangePassword: false,
    });

    return userId.toString();
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

function findField(
  items: Record<string, unknown>[],
  standardField: string,
): Record<string, unknown> {
  const item = items.find((candidate) => {
    return candidate.standardField === standardField;
  });

  if (!item) {
    throw new Error(`${standardField} not found`);
  }

  return item;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

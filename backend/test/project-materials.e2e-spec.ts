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
import { ProjectExpertAssignment } from '../src/modules/project-expert-assignments/schemas/project-expert-assignment.schema';
import { ProjectMaterial } from '../src/modules/project-materials/schemas/project-material.schema';
import { Project } from '../src/modules/projects/schemas/project.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';
process.env.STORAGE_DRIVER = 'fake';

jest.setTimeout(30000);

type SeedData = {
  admin: TestUser;
  client: TestUser;
  owner: TestUser;
  otherOwner: TestUser;
  reviewManager: TestUser;
  otherReviewManager: TestUser;
  expert: TestUser;
  unassignedExpert: TestUser;
  removedExpert: TestUser;
  batchId: string;
  statusId: string;
  materialTypeId: string;
  otherMaterialTypeId: string;
  wrongTypeId: string;
  project: { id: string };
  otherProject: { id: string };
};

type TestUser = {
  id: string;
  phone: string;
};

describe('Project owner materials and visibility APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let batchModel: Model<Batch>;
  let dictionaryModel: Model<Dictionary>;
  let organizationModel: Model<Organization>;
  let projectModel: Model<Project>;
  let assignmentModel: Model<ProjectExpertAssignment>;
  let materialModel: Model<ProjectMaterial>;
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
    batchModel = app.get<Model<Batch>>(getModelToken(Batch.name));
    dictionaryModel = app.get<Model<Dictionary>>(
      getModelToken(Dictionary.name),
    );
    organizationModel = app.get<Model<Organization>>(
      getModelToken(Organization.name),
    );
    projectModel = app.get<Model<Project>>(getModelToken(Project.name));
    assignmentModel = app.get<Model<ProjectExpertAssignment>>(
      getModelToken(ProjectExpertAssignment.name),
    );
    materialModel = app.get<Model<ProjectMaterial>>(
      getModelToken(ProjectMaterial.name),
    );
    models = [
      userModel,
      sessionModel,
      batchModel,
      dictionaryModel,
      organizationModel,
      projectModel,
      assignmentModel,
      materialModel,
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

  it('enforces project-owner permissions and updates only followUpNeeds', async () => {
    const data = await seedData();
    const clientCookie = await login(data.client.phone);
    const ownerCookie = await login(data.owner.phone);
    const otherOwnerCookie = await login(data.otherOwner.phone);

    await request(httpServer).get('/project-owner/projects').expect(401);

    await request(httpServer)
      .get('/project-owner/projects')
      .set('Cookie', clientCookie)
      .expect(403);

    const listResponse = await request(httpServer)
      .get('/project-owner/projects')
      .query({ page: 1, pageSize: 1000, statusId: data.statusId })
      .set('Cookie', ownerCookie)
      .expect(200);
    const listBody = getJsonBody(listResponse);
    expect(listBody).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 1000,
    });
    expect(getRecordArray(listBody, 'items')[0]).toMatchObject({
      id: data.project.id,
      reviewLocation: 'Room A',
      meetingUrl: 'https://meeting.example/room-a',
      followUpNeeds: 'Initial needs',
      materialCount: 0,
    });

    await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}`)
      .set('Cookie', otherOwnerCookie)
      .expect(403);

    const updateResponse = await request(httpServer)
      .patch(`/project-owner/projects/${data.project.id}/follow-up-needs`)
      .set('Cookie', ownerCookie)
      .send({
        followUpNeeds: '  Need follow-up funding and pilot support.  ',
      })
      .expect(200);
    expect(getJsonBody(updateResponse)).toMatchObject({
      followUpNeeds: 'Need follow-up funding and pilot support.',
      reviewLocation: 'Room A',
    });

    const storedProject = await projectModel
      .findById(data.project.id)
      .lean<Project | null>()
      .exec();
    expect(storedProject).toMatchObject({
      followUpNeeds: 'Need follow-up funding and pilot support.',
      reviewLocation: 'Room A',
    });

    const clearResponse = await request(httpServer)
      .patch(`/project-owner/projects/${data.project.id}/follow-up-needs`)
      .set('Cookie', ownerCookie)
      .send({ followUpNeeds: '' })
      .expect(200);
    expect(getJsonBody(clearResponse)).toMatchObject({ followUpNeeds: '' });
  });

  it('uses fake storage for upload, validates files and material types, lists, signs, and soft deletes materials', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);
    const otherOwnerCookie = await login(data.otherOwner.phone);

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/materials`)
      .set('Cookie', otherOwnerCookie)
      .field('materialTypeId', data.materialTypeId)
      .attach('files', Buffer.from('content'), 'report.pdf')
      .expect(403);

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/materials`)
      .set('Cookie', ownerCookie)
      .field('materialTypeId', data.wrongTypeId)
      .attach('files', Buffer.from('content'), 'report.pdf')
      .expect(400);

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/materials`)
      .set('Cookie', ownerCookie)
      .field('materialTypeId', data.materialTypeId)
      .attach('files', Buffer.from('bad'), 'run.exe')
      .expect(400);

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/materials`)
      .set('Cookie', ownerCookie)
      .field('materialTypeId', data.materialTypeId)
      .attach('files', Buffer.alloc(0), 'empty.pdf')
      .expect(400);

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/materials`)
      .set('Cookie', ownerCookie)
      .field('materialTypeId', data.materialTypeId)
      .expect(400);

    const uploadResponse = await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/materials`)
      .set('Cookie', ownerCookie)
      .field('materialTypeId', data.materialTypeId)
      .field('remark', '  first upload  ')
      .attach('files', Buffer.from('ppt-content'), 'report.pptx')
      .attach('files', Buffer.from('pdf-content'), 'proof.pdf')
      .expect(201);
    const uploadBody = getJsonBody(uploadResponse);
    expect(uploadBody).toMatchObject({
      successCount: 2,
      failedCount: 0,
      failures: [],
    });
    const materials = getRecordArray(uploadBody, 'materials');
    expect(materials).toHaveLength(2);
    expect(materials[0]).toMatchObject({
      projectId: data.project.id,
      materialTypeId: data.materialTypeId,
      uploadedByUserId: data.owner.id,
      storageDriver: 'fake',
      remark: 'first upload',
      status: 'active',
    });
    expect(getString(materials[0], 'objectKey')).toContain(
      `/projects/${data.project.id}/materials/ppt/`,
    );
    expect(getString(materials[0], 'sha256')).toHaveLength(64);

    const storedMaterial = await materialModel
      .findById(getString(materials[0], 'id'))
      .lean<Record<string, unknown> | null>()
      .exec();
    expect(storedMaterial).toMatchObject({
      objectKey: getString(materials[0], 'objectKey'),
      sizeBytes: materials[0].sizeBytes,
    });
    expect(storedMaterial).not.toHaveProperty('buffer');
    expect(storedMaterial).not.toHaveProperty('file');

    const ownerListResponse = await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/materials`)
      .query({ materialTypeId: data.materialTypeId })
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonArray(ownerListResponse)).toHaveLength(2);

    const ownerProjectResponse = await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}`)
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonBody(ownerProjectResponse)).toMatchObject({
      materialCount: 2,
    });

    const materialId = getString(materials[0], 'id');
    const urlResponse = await request(httpServer)
      .get(
        `/project-owner/projects/${data.project.id}/materials/${materialId}/download-url`,
      )
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getString(getJsonBody(urlResponse), 'url')).toContain(
      'https://fake-storage.local/',
    );
    expect(
      new Date(getString(getJsonBody(urlResponse), 'expiresAt')).getTime(),
    ).toBeGreaterThan(Date.now());

    const deleteResponse = await request(httpServer)
      .delete(
        `/project-owner/projects/${data.project.id}/materials/${materialId}`,
      )
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonBody(deleteResponse)).toMatchObject({
      deleted: true,
      alreadyDeleted: false,
    });

    await request(httpServer)
      .delete(
        `/project-owner/projects/${data.project.id}/materials/${materialId}`,
      )
      .set('Cookie', ownerCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          deleted: false,
          alreadyDeleted: true,
        });
      });

    const afterDeleteListResponse = await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/materials`)
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonArray(afterDeleteListResponse)).toHaveLength(1);

    await request(httpServer)
      .get(
        `/project-owner/projects/${data.project.id}/materials/${materialId}/download-url`,
      )
      .set('Cookie', ownerCookie)
      .expect(404);

    const deletedMaterial = await materialModel
      .findById(materialId)
      .lean<ProjectMaterial | null>()
      .exec();
    expect(deletedMaterial).toMatchObject({
      status: 'deleted',
      deletedByUserId: new Types.ObjectId(data.owner.id),
    });
    expect(deletedMaterial?.deletedAt).toBeTruthy();
  });

  it('exposes materials to project review managers, assigned experts, and admins only', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const otherManagerCookie = await login(data.otherReviewManager.phone);
    const expertCookie = await login(data.expert.phone);
    const unassignedExpertCookie = await login(data.unassignedExpert.phone);
    const removedExpertCookie = await login(data.removedExpert.phone);
    const adminCookie = await login(data.admin.phone);
    const clientCookie = await login(data.client.phone);
    const upload = await uploadMaterial(
      ownerCookie,
      data.project.id,
      data.materialTypeId,
      'visibility.pdf',
    );
    const materialId = getString(getRecordArray(upload, 'materials')[0], 'id');

    await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/materials`)
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(1);
      });

    await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/materials`)
      .set('Cookie', otherManagerCookie)
      .expect(403);

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/materials`)
      .set('Cookie', managerCookie)
      .field('materialTypeId', data.materialTypeId)
      .attach('files', Buffer.from('content'), 'not-allowed.pdf')
      .expect(404);

    await request(httpServer)
      .get(
        `/review-manager/projects/${data.project.id}/materials/${materialId}/download-url`,
      )
      .set('Cookie', managerCookie)
      .expect(200);

    const expertProjectsResponse = await request(httpServer)
      .get('/expert/projects')
      .set('Cookie', expertCookie)
      .expect(200);
    expect(getJsonBody(expertProjectsResponse)).toMatchObject({ total: 1 });
    expect(
      getRecordArray(getJsonBody(expertProjectsResponse), 'items')[0],
    ).toMatchObject({
      id: data.project.id,
      materialCount: 1,
      followUpNeeds: 'Initial needs',
    });

    await request(httpServer)
      .get(`/expert/projects/${data.project.id}`)
      .set('Cookie', expertCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: data.project.id,
          followUpNeeds: 'Initial needs',
          materialCount: 1,
        });
      });

    await request(httpServer)
      .get(`/expert/projects/${data.project.id}/materials`)
      .set('Cookie', expertCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(1);
      });

    await request(httpServer)
      .get(
        `/expert/projects/${data.project.id}/materials/${materialId}/download-url`,
      )
      .set('Cookie', expertCookie)
      .expect(200);

    await request(httpServer)
      .get(`/expert/projects/${data.project.id}`)
      .set('Cookie', unassignedExpertCookie)
      .expect(403);

    await request(httpServer)
      .get(`/expert/projects/${data.project.id}/materials`)
      .set('Cookie', removedExpertCookie)
      .expect(403);

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/materials`)
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(1);
      });

    await request(httpServer)
      .get(
        `/admin/projects/${data.project.id}/materials/${materialId}/download-url`,
      )
      .set('Cookie', adminCookie)
      .expect(200);

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/materials`)
      .set('Cookie', clientCookie)
      .expect(403);
  });

  it('keeps existing list contracts available', async () => {
    const data = await seedData();
    const adminCookie = await login(data.admin.phone);
    const managerCookie = await login(data.reviewManager.phone);

    const dictionariesResponse = await request(httpServer)
      .get('/admin/dictionaries')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(Array.isArray(dictionariesResponse.body)).toBe(true);

    const projectsResponse = await request(httpServer)
      .get('/admin/projects')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(projectsResponse)).toMatchObject({
      page: 1,
      pageSize: 100,
      total: 2,
    });

    const managerProjectsResponse = await request(httpServer)
      .get('/review-manager/projects')
      .set('Cookie', managerCookie)
      .expect(200);
    expect(getJsonBody(managerProjectsResponse)).toMatchObject({
      page: 1,
      pageSize: 100,
      total: 1,
    });
  });

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }

  async function seedData(): Promise<SeedData> {
    const admin = await createUser('+8613820000001', ['admin']);
    const client = await createUser('+8613820000002', ['client']);
    const owner = await createUser('+8613820000003', ['project_owner']);
    const otherOwner = await createUser('+8613820000004', ['project_owner']);
    const reviewManager = await createUser('+8613820000005', [
      'review_manager',
    ]);
    const otherReviewManager = await createUser('+8613820000006', [
      'review_manager',
    ]);
    const expert = await createUser('+8613820000007', ['expert']);
    const unassignedExpert = await createUser('+8613820000008', ['expert']);
    const removedExpert = await createUser('+8613820000009', ['expert']);
    const batch = await batchModel.create({
      name: '2026',
      year: 2026,
      isActive: true,
    });
    const status = await dictionaryModel.create({
      dictType: 'project_status',
      code: 'in_progress',
      name: '实施中',
      sortOrder: 0,
      isActive: true,
    });
    const materialType = await dictionaryModel.create({
      dictType: 'material_type',
      code: 'ppt',
      name: '汇报 PPT',
      sortOrder: 1,
      isActive: true,
    });
    const otherMaterialType = await dictionaryModel.create({
      dictType: 'material_type',
      code: 'proof',
      name: '证明材料',
      sortOrder: 2,
      isActive: true,
    });
    const wrongType = await dictionaryModel.create({
      dictType: 'project_status',
      code: 'wrong',
      name: '错误类型',
      sortOrder: 9,
      isActive: true,
    });
    const organization = await organizationModel.create({
      name: 'Lead Org',
      isActive: true,
    });
    const project = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-MAT-001',
      name: 'Material Project',
      statusId: status._id,
      ownerUserId: new Types.ObjectId(owner.id),
      leadOrganizationId: organization._id,
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      reviewTime: new Date('2026-08-01T09:00:00.000Z'),
      reviewLocation: 'Room A',
      meetingUrl: 'https://meeting.example/room-a',
      followUpNeeds: 'Initial needs',
      isActive: true,
    });
    const otherProject = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-MAT-002',
      name: 'Other Owner Project',
      statusId: status._id,
      ownerUserId: new Types.ObjectId(otherOwner.id),
      reviewManagerId: new Types.ObjectId(otherReviewManager.id),
      isActive: true,
    });

    await assignmentModel.create({
      projectId: project._id,
      expertUserId: new Types.ObjectId(expert.id),
      assignedByUserId: new Types.ObjectId(reviewManager.id),
      source: 'manual',
      status: 'assigned',
    });
    await assignmentModel.create({
      projectId: project._id,
      expertUserId: new Types.ObjectId(removedExpert.id),
      assignedByUserId: new Types.ObjectId(reviewManager.id),
      source: 'manual',
      status: 'removed',
      removedAt: new Date(),
      removedByUserId: new Types.ObjectId(reviewManager.id),
    });

    return {
      admin,
      client,
      owner,
      otherOwner,
      reviewManager,
      otherReviewManager,
      expert,
      unassignedExpert,
      removedExpert,
      batchId: batch._id.toString(),
      statusId: status._id.toString(),
      materialTypeId: materialType._id.toString(),
      otherMaterialTypeId: otherMaterialType._id.toString(),
      wrongTypeId: wrongType._id.toString(),
      project: { id: project._id.toString() },
      otherProject: { id: otherProject._id.toString() },
    };
  }

  async function createUser(phone: string, roles: string[]): Promise<TestUser> {
    const userId = new Types.ObjectId();

    await userModel.create({
      _id: userId,
      phone,
      passwordHash: await hash('correct-password', 4),
      name: `User ${phone.slice(-4)}`,
      roles,
      status: 'active',
      isActive: true,
      mustChangePassword: false,
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

  async function uploadMaterial(
    cookie: string,
    projectId: string,
    materialTypeId: string,
    filename: string,
  ): Promise<Record<string, unknown>> {
    const response = await request(httpServer)
      .post(`/project-owner/projects/${projectId}/materials`)
      .set('Cookie', cookie)
      .field('materialTypeId', materialTypeId)
      .attach('files', Buffer.from('visible-content'), filename)
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

function getString(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

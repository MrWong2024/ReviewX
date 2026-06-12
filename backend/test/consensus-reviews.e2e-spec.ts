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
import { ConsensusReview } from '../src/modules/consensus-reviews/schemas/consensus-review.schema';
import { Dictionary } from '../src/modules/dictionaries/schemas/dictionary.schema';
import { ExpertReview } from '../src/modules/expert-reviews/schemas/expert-review.schema';
import { ProjectExpertAssignment } from '../src/modules/project-expert-assignments/schemas/project-expert-assignment.schema';
import { ProjectMaterial } from '../src/modules/project-materials/schemas/project-material.schema';
import { Project } from '../src/modules/projects/schemas/project.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';
process.env.STORAGE_DRIVER = 'fake';

jest.setTimeout(30000);

describe('Consensus review APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let batchModel: Model<Batch>;
  let dictionaryModel: Model<Dictionary>;
  let projectModel: Model<Project>;
  let assignmentModel: Model<ProjectExpertAssignment>;
  let expertReviewModel: Model<ExpertReview>;
  let consensusReviewModel: Model<ConsensusReview>;
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
    projectModel = app.get<Model<Project>>(getModelToken(Project.name));
    assignmentModel = app.get<Model<ProjectExpertAssignment>>(
      getModelToken(ProjectExpertAssignment.name),
    );
    expertReviewModel = app.get<Model<ExpertReview>>(
      getModelToken(ExpertReview.name),
    );
    consensusReviewModel = app.get<Model<ConsensusReview>>(
      getModelToken(ConsensusReview.name),
    );
    materialModel = app.get<Model<ProjectMaterial>>(
      getModelToken(ProjectMaterial.name),
    );
    models = [
      userModel,
      sessionModel,
      batchModel,
      dictionaryModel,
      projectModel,
      assignmentModel,
      expertReviewModel,
      consensusReviewModel,
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

  it('generates rule-based drafts and blocks overwrite without force', async () => {
    const data = await seedData();
    const managerCookie = await login(data.reviewManager.phone);
    const otherManagerCookie = await login(data.otherReviewManager.phone);

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .set('Cookie', otherManagerCookie)
      .expect(403);

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .set('Cookie', managerCookie)
      .expect(409);

    await seedSubmittedReview(data);

    const draftResponse = await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .set('Cookie', managerCookie)
      .expect(201);
    expect(getJsonBody(draftResponse)).toMatchObject({
      status: 'draft',
      draftSource: 'rule_based',
      draftScore: 75,
    });
    expect(getString(getJsonBody(draftResponse), 'draftOpinion')).toContain(
      '重大问题提示',
    );

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .set('Cookie', managerCookie)
      .expect(409);

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .query({ force: 'true' })
      .set('Cookie', managerCookie)
      .expect(201);
  });

  it('confirms consensus, validates levels, and exposes admin fallback view', async () => {
    const data = await seedData();
    await seedSubmittedReview(data);
    const managerCookie = await login(data.reviewManager.phone);
    const adminCookie = await login(data.admin.phone);

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/confirm`)
      .set('Cookie', managerCookie)
      .send({
        finalOpinion: '同意通过',
        finalScore: 120,
        finalLevel: 'A',
      })
      .expect(400);

    const confirmResponse = await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/confirm`)
      .set('Cookie', managerCookie)
      .send({
        finalOpinion: '同意通过',
        finalScore: 82,
        finalLevel: 'A',
      })
      .expect(201);
    expect(getJsonBody(confirmResponse)).toMatchObject({
      status: 'confirmed',
      finalLevel: 'A',
      originalLevel: 'A',
    });

    const project = await projectModel
      .findById(data.project.id)
      .lean<Project | null>()
      .exec();
    expect(project).toMatchObject({ finalLevel: 'A', originalLevel: 'A' });

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .query({ force: 'true' })
      .set('Cookie', managerCookie)
      .expect(409);

    await dictionaryModel.create({
      dictType: 'review_level',
      code: 'excellent',
      name: '优秀',
      sortOrder: 1,
      isActive: true,
    });

    await request(httpServer)
      .post(`/admin/projects/${data.project.id}/consensus/confirm`)
      .set('Cookie', adminCookie)
      .send({
        finalOpinion: '管理员修正',
        finalScore: 85,
        finalLevel: 'A',
      })
      .expect(400);

    await request(httpServer)
      .post(`/admin/projects/${data.project.id}/consensus/confirm`)
      .set('Cookie', adminCookie)
      .send({
        finalOpinion: '管理员修正',
        finalScore: 85,
        finalLevel: 'excellent',
      })
      .expect(201);

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/consensus`)
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'confirmed',
          finalLevel: 'excellent',
          originalLevel: 'A',
        });
      });
  });

  async function seedData() {
    const admin = await createUser('+8613840000001', ['admin']);
    const reviewManager = await createUser('+8613840000002', [
      'review_manager',
    ]);
    const otherReviewManager = await createUser('+8613840000003', [
      'review_manager',
    ]);
    const expert = await createUser('+8613840000004', ['expert']);
    const batch = await batchModel.create({ name: '2026', year: 2026 });
    const reviewSchemeSnapshot = {
      id: new Types.ObjectId().toString(),
      name: '合议方案',
      totalScore: 100,
      items: [
        {
          name: '技术',
          maxScore: 60,
          scoringGuide: '技术评分',
          sortOrder: 1,
          suggestionRequiredThresholdRatio: 0.8,
        },
        {
          name: '财务',
          maxScore: 40,
          scoringGuide: '财务评分',
          sortOrder: 2,
          suggestionRequiredThresholdRatio: 0.8,
        },
      ],
    };
    const project = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-CONS-001',
      name: '合议项目',
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      reviewSchemeId: new Types.ObjectId(reviewSchemeSnapshot.id),
      reviewSchemeSnapshot,
      isActive: true,
    });
    const assignment = await assignmentModel.create({
      projectId: project._id,
      expertUserId: new Types.ObjectId(expert.id),
      assignedByUserId: new Types.ObjectId(reviewManager.id),
      status: 'assigned',
    });

    return {
      admin,
      reviewManager,
      otherReviewManager,
      expert,
      project: { id: project._id.toString() },
      assignmentId: assignment._id.toString(),
      reviewSchemeSnapshot,
    };
  }

  async function seedSubmittedReview(
    data: Awaited<ReturnType<typeof seedData>>,
  ) {
    await expertReviewModel.create({
      projectId: new Types.ObjectId(data.project.id),
      expertUserId: new Types.ObjectId(data.expert.id),
      assignmentId: new Types.ObjectId(data.assignmentId),
      reviewSchemeSnapshot: data.reviewSchemeSnapshot,
      items: [
        {
          itemSnapshot: data.reviewSchemeSnapshot.items[0],
          score: 35,
          evaluationDescription: '技术路线有成效但存在短板',
          improvementSuggestion: '补充中试验证',
          hasMajorIssue: true,
        },
        {
          itemSnapshot: data.reviewSchemeSnapshot.items[1],
          score: 40,
          evaluationDescription: '经费使用合理',
          improvementSuggestion: '',
          hasMajorIssue: false,
        },
      ],
      totalScore: 75,
      status: 'submitted',
      submittedAt: new Date(),
    });
  }

  async function createUser(phone: string, roles: string[]) {
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
      .send({ phone, password: 'correct-password' })
      .expect(200);

    return toRequestCookie(getSessionCookie(response));
  }

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

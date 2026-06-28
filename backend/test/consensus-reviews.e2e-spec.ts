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
import {
  CONSENSUS_ALREADY_CONFIRMED_CODE,
  CONSENSUS_ALREADY_CONFIRMED_MESSAGE,
  CONSENSUS_DRAFT_COOLDOWN_CODE,
  CONSENSUS_DRAFT_COOLDOWN_MESSAGE,
} from '../src/modules/consensus-reviews/constants/consensus-review.constants';
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
process.env.LLM_PROVIDER = 'stub';
process.env.CONSENSUS_DRAFT_COOLDOWN_SECONDS = '60';
delete process.env.BAILIAN_API_KEY;

jest.setTimeout(30000);

const originalFetch = globalThis.fetch;

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
    resetLlmEnv();
    globalThis.fetch = originalFetch;
    await clearCollections();
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    await clearCollections();
    await connection.close();
    await app.close();
  });

  it('falls back to rule-based drafts without Bailian API key and blocks overwrite without force', async () => {
    process.env.LLM_PROVIDER = 'bailian';
    process.env.BAILIAN_MODEL = 'qwen-test';
    process.env.BAILIAN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    process.env.CONSENSUS_DRAFT_COOLDOWN_SECONDS = '0';
    delete process.env.BAILIAN_API_KEY;
    const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
    globalThis.fetch = fetchMock;
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
    expect(fetchMock).not.toHaveBeenCalled();

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

  it('generates AI draft with mocked Bailian-compatible chat response', async () => {
    process.env.LLM_PROVIDER = 'bailian';
    process.env.BAILIAN_API_KEY = 'test-bailian-key';
    process.env.BAILIAN_BASE_URL =
      'https://dashscope.aliyuncs.com/compatible-mode/v1';
    process.env.BAILIAN_MODEL = 'qwen-test';
    process.env.BAILIAN_MAX_RETRIES = '0';
    process.env.CONSENSUS_DRAFT_COOLDOWN_SECONDS = '0';
    const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
    fetchMock.mockResolvedValue(
      new globalThis.Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  draftOpinion: 'AI 汇总意见：项目基础较好，需补充验证。',
                  draftScore: 81,
                }),
              },
            },
          ],
        }),
        {
          headers: { 'content-type': 'application/json' },
          status: 200,
        },
      ),
    );
    globalThis.fetch = fetchMock;
    const data = await seedData();
    await seedSubmittedReview(data);
    const managerCookie = await login(data.reviewManager.phone);

    const draftResponse = await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .set('Cookie', managerCookie)
      .expect(201);

    expect(getJsonBody(draftResponse)).toMatchObject({
      status: 'draft',
      draftSource: 'ai',
      draftOpinion: 'AI 汇总意见：项目基础较好，需补充验证。',
      draftScore: 81,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns cooldown error with remaining seconds for forced regeneration', async () => {
    const data = await seedData();
    await seedSubmittedReview(data);
    const managerCookie = await login(data.reviewManager.phone);

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .set('Cookie', managerCookie)
      .expect(201);

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .query({ force: 'true' })
      .set('Cookie', managerCookie)
      .expect(429)
      .expect((response) => {
        const body = getJsonBody(response);
        expect(body).toMatchObject({
          code: CONSENSUS_DRAFT_COOLDOWN_CODE,
          message: CONSENSUS_DRAFT_COOLDOWN_MESSAGE,
        });
        expect(getNumber(body, 'remainingSeconds')).toBeGreaterThan(0);
      });
  });

  it('confirms draft consensus, blocks confirmed overwrite, and exposes admin fallback view', async () => {
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

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .set('Cookie', managerCookie)
      .expect(201);

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
      confirmedByUserId: data.reviewManager.id,
      confirmedByUser: {
        id: data.reviewManager.id,
        name: data.reviewManager.name,
        phone: data.reviewManager.phone,
      },
    });

    const project = await projectModel
      .findById(data.project.id)
      .lean<Project | null>()
      .exec();
    expect(project).toMatchObject({ finalLevel: 'A', originalLevel: 'A' });

    const consensusBeforeRepeat = await consensusReviewModel
      .findOne({ projectId: new Types.ObjectId(data.project.id) })
      .lean<{
        confirmedAt?: Date | null;
        confirmedByUserId?: Types.ObjectId | null;
        finalLevel?: string;
        finalOpinion?: string;
        finalScore?: number | null;
      } | null>()
      .exec();
    expect(consensusBeforeRepeat).toMatchObject({
      finalOpinion: '同意通过',
      finalScore: 82,
      finalLevel: 'A',
    });
    const confirmedByUserIdBefore =
      consensusBeforeRepeat?.confirmedByUserId?.toString();
    const confirmedAtBefore = consensusBeforeRepeat?.confirmedAt?.toISOString();

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/draft`)
      .query({ force: 'true' })
      .set('Cookie', managerCookie)
      .expect(409);

    const repeatConfirmResponse = await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/consensus/confirm`)
      .set('Cookie', managerCookie)
      .send({
        finalOpinion: '尝试覆盖',
        finalScore: 66,
        finalLevel: 'B',
      })
      .expect(409);
    expect(getJsonBody(repeatConfirmResponse)).toMatchObject({
      code: CONSENSUS_ALREADY_CONFIRMED_CODE,
      message: CONSENSUS_ALREADY_CONFIRMED_MESSAGE,
    });

    const consensusAfterRepeat = await consensusReviewModel
      .findOne({ projectId: new Types.ObjectId(data.project.id) })
      .lean<{
        confirmedAt?: Date | null;
        confirmedByUserId?: Types.ObjectId | null;
        finalLevel?: string;
        finalOpinion?: string;
        finalScore?: number | null;
      } | null>()
      .exec();
    expect(consensusAfterRepeat).toMatchObject({
      finalOpinion: '同意通过',
      finalScore: 82,
      finalLevel: 'A',
    });
    expect(consensusAfterRepeat?.confirmedByUserId?.toString()).toBe(
      confirmedByUserIdBefore,
    );
    expect(consensusAfterRepeat?.confirmedAt?.toISOString()).toBe(
      confirmedAtBefore,
    );

    const projectAfterRepeat = await projectModel
      .findById(data.project.id)
      .lean<Project | null>()
      .exec();
    expect(projectAfterRepeat).toMatchObject({
      finalLevel: 'A',
      originalLevel: 'A',
    });

    await dictionaryModel.create({
      dictType: 'review_level',
      code: 'excellent',
      name: '优秀',
      sortOrder: 1,
      isActive: true,
    });

    const adminRepeatConfirmResponse = await request(httpServer)
      .post(`/admin/projects/${data.project.id}/consensus/confirm`)
      .set('Cookie', adminCookie)
      .send({
        finalOpinion: '管理员修正',
        finalScore: 85,
        finalLevel: 'excellent',
      })
      .expect(409);
    expect(getJsonBody(adminRepeatConfirmResponse)).toMatchObject({
      code: CONSENSUS_ALREADY_CONFIRMED_CODE,
      message: CONSENSUS_ALREADY_CONFIRMED_MESSAGE,
    });

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/consensus`)
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'confirmed',
          finalLevel: 'A',
          originalLevel: 'A',
          confirmedByUserId: data.reviewManager.id,
          confirmedByUser: {
            id: data.reviewManager.id,
            name: data.reviewManager.name,
            phone: data.reviewManager.phone,
          },
        });
      });
  });

  it('keeps consensus readable when confirmed user cannot be resolved', async () => {
    const data = await seedData();
    const managerCookie = await login(data.reviewManager.phone);
    const missingUserId = new Types.ObjectId();

    await consensusReviewModel.create({
      projectId: new Types.ObjectId(data.project.id),
      reviewSchemeSnapshot: data.reviewSchemeSnapshot,
      draftGeneratedAt: new Date(),
      draftGeneratedByUserId: new Types.ObjectId(data.reviewManager.id),
      draftSource: 'manual',
      draftOpinion: '草稿意见',
      draftScore: 80,
      finalOpinion: '同意通过',
      finalScore: 82,
      finalLevel: 'A',
      originalLevel: 'A',
      confirmedByUserId: missingUserId,
      confirmedAt: new Date(),
      status: 'confirmed',
      expertReviewStats: {
        expertCount: 1,
        submittedCount: 1,
        averageScore: 82,
        minScore: 82,
        maxScore: 82,
      },
    });

    const response = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/consensus`)
      .set('Cookie', managerCookie)
      .expect(200);

    expect(getJsonBody(response)).toMatchObject({
      status: 'confirmed',
      confirmedByUserId: missingUserId.toString(),
      confirmedByUser: null,
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
    const name = `User ${phone.slice(-4)}`;

    await userModel.create({
      _id: userId,
      phone,
      passwordHash: await hash('correct-password', 4),
      name,
      roles,
      status: 'active',
      isActive: true,
      mustChangePassword: false,
    });

    return { id: userId.toString(), name, phone };
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

function resetLlmEnv(): void {
  process.env.LLM_PROVIDER = 'stub';
  process.env.CONSENSUS_DRAFT_COOLDOWN_SECONDS = '60';
  delete process.env.BAILIAN_API_KEY;
  delete process.env.BAILIAN_BASE_URL;
  delete process.env.BAILIAN_MODEL;
  delete process.env.BAILIAN_TIMEOUT_MS;
  delete process.env.BAILIAN_MAX_RETRIES;
}

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

function getNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];

  if (typeof value !== 'number') {
    throw new Error(`${key} must be a number`);
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

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
import type { ExpertReviewStatus } from '../src/modules/expert-reviews/constants/expert-review.constants';
import { ExpertReview } from '../src/modules/expert-reviews/schemas/expert-review.schema';
import { ProjectExpertAssignment } from '../src/modules/project-expert-assignments/schemas/project-expert-assignment.schema';
import { ProjectMaterial } from '../src/modules/project-materials/schemas/project-material.schema';
import { Project } from '../src/modules/projects/schemas/project.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';
process.env.STORAGE_DRIVER = 'fake';

jest.setTimeout(30000);

type TestUser = {
  id: string;
  name: string;
  phone: string;
};

describe('Expert review APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let batchModel: Model<Batch>;
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

  it('enforces permissions and exposes only assigned review tasks', async () => {
    const data = await seedData();
    const clientCookie = await login(data.client.phone);
    const expertCookie = await login(data.expert.phone);
    const unassignedExpertCookie = await login(data.unassignedExpert.phone);
    const removedExpertCookie = await login(data.removedExpert.phone);

    await request(httpServer).get('/expert/review-tasks').expect(401);

    await request(httpServer)
      .get('/expert/review-tasks')
      .set('Cookie', clientCookie)
      .expect(403);

    const listResponse = await request(httpServer)
      .get('/expert/review-tasks')
      .query({
        pageSize: 1000,
        batchId: data.batchId,
        reviewSchemeId: data.reviewSchemeId,
      })
      .set('Cookie', expertCookie)
      .expect(200);
    expect(getJsonBody(listResponse)).toMatchObject({
      total: 1,
      pageSize: 1000,
    });
    const listItem = getRecordArray(getJsonBody(listResponse), 'items')[0];
    expect(listItem).toMatchObject({
      status: 'not_started',
      materialCount: 0,
      project: {
        reviewManagerId: data.reviewManager.id,
        reviewManager: {
          id: data.reviewManager.id,
          name: data.reviewManager.name,
          phone: data.reviewManager.phone,
        },
      },
    });
    expectResponseHasNoForbiddenFields(listItem);

    const detailResponse = await request(httpServer)
      .get(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .expect(200);
    expect(getJsonBody(detailResponse)).toMatchObject({
      project: {
        reviewManagerId: data.reviewManager.id,
        reviewManager: {
          id: data.reviewManager.id,
          name: data.reviewManager.name,
          phone: data.reviewManager.phone,
        },
      },
    });
    expectResponseHasNoForbiddenFields(getJsonBody(detailResponse));

    const missingManagerListResponse = await request(httpServer)
      .get('/expert/review-tasks')
      .query({
        pageSize: 1000,
        batchId: data.missingManagerBatchId,
      })
      .set('Cookie', expertCookie)
      .expect(200);
    expect(
      getRecordArray(getJsonBody(missingManagerListResponse), 'items')[0],
    ).toMatchObject({
      project: {
        id: data.missingManagerProject.id,
        reviewManagerId: data.missingReviewManagerId,
        reviewManager: null,
      },
    });

    const missingManagerDetailResponse = await request(httpServer)
      .get(`/expert/review-tasks/${data.missingManagerProject.id}`)
      .set('Cookie', expertCookie)
      .expect(200);
    expect(getJsonBody(missingManagerDetailResponse)).toMatchObject({
      project: {
        id: data.missingManagerProject.id,
        reviewManagerId: data.missingReviewManagerId,
        reviewManager: null,
      },
    });

    await request(httpServer)
      .get(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', unassignedExpertCookie)
      .expect(403);

    await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', removedExpertCookie)
      .send({ items: [] })
      .expect(403);

    await request(httpServer)
      .get(`/expert/review-tasks/${data.noSnapshotProject.id}`)
      .set('Cookie', expertCookie)
      .expect(409);
  });

  it('saves drafts, validates submission, blocks submitted edits, returns and resubmits', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const otherManagerCookie = await login(data.otherReviewManager.phone);

    await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .send({ items: [{ name: '技术', score: 70 }] })
      .expect(400);

    const draftResponse = await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 50,
            evaluationDescription: '阶段性成果较好',
          },
          { name: '财务', score: 40 },
        ],
      })
      .expect(200);
    expect(getJsonBody(draftResponse)).toMatchObject({
      status: 'draft',
      totalScore: 90,
    });

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 40,
            evaluationDescription: '存在问题',
          },
          {
            name: '财务',
            score: 40,
            evaluationDescription: '预算合理',
          },
        ],
      })
      .expect(400);

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 40,
            evaluationDescription: '存在问题',
            improvementSuggestion: '补充关键技术验证',
            hasMajorIssue: true,
          },
          {
            name: '财务',
            score: 40,
            evaluationDescription: '预算合理',
          },
        ],
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'submitted',
          totalScore: 80,
        });
      });

    await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .send({ items: [{ name: '技术', score: 55 }] })
      .expect(409);

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send({ items: [] })
      .expect(409);

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/expert-reviews/${data.expert.id}/return`,
      )
      .set('Cookie', otherManagerCookie)
      .send({ returnReason: '需要重评' })
      .expect(403);

    const returnResponse = await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/expert-reviews/${data.expert.id}/return`,
      )
      .set('Cookie', managerCookie)
      .send({ returnReason: '请补充说明' })
      .expect(201);
    expect(getJsonBody(returnResponse)).toMatchObject({
      status: 'returned',
      returnReason: '请补充说明',
    });

    await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .send({ items: [{ name: '技术', score: 55 }] })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'draft',
          totalScore: 95,
        });
      });

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 55,
            evaluationDescription: '已补充验证',
          },
          {
            name: '财务',
            score: 40,
            evaluationDescription: '预算合理',
          },
        ],
      })
      .expect(201);
  });

  it('deletes draft reviews and returns task detail to not_started', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);

    await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 50,
            evaluationDescription: '阶段性成果较好',
          },
          { name: '财务', score: 35 },
        ],
      })
      .expect(200);

    const savedReview = await findReview(data.project.id, data.expert.id);
    expect(savedReview).toMatchObject({ status: 'draft' });

    await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', expertCookie)
      .expect(204);

    await expect(
      findReview(data.project.id, data.expert.id),
    ).resolves.toBeNull();

    const detailResponse = await request(httpServer)
      .get(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .expect(200);
    const detailReview = getRecordValue(getJsonBody(detailResponse), 'review');
    expect(detailReview).toMatchObject({
      status: 'not_started',
      totalScore: 0,
    });
    expect(getRecordArray(detailReview, 'items')[0]).toMatchObject({
      score: null,
      evaluationDescription: '',
      improvementSuggestion: '',
    });
  });

  it('rejects deleting submitted and returned reviews', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);
    const managerCookie = await login(data.reviewManager.phone);

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send(createValidSubmitPayload())
      .expect(201);

    const submittedDeleteResponse = await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', expertCookie)
      .expect(409);
    expect(getJsonBody(submittedDeleteResponse)).toMatchObject({
      code: 'EXPERT_REVIEW_DRAFT_NOT_DELETABLE',
      message: '只有未提交的评分草稿可以删除。',
    });
    await expect(
      findReview(data.project.id, data.expert.id),
    ).resolves.toMatchObject({ status: 'submitted' });

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/expert-reviews/${data.expert.id}/return`,
      )
      .set('Cookie', managerCookie)
      .send({ returnReason: '需要补充说明' })
      .expect(201);

    const returnedDeleteResponse = await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', expertCookie)
      .expect(409);
    expect(getJsonBody(returnedDeleteResponse)).toMatchObject({
      code: 'EXPERT_REVIEW_DRAFT_NOT_DELETABLE',
      message: '只有未提交的评分草稿可以删除。',
    });
    await expect(
      findReview(data.project.id, data.expert.id),
    ).resolves.toMatchObject({ status: 'returned' });
  });

  it('blocks returning submitted reviews after consensus is confirmed', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);
    const managerCookie = await login(data.reviewManager.phone);

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send(createValidSubmitPayload())
      .expect(201);

    await consensusReviewModel.create({
      projectId: new Types.ObjectId(data.project.id),
      reviewSchemeSnapshot: createReviewSchemeSnapshot(),
      finalOpinion: '最终合议已确认',
      finalScore: 85,
      finalLevel: 'A',
      originalLevel: 'A',
      confirmedByUserId: new Types.ObjectId(data.reviewManager.id),
      confirmedAt: new Date(),
      status: 'confirmed',
      expertReviewStats: {
        expertCount: 2,
        submittedCount: 1,
        averageScore: 85,
        minScore: 85,
        maxScore: 85,
      },
    });

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/expert-reviews/${data.expert.id}/return`,
      )
      .set('Cookie', managerCookie)
      .send({ returnReason: '合议后不应退回' })
      .expect(409);

    await expect(
      findReview(data.project.id, data.expert.id),
    ).resolves.toMatchObject({ status: 'submitted' });
  });

  it('returns 404 when deleting without an expert review record', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);

    const response = await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', expertCookie)
      .expect(404);

    expect(getJsonBody(response)).toMatchObject({
      message: '未找到可删除的评分草稿。',
    });
  });

  it('blocks unassigned or removed experts from deleting draft reviews', async () => {
    const data = await seedData();
    const unassignedExpertCookie = await login(data.unassignedExpert.phone);
    const removedExpertCookie = await login(data.removedExpert.phone);

    await createReviewRecord({
      expertUserId: data.unassignedExpert.id,
      projectId: data.project.id,
      status: 'draft',
    });
    await createReviewRecord({
      expertUserId: data.removedExpert.id,
      projectId: data.project.id,
      status: 'draft',
    });

    await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', unassignedExpertCookie)
      .expect(403);
    await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', removedExpertCookie)
      .expect(403);

    await expect(
      findReview(data.project.id, data.unassignedExpert.id),
    ).resolves.toMatchObject({ status: 'draft' });
    await expect(
      findReview(data.project.id, data.removedExpert.id),
    ).resolves.toMatchObject({ status: 'draft' });
  });

  it('blocks submit before review time while allowing drafts', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);
    const futureReviewTime = new Date(Date.now() + 60 * 60 * 1000);

    await projectModel
      .findByIdAndUpdate(data.project.id, {
        $set: { reviewTime: futureReviewTime },
      })
      .exec();

    await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 50,
            evaluationDescription: '提前准备技术意见',
          },
          {
            name: '财务',
            score: 35,
            evaluationDescription: '提前准备财务意见',
          },
        ],
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'draft',
          totalScore: 85,
        });
      });

    const blockedResponse = await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send(createValidSubmitPayload())
      .expect(409);
    const blockedBody = getJsonBody(blockedResponse);
    expect(blockedBody).toMatchObject({
      code: 'REVIEW_NOT_STARTED',
    });
    expect(getStringValue(blockedBody, 'message')).toContain('评审尚未开始');
    expect(blockedBody.reviewTime).toBe(futureReviewTime.toISOString());

    const persistedReview = await expertReviewModel
      .findOne({
        projectId: new Types.ObjectId(data.project.id),
        expertUserId: new Types.ObjectId(data.expert.id),
      })
      .lean<{ status: string; submittedAt?: Date | null } | null>()
      .exec();
    expect(persistedReview).toMatchObject({ status: 'draft' });
    expect(persistedReview?.submittedAt ?? null).toBeNull();
  });

  it('allows deleting drafts before review time while submit remains blocked', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);
    const futureReviewTime = new Date(Date.now() + 60 * 60 * 1000);

    await projectModel
      .findByIdAndUpdate(data.project.id, {
        $set: { reviewTime: futureReviewTime },
      })
      .exec();

    await request(httpServer)
      .put(`/expert/review-tasks/${data.project.id}`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 50,
            evaluationDescription: '提前准备技术意见',
          },
          {
            name: '财务',
            score: 35,
            evaluationDescription: '提前准备财务意见',
          },
        ],
      })
      .expect(200);

    await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', expertCookie)
      .expect(204);
    await expect(
      findReview(data.project.id, data.expert.id),
    ).resolves.toBeNull();

    const blockedResponse = await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send(createValidSubmitPayload())
      .expect(409);
    expect(getJsonBody(blockedResponse)).toMatchObject({
      code: 'REVIEW_NOT_STARTED',
    });
    await expect(
      findReview(data.project.id, data.expert.id),
    ).resolves.toBeNull();
  });

  it('allows submit after review time', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);

    await projectModel
      .findByIdAndUpdate(data.project.id, {
        $set: { reviewTime: new Date(Date.now() - 60 * 1000) },
      })
      .exec();

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send(createValidSubmitPayload())
      .expect(201)
      .expect((response) => {
        const body = getJsonBody(response);

        expect(body).toMatchObject({
          status: 'submitted',
          totalScore: 85,
        });
        expect(body.submittedAt).toBeTruthy();
      });

    const persistedReview = await expertReviewModel
      .findOne({
        projectId: new Types.ObjectId(data.project.id),
        expertUserId: new Types.ObjectId(data.expert.id),
      })
      .lean<{ status: string; submittedAt?: Date | null } | null>()
      .exec();
    expect(persistedReview).toMatchObject({ status: 'submitted' });
    expect(persistedReview?.submittedAt).toBeInstanceOf(Date);
  });

  it('allows submit when review time is not set', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);

    await projectModel
      .findByIdAndUpdate(data.project.id, {
        $set: { reviewTime: null },
      })
      .exec();

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send(createValidSubmitPayload())
      .expect(201)
      .expect((response) => {
        const body = getJsonBody(response);

        expect(body).toMatchObject({
          status: 'submitted',
          totalScore: 85,
        });
        expect(body.submittedAt).toBeTruthy();
      });
  });

  it('allows review managers and admins to inspect reviews and summaries', async () => {
    const data = await seedData();
    const expertCookie = await login(data.expert.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const adminCookie = await login(data.admin.phone);

    await request(httpServer)
      .post(`/expert/review-tasks/${data.project.id}/submit`)
      .set('Cookie', expertCookie)
      .send({
        items: [
          {
            name: '技术',
            score: 48,
            evaluationDescription: '效果良好',
          },
          {
            name: '财务',
            score: 36,
            evaluationDescription: '预算基本合理',
          },
        ],
      })
      .expect(201);

    const listResponse = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/expert-reviews`)
      .set('Cookie', managerCookie)
      .expect(200);
    const rows = getJsonArray(listResponse);
    expect(rows.map((row) => row.status).sort()).toEqual([
      'not_started',
      'submitted',
    ]);
    expect(rows[0].expert).not.toHaveProperty('passwordHash');

    await request(httpServer)
      .get(
        `/admin/projects/${data.project.id}/expert-reviews/${data.expert.id}`,
      )
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          expertUserId: data.expert.id,
          status: 'submitted',
        });
      });

    const summaryResponse = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/review-summary`)
      .set('Cookie', managerCookie)
      .expect(200);
    expect(getJsonBody(summaryResponse)).toMatchObject({
      assignedExpertCount: 2,
      submittedExpertCount: 1,
      notStartedExpertCount: 1,
      averageScore: 84,
      minScore: 84,
      maxScore: 84,
    });
    expect(
      getRecordArray(getJsonBody(summaryResponse), 'perItemAverageScores'),
    ).toHaveLength(2);
  });

  async function seedData() {
    const admin = await createUser('+8613830000001', ['admin']);
    const client = await createUser('+8613830000002', ['client']);
    const reviewManager = await createUser(
      '+8613830000003',
      ['admin', 'review_manager'],
      '多角色评审负责人',
    );
    const otherReviewManager = await createUser('+8613830000004', [
      'review_manager',
    ]);
    const expert = await createUser('+8613830000005', ['expert']);
    const secondExpert = await createUser('+8613830000006', ['expert']);
    const unassignedExpert = await createUser('+8613830000007', ['expert']);
    const removedExpert = await createUser('+8613830000008', ['expert']);
    const batch = await batchModel.create({ name: '2026', year: 2026 });
    const missingManagerBatch = await batchModel.create({
      name: '2026 缺失负责人',
      year: 2026,
    });
    const reviewSchemeSnapshot = {
      id: new Types.ObjectId().toString(),
      name: '专家评分方案',
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
          suggestionRequiredThresholdRatio: 0.75,
        },
      ],
    };
    const project = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-REVIEW-001',
      name: '专家评分项目',
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      reviewSchemeId: new Types.ObjectId(reviewSchemeSnapshot.id),
      reviewSchemeSnapshot,
      isActive: true,
    });
    const noSnapshotProject = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-REVIEW-002',
      name: '无快照项目',
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      isActive: true,
    });
    const missingReviewManagerId = new Types.ObjectId();
    const missingManagerProject = await projectModel.create({
      batchId: missingManagerBatch._id,
      projectNo: 'P-REVIEW-003',
      name: '负责人缺失项目',
      reviewManagerId: missingReviewManagerId,
      reviewSchemeId: new Types.ObjectId(reviewSchemeSnapshot.id),
      reviewSchemeSnapshot,
      isActive: true,
    });

    await assignmentModel.create([
      {
        projectId: project._id,
        expertUserId: new Types.ObjectId(expert.id),
        assignedByUserId: new Types.ObjectId(reviewManager.id),
        status: 'assigned',
      },
      {
        projectId: project._id,
        expertUserId: new Types.ObjectId(secondExpert.id),
        assignedByUserId: new Types.ObjectId(reviewManager.id),
        status: 'assigned',
      },
      {
        projectId: project._id,
        expertUserId: new Types.ObjectId(removedExpert.id),
        assignedByUserId: new Types.ObjectId(reviewManager.id),
        status: 'removed',
      },
      {
        projectId: noSnapshotProject._id,
        expertUserId: new Types.ObjectId(expert.id),
        assignedByUserId: new Types.ObjectId(reviewManager.id),
        status: 'assigned',
      },
      {
        projectId: missingManagerProject._id,
        expertUserId: new Types.ObjectId(expert.id),
        assignedByUserId: new Types.ObjectId(reviewManager.id),
        status: 'assigned',
      },
    ]);

    return {
      admin,
      client,
      reviewManager,
      otherReviewManager,
      expert,
      secondExpert,
      unassignedExpert,
      removedExpert,
      batchId: batch._id.toString(),
      missingManagerBatchId: missingManagerBatch._id.toString(),
      missingReviewManagerId: missingReviewManagerId.toString(),
      reviewSchemeId: reviewSchemeSnapshot.id,
      project: { id: project._id.toString() },
      missingManagerProject: { id: missingManagerProject._id.toString() },
      noSnapshotProject: { id: noSnapshotProject._id.toString() },
    };
  }

  async function createUser(
    phone: string,
    roles: string[],
    name = `User ${phone.slice(-4)}`,
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

  async function findReview(projectId: string, expertUserId: string) {
    return expertReviewModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        expertUserId: new Types.ObjectId(expertUserId),
      })
      .lean<{ status: string; submittedAt?: Date | null } | null>()
      .exec();
  }

  async function createReviewRecord(input: {
    expertUserId: string;
    projectId: string;
    status: ExpertReviewStatus;
  }): Promise<void> {
    const project = await projectModel
      .findById(input.projectId)
      .select({ reviewSchemeSnapshot: 1 })
      .lean<{ reviewSchemeSnapshot?: Record<string, unknown> | null } | null>()
      .exec();
    const reviewSchemeSnapshot =
      project?.reviewSchemeSnapshot ?? createReviewSchemeSnapshot();

    await expertReviewModel.create({
      projectId: new Types.ObjectId(input.projectId),
      expertUserId: new Types.ObjectId(input.expertUserId),
      assignmentId: null,
      reviewSchemeSnapshot,
      items: createReviewItems(),
      totalScore: 85,
      status: input.status,
      submittedAt:
        input.status === 'submitted' || input.status === 'returned'
          ? new Date()
          : null,
      returnedAt: input.status === 'returned' ? new Date() : null,
    });
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

function getRecordValue(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = record[key];

  if (!isRecord(value)) {
    throw new Error(`${key} must be an object`);
  }

  return value;
}

function getStringValue(record: Record<string, unknown>, key: string): string {
  const value = record[key];

  return typeof value === 'string' ? value : '';
}

function createValidSubmitPayload(): {
  items: Array<{
    evaluationDescription: string;
    name: string;
    score: number;
  }>;
} {
  return {
    items: [
      {
        name: '技术',
        score: 50,
        evaluationDescription: '技术路线清晰，成果较完整',
      },
      {
        name: '财务',
        score: 35,
        evaluationDescription: '预算安排基本合理',
      },
    ],
  };
}

function createReviewSchemeSnapshot(): {
  totalScore: number;
  items: Array<{
    maxScore: number;
    name: string;
    scoringGuide: string;
    sortOrder: number;
    suggestionRequiredThresholdRatio: number;
  }>;
} {
  return {
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
        suggestionRequiredThresholdRatio: 0.75,
      },
    ],
  };
}

function createReviewItems(): Array<{
  evaluationDescription: string;
  hasMajorIssue: boolean;
  improvementSuggestion: string;
  itemSnapshot: {
    maxScore: number;
    name: string;
    scoringGuide: string;
    sortOrder: number;
    suggestionRequiredThresholdRatio: number;
  };
  score: number;
}> {
  return createReviewSchemeSnapshot().items.map((item) => ({
    itemSnapshot: item,
    score: item.name === '技术' ? 50 : 35,
    evaluationDescription:
      item.name === '技术' ? '技术路线清晰' : '预算安排基本合理',
    improvementSuggestion: '',
    hasMajorIssue: false,
  }));
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
  expect(value).not.toHaveProperty('refreshToken');
  expect(value).not.toHaveProperty('resetToken');
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

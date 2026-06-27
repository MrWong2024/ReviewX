import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { Connection, Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { UserRole } from '../src/common/constants/user-roles';
import { Batch } from '../src/modules/batches/schemas/batch.schema';
import { ConsensusReview } from '../src/modules/consensus-reviews/schemas/consensus-review.schema';
import { ExpertReview } from '../src/modules/expert-reviews/schemas/expert-review.schema';
import { ProjectAppeal } from '../src/modules/project-appeals/schemas/project-appeal.schema';
import { ProjectExpertAssignment } from '../src/modules/project-expert-assignments/schemas/project-expert-assignment.schema';
import { ProjectMaterial } from '../src/modules/project-materials/schemas/project-material.schema';
import { Project } from '../src/modules/projects/schemas/project.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

type TestUser = {
  id: string;
  phone: string;
  name: string;
};

type SeedData = {
  users: {
    admin: TestUser;
    client: TestUser;
    owner: TestUser;
    expert: TestUser;
    reviewManager: TestUser;
  };
  ids: {
    batchAId: string;
    batchBId: string;
    projectTypeId: string;
    statusId: string;
    departmentId: string;
    disciplineAId: string;
    disciplineBId: string;
    reviewSchemeId: string;
  };
  projects: {
    completed: { id: string };
    consensusFallback: { id: string };
    startedWithoutAssignment: { id: string };
    draftConsensus: { id: string };
    inactive: { id: string };
  };
};

describe('Client dashboard APIs (e2e)', () => {
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
  let appealModel: Model<ProjectAppeal>;
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
    appealModel = app.get<Model<ProjectAppeal>>(
      getModelToken(ProjectAppeal.name),
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
      appealModel,
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

  it('requires login and the client role for overview', async () => {
    const data = await seedDashboardData();

    await request(httpServer).get('/client/dashboard/overview').expect(401);

    for (const user of [
      data.users.admin,
      data.users.owner,
      data.users.expert,
      data.users.reviewManager,
    ]) {
      await request(httpServer)
        .get('/client/dashboard/overview')
        .set('Cookie', await login(user.phone))
        .expect(403);
    }

    await request(httpServer)
      .get('/client/dashboard/overview')
      .set('Cookie', await login(data.users.client.phone))
      .expect(200);
  });

  it('returns overview totals from active projects only and applies core statistics rules', async () => {
    const data = await seedDashboardData();
    const clientCookie = await login(data.users.client.phone);

    const response = await request(httpServer)
      .get('/client/dashboard/overview')
      .set('Cookie', clientCookie)
      .expect(200);
    const body = getJsonBody(response);

    expect(body).toMatchObject({
      filters: {
        batchId: null,
        projectTypeId: null,
        statusId: null,
        departmentId: null,
        disciplineId: null,
        reviewManagerId: null,
        reviewSchemeId: null,
        finalLevel: null,
        progressStage: null,
        hasMeetingUrl: null,
        hasPendingAppeal: null,
        keyword: null,
      },
      projectTotals: {
        totalProjects: 4,
        withReviewManager: 2,
        withReviewScheme: 1,
        scheduled: 1,
        withMeetingUrl: 1,
        withAssignedExperts: 2,
        withSubmittedMaterials: 1,
        expertReviewsStarted: 1,
        expertReviewsCompleted: 1,
        consensusDraft: 1,
        consensusConfirmed: 2,
        withFinalLevel: 2,
        withPendingAppeal: 1,
      },
      funding: {
        totalFunding: 190,
        allocatedFunding: 95,
        allocationRate: 0.5,
      },
      expertReviewTotals: {
        assignedExpertCount: 3,
        submittedExpertReviewCount: 3,
        submissionRate: 1,
      },
      appealTotals: {
        totalAppeals: 5,
        pendingAppeals: 2,
        acceptedAppeals: 1,
        rejectedAppeals: 1,
        canceledAppeals: 1,
        levelChangedAppeals: 1,
      },
    });
    expect(getString(body, 'generatedAt')).toBeTruthy();

    const breakdowns = getRecord(body, 'breakdowns');
    expect(
      findBreakdownCount(
        getRecordArray(breakdowns, 'byBatch'),
        'batchId',
        data.ids.batchAId,
      ),
    ).toBe(3);
    expect(
      findBreakdownCount(
        getRecordArray(breakdowns, 'byBatch'),
        'batchId',
        data.ids.batchBId,
      ),
    ).toBe(1);
    expect(
      findBreakdownCount(
        getRecordArray(breakdowns, 'byFinalLevel'),
        'finalLevel',
        'B',
      ),
    ).toBe(1);
    expect(
      findBreakdownCount(
        getRecordArray(breakdowns, 'byFinalLevel'),
        'finalLevel',
        'C',
      ),
    ).toBe(1);
    expect(
      findBreakdownCount(
        getRecordArray(breakdowns, 'byFinalLevel'),
        'finalLevel',
        '其他',
      ),
    ).toBe(2);
    expect(
      findBreakdownCount(
        getRecordArray(breakdowns, 'byProgressStage'),
        'stage',
        'appeal_pending',
      ),
    ).toBe(1);
    expect(
      findBreakdownCount(
        getRecordArray(breakdowns, 'byProgressStage'),
        'stage',
        'experts_assigned',
      ),
    ).toBe(2);
  });

  it('returns paginated project drilldown items without sensitive fields', async () => {
    const data = await seedDashboardData();
    const clientCookie = await login(data.users.client.phone);

    const response = await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ page: 1, pageSize: 2 })
      .set('Cookie', clientCookie)
      .expect(200);
    const body = getJsonBody(response);

    expect(body).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 4,
    });
    const items = getRecordArray(body, 'items');
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: data.projects.completed.id,
      projectNo: 'CD-001',
      name: 'Alpha Meeting Project',
      batchId: data.ids.batchAId,
      projectTypeId: data.ids.projectTypeId,
      statusId: data.ids.statusId,
      departmentId: data.ids.departmentId,
      disciplineIds: [data.ids.disciplineAId],
      reviewManagerId: data.users.reviewManager.id,
      reviewSchemeId: data.ids.reviewSchemeId,
      totalFunding: 100,
      allocatedFunding: 60,
      meetingUrl: 'https://meeting.example/a',
      finalLevel: 'B',
      originalLevel: 'A',
      effectiveFinalLevel: 'B',
      effectiveFinalLevelSource: 'project_final_level',
      primaryStage: 'appeal_pending',
      metrics: {
        assignedExpertCount: 2,
        submittedExpertReviewCount: 2,
        submittedMaterialCount: 1,
        appealTotalCount: 3,
        pendingAppealCount: 2,
      },
      consensus: {
        status: 'confirmed',
        finalScore: 82,
        finalLevel: 'A',
      },
    });
    expect(getStringArray(items[0], 'stages')).toEqual(
      expect.arrayContaining([
        'experts_assigned',
        'materials_submitted',
        'expert_reviews_completed',
        'consensus_confirmed',
        'final_level_set',
        'appeal_pending',
      ]),
    );
    expectResponseHasNoForbiddenFields(body);
  });

  it('uses project finalLevel before confirmed consensus finalLevel and filters by effective finalLevel', async () => {
    const data = await seedDashboardData();
    const clientCookie = await login(data.users.client.phone);

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ finalLevel: 'A' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonBody(response)).toMatchObject({ total: 0 });
      });

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ finalLevel: 'B' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        const items = getRecordArray(getJsonBody(response), 'items');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
          id: data.projects.completed.id,
          effectiveFinalLevel: 'B',
          effectiveFinalLevelSource: 'project_final_level',
        });
      });

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ finalLevel: 'C' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        const items = getRecordArray(getJsonBody(response), 'items');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
          id: data.projects.consensusFallback.id,
          finalLevel: '',
          effectiveFinalLevel: 'C',
          effectiveFinalLevelSource: 'confirmed_consensus',
        });
      });
  });

  it('applies base filters, meeting URL, pending appeal, progress stage, and keyword filters', async () => {
    const data = await seedDashboardData();
    const clientCookie = await login(data.users.client.phone);

    await request(httpServer)
      .get('/client/dashboard/overview')
      .query({
        batchId: data.ids.batchAId,
        projectTypeId: data.ids.projectTypeId,
        statusId: data.ids.statusId,
        departmentId: data.ids.departmentId,
        disciplineId: data.ids.disciplineAId,
        reviewManagerId: data.users.reviewManager.id,
        reviewSchemeId: data.ids.reviewSchemeId,
        finalLevel: 'B',
        progressStage: 'experts_assigned',
        hasMeetingUrl: 'true',
        hasPendingAppeal: 'true',
        keyword: 'Alpha',
      })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        const body = getJsonBody(response);
        expect(body).toMatchObject({
          filters: {
            finalLevel: 'B',
            progressStage: 'experts_assigned',
            hasMeetingUrl: true,
            hasPendingAppeal: true,
            keyword: 'Alpha',
          },
          projectTotals: {
            totalProjects: 1,
            withMeetingUrl: 1,
            withPendingAppeal: 1,
          },
        });
      });

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ hasMeetingUrl: 'false' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonBody(response)).toMatchObject({ total: 3 });
      });

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ progressStage: 'consensus_confirmed' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonBody(response)).toMatchObject({ total: 2 });
      });

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ progressStage: 'appeal_pending' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        const items = getRecordArray(getJsonBody(response), 'items');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({ id: data.projects.completed.id });
      });

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ progressStage: 'experts_assigned' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonBody(response)).toMatchObject({ total: 2 });
      });

    await request(httpServer)
      .get('/client/dashboard/projects')
      .query({ keyword: 'CD-002' })
      .set('Cookie', clientCookie)
      .expect(200)
      .expect((response) => {
        const items = getRecordArray(getJsonBody(response), 'items');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
          id: data.projects.consensusFallback.id,
        });
      });
  });

  it('rejects invalid progressStage values', async () => {
    const data = await seedDashboardData();
    const clientCookie = await login(data.users.client.phone);

    await request(httpServer)
      .get('/client/dashboard/overview')
      .query({ progressStage: 'unknown_stage' })
      .set('Cookie', clientCookie)
      .expect(400);
  });

  async function seedDashboardData(): Promise<SeedData> {
    const admin = await createUser('+8613860000001', ['admin']);
    const client = await createUser('+8613860000002', ['client']);
    const owner = await createUser('+8613860000003', ['project_owner']);
    const expert = await createUser('+8613860000004', ['expert']);
    const reviewManager = await createUser('+8613860000005', [
      'review_manager',
    ]);
    const expertTwo = await createUser('+8613860000006', ['expert']);
    const batchA = await batchModel.create({
      name: 'Client Dashboard Batch A',
      year: 2026,
      isActive: true,
    });
    const batchB = await batchModel.create({
      name: 'Client Dashboard Batch B',
      year: 2027,
      isActive: true,
    });
    const ids = {
      batchAId: batchA._id.toString(),
      batchBId: batchB._id.toString(),
      projectTypeId: new Types.ObjectId().toString(),
      statusId: new Types.ObjectId().toString(),
      departmentId: new Types.ObjectId().toString(),
      disciplineAId: new Types.ObjectId().toString(),
      disciplineBId: new Types.ObjectId().toString(),
      reviewSchemeId: new Types.ObjectId().toString(),
    };
    const organizationId = new Types.ObjectId();
    const cooperationOrganizationId = new Types.ObjectId();
    const materialTypeId = new Types.ObjectId();

    const completedProject = await projectModel.create({
      batchId: batchA._id,
      projectNo: 'CD-001',
      name: 'Alpha Meeting Project',
      projectTypeId: new Types.ObjectId(ids.projectTypeId),
      statusId: new Types.ObjectId(ids.statusId),
      ownerUserId: new Types.ObjectId(owner.id),
      leadOrganizationId: organizationId,
      cooperationOrganizationIds: [cooperationOrganizationId],
      totalFunding: 100,
      allocatedFunding: 60,
      disciplineIds: [new Types.ObjectId(ids.disciplineAId)],
      departmentId: new Types.ObjectId(ids.departmentId),
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      reviewSchemeId: new Types.ObjectId(ids.reviewSchemeId),
      reviewTime: new Date('2026-07-01T09:00:00.000Z'),
      reviewLocation: 'Room A',
      meetingUrl: '  https://meeting.example/a  ',
      finalLevel: ' B ',
      originalLevel: ' A ',
      isActive: true,
    });
    const consensusFallbackProject = await projectModel.create({
      batchId: batchA._id,
      projectNo: 'CD-002',
      name: 'Beta Consensus Project',
      totalFunding: 50,
      allocatedFunding: 25,
      disciplineIds: [new Types.ObjectId(ids.disciplineAId)],
      meetingUrl: '   ',
      isActive: true,
    });
    const startedWithoutAssignmentProject = await projectModel.create({
      batchId: batchB._id,
      projectNo: 'CD-003',
      name: 'Gamma Started Without Assignment',
      totalFunding: null,
      allocatedFunding: null,
      disciplineIds: [new Types.ObjectId(ids.disciplineBId)],
      isActive: true,
    });
    const draftConsensusProject = await projectModel.create({
      batchId: batchA._id,
      projectNo: 'CD-004',
      name: 'Delta Draft Consensus',
      totalFunding: 40,
      allocatedFunding: 10,
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      isActive: true,
    });
    const inactiveProject = await projectModel.create({
      batchId: batchA._id,
      projectNo: 'CD-INACTIVE',
      name: 'Inactive Should Not Count',
      totalFunding: 999,
      allocatedFunding: 999,
      finalLevel: 'D',
      isActive: false,
    });

    await seedAssignments(
      completedProject._id,
      [expert.id, expertTwo.id],
      reviewManager.id,
    );
    await seedAssignments(
      draftConsensusProject._id,
      [expert.id],
      reviewManager.id,
    );
    await seedExpertReview(completedProject._id, expert.id, 'submitted');
    await seedExpertReview(completedProject._id, expertTwo.id, 'submitted');
    await seedExpertReview(
      startedWithoutAssignmentProject._id,
      expert.id,
      'submitted',
    );
    await seedExpertReview(inactiveProject._id, expert.id, 'submitted');

    await seedConsensus(
      completedProject._id,
      reviewManager.id,
      'confirmed',
      'A',
    );
    await seedConsensus(
      consensusFallbackProject._id,
      reviewManager.id,
      'confirmed',
      'C',
    );
    await seedConsensus(
      draftConsensusProject._id,
      reviewManager.id,
      'draft',
      '',
    );

    await seedMaterials(completedProject._id, owner.id, materialTypeId);
    await seedSubmittedMaterial(inactiveProject._id, owner.id, materialTypeId);

    await seedAppeals(completedProject._id, owner.id);
    await appealModel.create({
      projectId: consensusFallbackProject._id,
      appealNo: 1,
      submittedByUserId: new Types.ObjectId(owner.id),
      reason: 'rejected appeal',
      status: 'rejected',
      levelBeforeAppeal: 'C',
      levelAfterHandling: 'C',
      handledByUserId: new Types.ObjectId(),
      handlingOpinion: 'rejected',
      handledAt: new Date(),
      causedLevelChange: false,
    });
    await appealModel.create({
      projectId: draftConsensusProject._id,
      appealNo: 1,
      submittedByUserId: new Types.ObjectId(owner.id),
      reason: 'canceled appeal',
      status: 'canceled',
      levelBeforeAppeal: 'B',
      levelAfterHandling: 'B',
      handledByUserId: new Types.ObjectId(),
      handlingOpinion: 'canceled',
      handledAt: new Date(),
      causedLevelChange: false,
    });
    await appealModel.create({
      projectId: inactiveProject._id,
      appealNo: 1,
      submittedByUserId: new Types.ObjectId(owner.id),
      reason: 'inactive appeal',
      status: 'submitted',
      levelBeforeAppeal: 'D',
      causedLevelChange: false,
    });

    return {
      users: {
        admin,
        client,
        owner,
        expert,
        reviewManager,
      },
      ids,
      projects: {
        completed: { id: completedProject._id.toString() },
        consensusFallback: { id: consensusFallbackProject._id.toString() },
        startedWithoutAssignment: {
          id: startedWithoutAssignmentProject._id.toString(),
        },
        draftConsensus: { id: draftConsensusProject._id.toString() },
        inactive: { id: inactiveProject._id.toString() },
      },
    };
  }

  async function createUser(
    phone: string,
    roles: UserRole[],
  ): Promise<TestUser> {
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

    return { id: userId.toString(), phone, name };
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

  async function seedAssignments(
    projectId: Types.ObjectId,
    expertUserIds: string[],
    reviewManagerId: string,
  ): Promise<void> {
    for (const expertUserId of expertUserIds) {
      await assignmentModel.create({
        projectId,
        expertUserId: new Types.ObjectId(expertUserId),
        assignedByUserId: new Types.ObjectId(reviewManagerId),
        source: 'manual',
        status: 'assigned',
      });
    }

    await assignmentModel.create({
      projectId,
      expertUserId: new Types.ObjectId(),
      assignedByUserId: new Types.ObjectId(reviewManagerId),
      source: 'manual',
      status: 'removed',
      removedAt: new Date(),
      removedByUserId: new Types.ObjectId(reviewManagerId),
    });
  }

  async function seedExpertReview(
    projectId: Types.ObjectId,
    expertUserId: string,
    status: 'submitted' | 'draft' | 'returned',
  ): Promise<void> {
    await expertReviewModel.create({
      projectId,
      expertUserId: new Types.ObjectId(expertUserId),
      reviewSchemeSnapshot: createReviewSchemeSnapshot(),
      items: [],
      totalScore: 80,
      status,
      submittedAt: status === 'submitted' ? new Date() : null,
    });
  }

  async function seedConsensus(
    projectId: Types.ObjectId,
    reviewManagerId: string,
    status: 'draft' | 'confirmed',
    finalLevel: string,
  ): Promise<void> {
    await consensusReviewModel.create({
      projectId,
      reviewSchemeSnapshot: createReviewSchemeSnapshot(),
      draftGeneratedAt: new Date(),
      draftGeneratedByUserId: new Types.ObjectId(reviewManagerId),
      draftSource: 'manual',
      draftOpinion: 'draft opinion',
      draftScore: 80,
      finalOpinion: status === 'confirmed' ? 'confirmed opinion' : '',
      finalScore: status === 'confirmed' ? 82 : null,
      finalLevel,
      originalLevel: finalLevel,
      confirmedByUserId:
        status === 'confirmed' ? new Types.ObjectId(reviewManagerId) : null,
      confirmedAt: status === 'confirmed' ? new Date() : null,
      status,
      expertReviewStats: {
        expertCount: 2,
        submittedCount: 2,
        averageScore: 82,
        minScore: 78,
        maxScore: 86,
      },
    });
  }

  async function seedMaterials(
    projectId: Types.ObjectId,
    ownerUserId: string,
    materialTypeId: Types.ObjectId,
  ): Promise<void> {
    await seedSubmittedMaterial(projectId, ownerUserId, materialTypeId);
    await materialModel.create({
      projectId,
      materialTypeId,
      uploadedByUserId: new Types.ObjectId(ownerUserId),
      originalFilename: 'draft.pdf',
      safeFilename: 'draft.pdf',
      objectKey: `client-dashboard/${projectId.toString()}/draft.pdf`,
      bucket: 'fake-reviewx-test',
      storageDriver: 'fake',
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 1,
      status: 'draft',
    });
    await materialModel.create({
      projectId,
      materialTypeId,
      uploadedByUserId: new Types.ObjectId(ownerUserId),
      originalFilename: 'legacy-active.pdf',
      safeFilename: 'legacy-active.pdf',
      objectKey: `client-dashboard/${projectId.toString()}/legacy-active.pdf`,
      bucket: 'fake-reviewx-test',
      storageDriver: 'fake',
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 1,
      status: 'active',
    });
    await materialModel.create({
      projectId,
      materialTypeId,
      uploadedByUserId: new Types.ObjectId(ownerUserId),
      originalFilename: 'deleted-submitted.pdf',
      safeFilename: 'deleted-submitted.pdf',
      objectKey: `client-dashboard/${projectId.toString()}/deleted-submitted.pdf`,
      bucket: 'fake-reviewx-test',
      storageDriver: 'fake',
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 1,
      status: 'submitted',
      submittedAt: new Date(),
      submittedByUserId: new Types.ObjectId(ownerUserId),
      deletedAt: new Date(),
    });
  }

  async function seedSubmittedMaterial(
    projectId: Types.ObjectId,
    ownerUserId: string,
    materialTypeId: Types.ObjectId,
  ): Promise<void> {
    await materialModel.create({
      projectId,
      materialTypeId,
      uploadedByUserId: new Types.ObjectId(ownerUserId),
      originalFilename: 'submitted.pdf',
      safeFilename: 'submitted.pdf',
      objectKey: `client-dashboard/${projectId.toString()}/submitted.pdf`,
      bucket: 'fake-reviewx-test',
      storageDriver: 'fake',
      mimeType: 'application/pdf',
      extension: 'pdf',
      sizeBytes: 1,
      status: 'submitted',
      submittedAt: new Date(),
      submittedByUserId: new Types.ObjectId(ownerUserId),
    });
  }

  async function seedAppeals(
    projectId: Types.ObjectId,
    ownerUserId: string,
  ): Promise<void> {
    await appealModel.create({
      projectId,
      appealNo: 1,
      submittedByUserId: new Types.ObjectId(ownerUserId),
      reason: 'submitted appeal',
      status: 'submitted',
      levelBeforeAppeal: 'B',
      causedLevelChange: false,
    });
    await appealModel.create({
      projectId,
      appealNo: 2,
      submittedByUserId: new Types.ObjectId(ownerUserId),
      reason: 'processing appeal',
      status: 'processing',
      levelBeforeAppeal: 'B',
      causedLevelChange: false,
    });
    await appealModel.create({
      projectId,
      appealNo: 3,
      submittedByUserId: new Types.ObjectId(ownerUserId),
      reason: 'accepted appeal',
      status: 'accepted',
      levelBeforeAppeal: 'B',
      levelAfterHandling: 'A',
      handledByUserId: new Types.ObjectId(),
      handlingOpinion: 'accepted',
      handledAt: new Date(),
      causedLevelChange: true,
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

function createReviewSchemeSnapshot(): {
  totalScore: number;
  items: Array<{
    name: string;
    maxScore: number;
    sortOrder: number;
    suggestionRequiredThresholdRatio: number;
  }>;
} {
  return {
    totalScore: 100,
    items: [
      {
        name: 'Tech',
        maxScore: 60,
        sortOrder: 1,
        suggestionRequiredThresholdRatio: 0.8,
      },
      {
        name: 'Finance',
        maxScore: 40,
        sortOrder: 2,
        suggestionRequiredThresholdRatio: 0.75,
      },
    ],
  };
}

function findBreakdownCount(
  items: Record<string, unknown>[],
  key: string,
  value: string,
): number {
  const item = items.find((candidate) => candidate[key] === value);
  const count = item?.count;

  if (typeof count !== 'number') {
    throw new Error(`breakdown ${key}=${value} must have a numeric count`);
  }

  return count;
}

function getJsonBody(response: Response): Record<string, unknown> {
  const body: unknown = response.body;
  return isRecord(body) ? body : {};
}

function getRecord(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = record[key];

  if (!isRecord(value)) {
    throw new Error(`${key} must be an object`);
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
  expect(value).not.toHaveProperty('token');
  expect(value).not.toHaveProperty('secret');
  expect(value).not.toHaveProperty('credential');
  expect(value).not.toHaveProperty('sessionToken');

  for (const childValue of Object.values(value)) {
    expectResponseHasNoForbiddenFields(childValue);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

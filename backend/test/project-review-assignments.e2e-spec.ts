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
import type { ExpertReviewStatus } from '../src/modules/expert-reviews/constants/expert-review.constants';
import { ExpertReview } from '../src/modules/expert-reviews/schemas/expert-review.schema';
import { Organization } from '../src/modules/organizations/schemas/organization.schema';
import { ProjectExpertAssignment } from '../src/modules/project-expert-assignments/schemas/project-expert-assignment.schema';
import { Project } from '../src/modules/projects/schemas/project.schema';
import { ReviewScheme } from '../src/modules/review-schemes/schemas/review-scheme.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { TreeDictionary } from '../src/modules/tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

describe('Project review assignment and expert assignment APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let batchModel: Model<Batch>;
  let organizationModel: Model<Organization>;
  let treeDictionaryModel: Model<TreeDictionary>;
  let reviewSchemeModel: Model<ReviewScheme>;
  let projectModel: Model<Project>;
  let assignmentModel: Model<ProjectExpertAssignment>;
  let expertReviewModel: Model<ExpertReview>;
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
    batchModel = app.get<Model<Batch>>(getModelToken(Batch.name));
    organizationModel = app.get<Model<Organization>>(
      getModelToken(Organization.name),
    );
    treeDictionaryModel = app.get<Model<TreeDictionary>>(
      getModelToken(TreeDictionary.name),
    );
    reviewSchemeModel = app.get<Model<ReviewScheme>>(
      getModelToken(ReviewScheme.name),
    );
    projectModel = app.get<Model<Project>>(getModelToken(Project.name));
    assignmentModel = app.get<Model<ProjectExpertAssignment>>(
      getModelToken(ProjectExpertAssignment.name),
    );
    expertReviewModel = app.get<Model<ExpertReview>>(
      getModelToken(ExpertReview.name),
    );
    models = [
      userModel,
      app.get<Model<Session>>(getModelToken(Session.name)),
      batchModel,
      organizationModel,
      treeDictionaryModel,
      reviewSchemeModel,
      projectModel,
      assignmentModel,
      expertReviewModel,
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

  it('enforces admin and review-manager permissions', async () => {
    const data = await seedReviewData();
    const adminCookie = await login(data.admin.phone);
    const clientCookie = await login(data.client.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const otherManagerCookie = await login(data.otherReviewManager.phone);

    await request(httpServer)
      .patch(`/admin/projects/${data.project.id}/review-assignment`)
      .send({ reviewManagerId: data.reviewManager.id })
      .expect(401);

    await request(httpServer)
      .patch(`/admin/projects/${data.project.id}/review-assignment`)
      .set('Cookie', clientCookie)
      .send({ reviewManagerId: data.reviewManager.id })
      .expect(403);

    await request(httpServer)
      .get('/review-manager/projects')
      .set('Cookie', clientCookie)
      .expect(403);

    await request(httpServer)
      .patch(`/admin/projects/${data.project.id}/review-assignment`)
      .set('Cookie', adminCookie)
      .send({ reviewManagerId: data.reviewManager.id })
      .expect(200);

    await request(httpServer)
      .patch(`/review-manager/projects/${data.project.id}/schedule`)
      .set('Cookie', otherManagerCookie)
      .send({ reviewLocation: 'Room B' })
      .expect(403);

    const scheduleResponse = await request(httpServer)
      .patch(`/review-manager/projects/${data.project.id}/schedule`)
      .set('Cookie', managerCookie)
      .send({
        reviewTime: '2026-08-01T09:00:00.000Z',
        reviewLocation: 'Room A',
        meetingUrl: 'https://meeting.tencent.com/test-room',
      })
      .expect(200);
    expect(getJsonBody(scheduleResponse)).toMatchObject({
      reviewLocation: 'Room A',
      meetingUrl: 'https://meeting.tencent.com/test-room',
    });

    const listResponse = await request(httpServer)
      .get('/review-manager/projects')
      .set('Cookie', managerCookie)
      .expect(200);
    expect(getJsonBody(listResponse)).toMatchObject({ total: 1 });
  });

  it('sets review manager, review scheme snapshot, and batch assignment details', async () => {
    const data = await seedReviewData();
    const adminCookie = await login(data.admin.phone);
    const inactiveProject = await createProject({
      batchId: data.batchId,
      projectNo: 'P-INACTIVE',
      name: 'Inactive Project',
      disciplineIds: [data.disciplineAId],
      isActive: false,
    });

    const wrongManagerResponse = await request(httpServer)
      .patch(`/admin/projects/${data.project.id}/review-assignment`)
      .set('Cookie', adminCookie)
      .send({ reviewManagerId: data.client.id })
      .expect(400);
    expect(getJsonBody(wrongManagerResponse).message).toContain(
      'review_manager',
    );

    const managerResponse = await request(httpServer)
      .patch(`/admin/projects/${data.project.id}/review-assignment`)
      .set('Cookie', adminCookie)
      .send({ reviewManagerId: data.reviewManager.id })
      .expect(200);
    expect(getJsonBody(managerResponse)).toMatchObject({
      reviewManagerId: data.reviewManager.id,
      reviewSchemeSnapshot: null,
    });

    const inactiveScheme = await reviewSchemeModel.create({
      name: 'Inactive Scheme',
      items: [{ name: 'x', maxScore: 1, sortOrder: 1 }],
      totalScore: 1,
      isActive: false,
    });
    await request(httpServer)
      .patch(`/admin/projects/${data.project.id}/review-assignment`)
      .set('Cookie', adminCookie)
      .send({ reviewSchemeId: inactiveScheme._id.toString() })
      .expect(400);

    const schemeResponse = await request(httpServer)
      .patch(`/admin/projects/${data.project.id}/review-assignment`)
      .set('Cookie', adminCookie)
      .send({ reviewSchemeId: data.reviewSchemeId })
      .expect(200);
    const schemeBody = getJsonBody(schemeResponse);
    expect(schemeBody.reviewSchemeId).toBe(data.reviewSchemeId);
    expect(schemeBody.reviewSchemeSnapshot).toMatchObject({
      id: data.reviewSchemeId,
      name: 'Scheme A',
      totalScore: 100,
    });
    expect(
      getRecordArray(
        schemeBody.reviewSchemeSnapshot as Record<string, unknown>,
        'items',
      ),
    ).toHaveLength(2);

    const filteredProjectsResponse = await request(httpServer)
      .get('/admin/projects')
      .query({
        reviewManagerId: data.reviewManager.id,
        reviewSchemeId: data.reviewSchemeId,
        hasReviewManager: 'true',
        hasReviewScheme: 'true',
      })
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(filteredProjectsResponse)).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 100,
    });

    const batchResponse = await request(httpServer)
      .patch('/admin/projects/review-assignment/batch')
      .set('Cookie', adminCookie)
      .send({
        projectIds: [data.project.id, inactiveProject.id],
        reviewManagerId: data.reviewManager.id,
        reviewSchemeId: data.reviewSchemeId,
      })
      .expect(200);
    expect(getJsonBody(batchResponse)).toMatchObject({
      successCount: 1,
      failedCount: 1,
    });
    expect(
      getRecordArray(getJsonBody(batchResponse), 'failures')[0],
    ).toMatchObject({
      projectId: inactiveProject.id,
      statusCode: 404,
    });
  });

  it('filters expert candidates and manages single-project expert assignments', async () => {
    const data = await seedReviewData();
    const managerCookie = await login(data.reviewManager.phone);
    const validExpert = await createUser({
      phone: '+8613900000101',
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineAId],
      name: 'Valid Expert',
    });
    const secondExpert = await createUser({
      phone: '+8613900000102',
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineAId],
      name: 'Second Expert',
    });
    const mismatchExpert = await createUser({
      phone: '+8613900000103',
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineBId],
      name: 'Mismatch Expert',
    });
    await createUser({
      phone: '+8613900000104',
      roles: ['expert'],
      organizationIds: [data.leadOrganizationId],
      disciplineIds: [data.disciplineAId],
      name: 'Lead Conflict Expert',
    });
    await createUser({
      phone: '+8613900000105',
      roles: ['expert'],
      organizationIds: [data.cooperationOrganizationId],
      disciplineIds: [data.disciplineAId],
      name: 'Cooperation Conflict Expert',
    });
    await createUser({
      phone: '+8613900000106',
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineAId],
      isActive: false,
      name: 'Inactive Expert',
    });
    await createUser({
      phone: '+8613900000107',
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [],
      name: 'No Discipline Expert',
    });
    await createUser({
      phone: '+8613900000108',
      roles: ['client'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineAId],
      name: 'Not Expert',
    });

    const candidatesResponse = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/expert-candidates`)
      .set('Cookie', managerCookie)
      .expect(200);
    const candidatesBody = getJsonBody(candidatesResponse);
    expect(candidatesBody.total).toBe(2);
    expect(
      getRecordArray(candidatesBody, 'items')
        .map((item) => item.id)
        .sort(),
    ).toEqual([secondExpert.id, validExpert.id].sort());
    expect(getRecordArray(candidatesBody, 'items')[0]).not.toHaveProperty(
      'passwordHash',
    );

    const keywordResponse = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/expert-candidates`)
      .query({ keyword: 'Second' })
      .set('Cookie', managerCookie)
      .expect(200);
    expect(getJsonBody(keywordResponse).total).toBe(1);

    const noDisciplineProject = await createProject({
      batchId: data.batchId,
      projectNo: 'P-NO-DISC',
      name: 'No Discipline Project',
      reviewManagerId: data.reviewManager.id,
    });
    const noDisciplineResponse = await request(httpServer)
      .get(
        `/review-manager/projects/${noDisciplineProject.id}/expert-candidates`,
      )
      .set('Cookie', managerCookie)
      .expect(200);
    expect(getJsonBody(noDisciplineResponse)).toMatchObject({
      total: 0,
      reason: 'project_discipline_missing',
    });

    const appendResponse = await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .send({ expertUserIds: [validExpert.id, mismatchExpert.id] })
      .expect(201);
    expect(getJsonBody(appendResponse)).toMatchObject({
      successCount: 1,
      failedCount: 1,
    });
    expect(
      getRecordArray(getJsonBody(appendResponse), 'failures')[0].reasons,
    ).toContain('discipline_mismatch');

    const assignedCandidatesResponse = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/expert-candidates`)
      .set('Cookie', managerCookie)
      .expect(200);
    const assignedCandidate = getRecordArray(
      getJsonBody(assignedCandidatesResponse),
      'items',
    ).find((item) => item.id === validExpert.id);
    expect(assignedCandidate).toMatchObject({ assigned: true });

    const listExpertsResponse = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .expect(200);
    expect(getJsonArray(listExpertsResponse)).toHaveLength(1);
    expect(getJsonArray(listExpertsResponse)[0]).toMatchObject({
      hasReviewRecord: false,
      id: validExpert.id,
      reviewStatus: null,
    });

    await request(httpServer)
      .put(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .send({ expertUserIds: [mismatchExpert.id] })
      .expect(409);
    await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        const body = getJsonArray(response);
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ id: validExpert.id });
      });

    const replaceResponse = await request(httpServer)
      .put(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .send({ expertUserIds: [secondExpert.id] })
      .expect(200);
    expect(getJsonBody(replaceResponse)).toMatchObject({
      addedOrRestoredCount: 1,
      removedCount: 1,
    });
    await expect(
      findAssignment(data.project.id, validExpert.id),
    ).resolves.toBeNull();

    await request(httpServer)
      .delete(
        `/review-manager/projects/${data.project.id}/experts/${secondExpert.id}`,
      )
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          removed: true,
          alreadyRemoved: false,
        });
      });
    await expect(
      findAssignment(data.project.id, secondExpert.id),
    ).resolves.toBeNull();

    await request(httpServer)
      .delete(
        `/review-manager/projects/${data.project.id}/experts/${secondExpert.id}`,
      )
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          removed: false,
          alreadyRemoved: false,
        });
      });

    await assignmentModel.create({
      projectId: new Types.ObjectId(data.project.id),
      expertUserId: new Types.ObjectId(secondExpert.id),
      assignedByUserId: new Types.ObjectId(data.reviewManager.id),
      status: 'removed',
      removedAt: new Date(),
      removedByUserId: new Types.ObjectId(data.reviewManager.id),
    });
    await request(httpServer)
      .delete(
        `/review-manager/projects/${data.project.id}/experts/${secondExpert.id}`,
      )
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          removed: false,
          alreadyRemoved: true,
        });
      });

    await request(httpServer)
      .post(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .send({ expertUserIds: [secondExpert.id] })
      .expect(201);
    const restored = await assignmentModel
      .findOne({
        projectId: new Types.ObjectId(data.project.id),
        expertUserId: new Types.ObjectId(secondExpert.id),
      })
      .lean()
      .exec();
    expect(restored).toMatchObject({ status: 'assigned' });
    expect(restored?.removedAt).toBeUndefined();
  });

  it('marks assigned experts with review records and blocks removing reviewed experts', async () => {
    const data = await seedReviewData();
    const managerCookie = await login(data.reviewManager.phone);
    const freshExpert = await createAssignableExpert(
      '+8613900000301',
      data,
      'Fresh Expert',
    );
    const draftExpert = await createAssignableExpert(
      '+8613900000302',
      data,
      'Draft Expert',
    );
    const submittedExpert = await createAssignableExpert(
      '+8613900000303',
      data,
      'Submitted Expert',
    );
    const returnedExpert = await createAssignableExpert(
      '+8613900000304',
      data,
      'Returned Expert',
    );

    for (const expert of [
      freshExpert,
      draftExpert,
      submittedExpert,
      returnedExpert,
    ]) {
      await createAssignment(data.project.id, expert.id, data.reviewManager.id);
    }

    await createExpertReview(data.project.id, draftExpert.id, 'draft');
    await createExpertReview(data.project.id, submittedExpert.id, 'submitted');
    await createExpertReview(data.project.id, returnedExpert.id, 'returned');

    const listResponse = await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .expect(200);
    const assignedById = new Map(
      getJsonArray(listResponse).map((item) => [String(item.id), item]),
    );
    expect(assignedById.get(freshExpert.id)).toMatchObject({
      hasReviewRecord: false,
      reviewStatus: null,
    });
    expect(assignedById.get(draftExpert.id)).toMatchObject({
      hasReviewRecord: true,
      reviewStatus: 'draft',
    });
    expect(assignedById.get(submittedExpert.id)).toMatchObject({
      hasReviewRecord: true,
      reviewStatus: 'submitted',
    });
    expect(assignedById.get(returnedExpert.id)).toMatchObject({
      hasReviewRecord: true,
      reviewStatus: 'returned',
    });
    expect(assignedById.get(draftExpert.id)).not.toHaveProperty('items');
    expect(assignedById.get(draftExpert.id)).not.toHaveProperty('totalScore');
    expect(assignedById.get(draftExpert.id)).not.toHaveProperty('submittedAt');

    for (const expert of [draftExpert, submittedExpert, returnedExpert]) {
      const response = await request(httpServer)
        .delete(
          `/review-manager/projects/${data.project.id}/experts/${expert.id}`,
        )
        .set('Cookie', managerCookie)
        .expect(409);
      expect(getJsonBody(response)).toMatchObject({
        code: 'EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD',
        message: '该专家已产生评分记录，不能移除。',
      });
      await expect(
        findAssignment(data.project.id, expert.id),
      ).resolves.toMatchObject({ status: 'assigned' });
      await expect(
        findExpertReview(data.project.id, expert.id),
      ).resolves.toMatchObject({});
    }
  });

  it('allows removing an expert assignment after the expert deletes a draft review', async () => {
    const data = await seedReviewData();
    const managerCookie = await login(data.reviewManager.phone);
    const draftExpert = await createAssignableExpert(
      '+8613900000311',
      data,
      'Draft Removal Expert',
    );
    const expertCookie = await login(draftExpert.phone);

    await createAssignment(
      data.project.id,
      draftExpert.id,
      data.reviewManager.id,
    );
    await createExpertReview(data.project.id, draftExpert.id, 'draft');

    await request(httpServer)
      .delete(`/expert/review-tasks/${data.project.id}/draft`)
      .set('Cookie', expertCookie)
      .expect(204);
    await expect(
      findExpertReview(data.project.id, draftExpert.id),
    ).resolves.toBeNull();

    await request(httpServer)
      .delete(
        `/review-manager/projects/${data.project.id}/experts/${draftExpert.id}`,
      )
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          removed: true,
          alreadyRemoved: false,
        });
      });
    await expect(
      findAssignment(data.project.id, draftExpert.id),
    ).resolves.toBeNull();
  });

  it('blocks replace when it would remove experts with review records without partial updates', async () => {
    const data = await seedReviewData();
    const managerCookie = await login(data.reviewManager.phone);
    const lockedExpert = await createAssignableExpert(
      '+8613900000321',
      data,
      'Locked Expert',
    );
    const replacementExpert = await createAssignableExpert(
      '+8613900000322',
      data,
      'Replacement Expert',
    );

    await createAssignment(
      data.project.id,
      lockedExpert.id,
      data.reviewManager.id,
    );
    await createExpertReview(data.project.id, lockedExpert.id, 'submitted');

    const replaceResponse = await request(httpServer)
      .put(`/review-manager/projects/${data.project.id}/experts`)
      .set('Cookie', managerCookie)
      .send({ expertUserIds: [replacementExpert.id] })
      .expect(409);
    expect(getJsonBody(replaceResponse)).toMatchObject({
      code: 'EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD',
      message: '部分专家已产生评分记录，不能移除。',
    });
    await expect(
      findAssignment(data.project.id, lockedExpert.id),
    ).resolves.toMatchObject({ status: 'assigned' });
    await expect(
      findAssignment(data.project.id, replacementExpert.id),
    ).resolves.toBeNull();
    await expect(
      findExpertReview(data.project.id, lockedExpert.id),
    ).resolves.toMatchObject({ status: 'submitted' });
  });

  it('keeps batch replace project-level failures isolated when assignments have review records', async () => {
    const data = await seedReviewData();
    const managerCookie = await login(data.reviewManager.phone);
    const lockedExpert = await createAssignableExpert(
      '+8613900000331',
      data,
      'Batch Locked Expert',
    );
    const removableExpert = await createAssignableExpert(
      '+8613900000332',
      data,
      'Batch Removable Expert',
    );
    const replacementExpert = await createAssignableExpert(
      '+8613900000333',
      data,
      'Batch Replacement Expert',
    );
    const replaceableProject = await createProject({
      batchId: data.batchId,
      projectNo: 'P-BATCH-REPLACE',
      name: 'Batch Replace Project',
      disciplineIds: [data.disciplineAId],
      reviewManagerId: data.reviewManager.id,
    });

    await createAssignment(
      data.project.id,
      lockedExpert.id,
      data.reviewManager.id,
    );
    await createAssignment(
      replaceableProject.id,
      removableExpert.id,
      data.reviewManager.id,
    );
    await createExpertReview(data.project.id, lockedExpert.id, 'returned');

    const response = await request(httpServer)
      .put('/review-manager/projects/experts/batch')
      .set('Cookie', managerCookie)
      .send({
        projectIds: [data.project.id, replaceableProject.id],
        expertUserIds: [replacementExpert.id],
        mode: 'replace',
      })
      .expect(200);
    const body = getJsonBody(response);
    expect(body).toMatchObject({ successCount: 1, failedCount: 1 });
    const results = getRecordArray(body, 'results');
    expect(
      results.find((item) => item.projectId === data.project.id),
    ).toMatchObject({
      success: false,
      message: '部分专家已产生评分记录，不能移除。',
    });
    expect(
      results.find((item) => item.projectId === replaceableProject.id),
    ).toMatchObject({
      success: true,
      removedCount: 1,
    });
    await expect(
      findAssignment(data.project.id, lockedExpert.id),
    ).resolves.toMatchObject({ status: 'assigned' });
    await expect(
      findAssignment(data.project.id, replacementExpert.id),
    ).resolves.toBeNull();
    await expect(
      findAssignment(replaceableProject.id, removableExpert.id),
    ).resolves.toBeNull();
    await expect(
      findAssignment(replaceableProject.id, replacementExpert.id),
    ).resolves.toMatchObject({ status: 'assigned' });
  });

  it('handles batch expert assignment per project', async () => {
    const data = await seedReviewData();
    const managerCookie = await login(data.reviewManager.phone);
    const expertA = await createUser({
      phone: '+8613900000201',
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineAId],
      name: 'Expert A',
    });
    const expertB = await createUser({
      phone: '+8613900000202',
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineBId],
      name: 'Expert B',
    });
    const projectB = await createProject({
      batchId: data.batchId,
      projectNo: 'P-B',
      name: 'Project B',
      disciplineIds: [data.disciplineBId],
      reviewManagerId: data.reviewManager.id,
    });
    const otherManagerProject = await createProject({
      batchId: data.batchId,
      projectNo: 'P-OTHER-MANAGER',
      name: 'Other Manager Project',
      disciplineIds: [data.disciplineAId],
      reviewManagerId: data.otherReviewManager.id,
    });

    const appendResponse = await request(httpServer)
      .put('/review-manager/projects/experts/batch')
      .set('Cookie', managerCookie)
      .send({
        projectIds: [data.project.id, projectB.id, otherManagerProject.id],
        expertUserIds: [expertA.id],
        mode: 'append',
      })
      .expect(200);
    const appendBody = getJsonBody(appendResponse);
    expect(appendBody).toMatchObject({ successCount: 1, failedCount: 2 });
    const appendResults = getRecordArray(appendBody, 'results');
    expect(
      appendResults.find((item) => item.projectId === data.project.id),
    ).toMatchObject({ success: true, assignedCount: 1 });
    expect(
      appendResults.find((item) => item.projectId === projectB.id),
    ).toMatchObject({ success: false });
    expect(
      getRecordArray(
        appendResults.find((item) => item.projectId === projectB.id) ?? {},
        'failures',
      )[0].reasons,
    ).toContain('discipline_mismatch');
    expect(
      appendResults.find((item) => item.projectId === otherManagerProject.id),
    ).toMatchObject({ success: false });

    const replaceResponse = await request(httpServer)
      .put('/review-manager/projects/experts/batch')
      .set('Cookie', managerCookie)
      .send({
        projectIds: [data.project.id, projectB.id],
        expertUserIds: [expertB.id],
        mode: 'replace',
      })
      .expect(200);
    const replaceBody = getJsonBody(replaceResponse);
    expect(replaceBody).toMatchObject({ successCount: 1, failedCount: 1 });
    expect(
      getRecordArray(replaceBody, 'results').find(
        (item) => item.projectId === projectB.id,
      ),
    ).toMatchObject({ success: true, assignedCount: 1 });
  });

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }

  async function seedReviewData(): Promise<{
    admin: { id: string; phone: string };
    client: { id: string; phone: string };
    reviewManager: { id: string; phone: string };
    otherReviewManager: { id: string; phone: string };
    batchId: string;
    disciplineAId: string;
    disciplineBId: string;
    leadOrganizationId: string;
    cooperationOrganizationId: string;
    otherOrganizationId: string;
    reviewSchemeId: string;
    project: { id: string };
  }> {
    const admin = await createUser({
      phone: '+8613900000001',
      roles: ['admin'],
    });
    const client = await createUser({
      phone: '+8613900000002',
      roles: ['client'],
    });
    const reviewManager = await createUser({
      phone: '+8613900000003',
      roles: ['review_manager'],
    });
    const otherReviewManager = await createUser({
      phone: '+8613900000004',
      roles: ['review_manager'],
    });
    const batch = await batchModel.create({ name: '2026', year: 2026 });
    const disciplineA = await treeDictionaryModel.create({
      treeType: 'discipline',
      name: 'Discipline A',
      pathIds: [],
      level: 1,
    });
    const disciplineB = await treeDictionaryModel.create({
      treeType: 'discipline',
      name: 'Discipline B',
      pathIds: [],
      level: 1,
    });
    const leadOrganization = await organizationModel.create({
      name: 'Lead Org',
    });
    const cooperationOrganization = await organizationModel.create({
      name: 'Cooperation Org',
    });
    const otherOrganization = await organizationModel.create({
      name: 'Other Org',
    });
    const reviewScheme = await reviewSchemeModel.create({
      name: 'Scheme A',
      items: [
        { name: 'Tech', maxScore: 60, sortOrder: 1 },
        { name: 'Finance', maxScore: 40, sortOrder: 2 },
      ],
      totalScore: 100,
      isActive: true,
    });
    const project = await createProject({
      batchId: batch._id.toString(),
      projectNo: 'P-A',
      name: 'Project A',
      disciplineIds: [disciplineA._id.toString()],
      leadOrganizationId: leadOrganization._id.toString(),
      cooperationOrganizationIds: [cooperationOrganization._id.toString()],
      reviewManagerId: reviewManager.id,
    });

    return {
      admin,
      client,
      reviewManager,
      otherReviewManager,
      batchId: batch._id.toString(),
      disciplineAId: disciplineA._id.toString(),
      disciplineBId: disciplineB._id.toString(),
      leadOrganizationId: leadOrganization._id.toString(),
      cooperationOrganizationId: cooperationOrganization._id.toString(),
      otherOrganizationId: otherOrganization._id.toString(),
      reviewSchemeId: reviewScheme._id.toString(),
      project,
    };
  }

  async function createUser(input: {
    phone: string;
    roles: string[];
    organizationIds?: string[];
    disciplineIds?: string[];
    isActive?: boolean;
    name?: string;
  }): Promise<{ id: string; phone: string }> {
    const userId = new Types.ObjectId();

    await userModel.create({
      _id: userId,
      phone: input.phone,
      passwordHash: await hash('correct-password', 4),
      name: input.name ?? 'Test User',
      roles: input.roles,
      organizationIds: (input.organizationIds ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
      disciplineIds: (input.disciplineIds ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
      status: 'active',
      isActive: input.isActive ?? true,
    });

    return { id: userId.toString(), phone: input.phone };
  }

  async function createAssignableExpert(
    phone: string,
    data: {
      disciplineAId: string;
      otherOrganizationId: string;
    },
    name: string,
  ): Promise<{ id: string; phone: string }> {
    return createUser({
      phone,
      roles: ['expert'],
      organizationIds: [data.otherOrganizationId],
      disciplineIds: [data.disciplineAId],
      name,
    });
  }

  async function createAssignment(
    projectId: string,
    expertUserId: string,
    assignedByUserId: string,
  ): Promise<void> {
    await assignmentModel.create({
      projectId: new Types.ObjectId(projectId),
      expertUserId: new Types.ObjectId(expertUserId),
      assignedByUserId: new Types.ObjectId(assignedByUserId),
      status: 'assigned',
    });
  }

  async function createExpertReview(
    projectId: string,
    expertUserId: string,
    status: ExpertReviewStatus,
  ): Promise<void> {
    const submittedFields =
      status === 'submitted' || status === 'returned'
        ? { submittedAt: new Date() }
        : {};
    const returnedFields =
      status === 'returned'
        ? {
            returnedAt: new Date(),
            returnedByUserId: new Types.ObjectId(),
            returnReason: '需要补充说明',
          }
        : {};

    await expertReviewModel.create({
      projectId: new Types.ObjectId(projectId),
      expertUserId: new Types.ObjectId(expertUserId),
      reviewSchemeSnapshot: createReviewSchemeSnapshot(),
      items: [],
      totalScore: 0,
      status,
      ...submittedFields,
      ...returnedFields,
    });
  }

  async function findAssignment(
    projectId: string,
    expertUserId: string,
  ): Promise<{ status: string; removedAt?: Date | null } | null> {
    return assignmentModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        expertUserId: new Types.ObjectId(expertUserId),
      })
      .select({ status: 1, removedAt: 1 })
      .lean<{ status: string; removedAt?: Date | null } | null>()
      .exec();
  }

  async function findExpertReview(
    projectId: string,
    expertUserId: string,
  ): Promise<{ status: ExpertReviewStatus } | null> {
    return expertReviewModel
      .findOne({
        projectId: new Types.ObjectId(projectId),
        expertUserId: new Types.ObjectId(expertUserId),
      })
      .select({ status: 1 })
      .lean<{ status: ExpertReviewStatus } | null>()
      .exec();
  }

  async function createProject(input: {
    batchId: string;
    projectNo: string;
    name: string;
    disciplineIds?: string[];
    leadOrganizationId?: string;
    cooperationOrganizationIds?: string[];
    reviewManagerId?: string;
    isActive?: boolean;
  }): Promise<{ id: string }> {
    const project = await projectModel.create({
      batchId: new Types.ObjectId(input.batchId),
      projectNo: input.projectNo,
      name: input.name,
      disciplineIds: (input.disciplineIds ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
      leadOrganizationId: input.leadOrganizationId
        ? new Types.ObjectId(input.leadOrganizationId)
        : null,
      cooperationOrganizationIds: (input.cooperationOrganizationIds ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
      reviewManagerId: input.reviewManagerId
        ? new Types.ObjectId(input.reviewManagerId)
        : null,
      isActive: input.isActive ?? true,
    });

    return { id: project._id.toString() };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

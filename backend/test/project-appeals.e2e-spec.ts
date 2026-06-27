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
import { ProjectAppealAttachment } from '../src/modules/project-appeals/schemas/project-appeal-attachment.schema';
import { ProjectAppeal } from '../src/modules/project-appeals/schemas/project-appeal.schema';
import { ProjectLevelChangeLog } from '../src/modules/project-appeals/schemas/project-level-change-log.schema';
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

type SeedData = {
  admin: TestUser;
  client: TestUser;
  owner: TestUser;
  otherOwner: TestUser;
  reviewManager: TestUser;
  otherReviewManager: TestUser;
  batchId: string;
  project: { id: string };
  consensusFallbackProject: { id: string };
  unconfirmedProject: { id: string };
  missingFinalLevelProject: { id: string };
};

describe('Project appeal APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let batchModel: Model<Batch>;
  let dictionaryModel: Model<Dictionary>;
  let projectModel: Model<Project>;
  let consensusReviewModel: Model<ConsensusReview>;
  let appealModel: Model<ProjectAppeal>;
  let attachmentModel: Model<ProjectAppealAttachment>;
  let levelChangeLogModel: Model<ProjectLevelChangeLog>;
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
    consensusReviewModel = app.get<Model<ConsensusReview>>(
      getModelToken(ConsensusReview.name),
    );
    appealModel = app.get<Model<ProjectAppeal>>(
      getModelToken(ProjectAppeal.name),
    );
    attachmentModel = app.get<Model<ProjectAppealAttachment>>(
      getModelToken(ProjectAppealAttachment.name),
    );
    levelChangeLogModel = app.get<Model<ProjectLevelChangeLog>>(
      getModelToken(ProjectLevelChangeLog.name),
    );
    models = [
      userModel,
      sessionModel,
      batchModel,
      dictionaryModel,
      projectModel,
      consensusReviewModel,
      appealModel,
      attachmentModel,
      levelChangeLogModel,
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

  it('lets project owners view confirmed consensus and create eligible appeals only', async () => {
    const data = await seedData();
    const clientCookie = await login(data.client.phone);
    const ownerCookie = await login(data.owner.phone);
    const otherOwnerCookie = await login(data.otherOwner.phone);

    await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/consensus`)
      .expect(401);

    await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/consensus`)
      .set('Cookie', clientCookie)
      .expect(403);

    await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/consensus`)
      .set('Cookie', otherOwnerCookie)
      .expect(403);

    await request(httpServer)
      .get(`/project-owner/projects/${data.unconfirmedProject.id}/consensus`)
      .set('Cookie', ownerCookie)
      .expect(404);

    const consensusResponse = await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/consensus`)
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonBody(consensusResponse)).toMatchObject({
      projectId: data.project.id,
      finalOpinion: '同意通过',
      finalScore: 82,
      finalLevel: 'A',
      confirmedByUserId: data.reviewManager.id,
      confirmedByUser: {
        id: data.reviewManager.id,
        name: data.reviewManager.name,
        phone: data.reviewManager.phone,
      },
      expertReviewStats: {
        expertCount: 2,
        submittedCount: 2,
      },
    });

    const emptyHistoryResponse = await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/level-history`)
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonArray(emptyHistoryResponse)).toHaveLength(0);

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/appeals`)
      .set('Cookie', ownerCookie)
      .send({ reason: '' })
      .expect(400);

    await request(httpServer)
      .post(`/project-owner/projects/${data.unconfirmedProject.id}/appeals`)
      .set('Cookie', ownerCookie)
      .send({ reason: '尚未确认合议，不允许申诉' })
      .expect(409);

    await request(httpServer)
      .post(
        `/project-owner/projects/${data.missingFinalLevelProject.id}/appeals`,
      )
      .set('Cookie', ownerCookie)
      .send({ reason: '缺少项目当前等级，不允许申诉' })
      .expect(409);

    const fallbackAppealResponse = await request(httpServer)
      .post(
        `/project-owner/projects/${data.consensusFallbackProject.id}/appeals`,
      )
      .set('Cookie', ownerCookie)
      .send({ reason: '项目主表缺少等级，但合议已有等级' })
      .expect(201);
    expect(getJsonBody(fallbackAppealResponse)).toMatchObject({
      projectId: data.consensusFallbackProject.id,
      appealNo: 1,
      levelBeforeAppeal: 'A',
    });

    const fallbackProject = await projectModel
      .findById(data.consensusFallbackProject.id)
      .lean<Project | null>()
      .exec();
    expect(fallbackProject).toMatchObject({
      finalLevel: 'A',
      originalLevel: 'A',
    });
    expect(
      await levelChangeLogModel
        .countDocuments({
          projectId: new Types.ObjectId(data.consensusFallbackProject.id),
        })
        .exec(),
    ).toBe(0);

    const appealResponse = await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/appeals`)
      .set('Cookie', ownerCookie)
      .send({ reason: '  等级偏低，请复核。  ' })
      .expect(201);
    const appeal = getJsonBody(appealResponse);
    expect(appeal).toMatchObject({
      projectId: data.project.id,
      appealNo: 1,
      submittedByUserId: data.owner.id,
      reason: '等级偏低，请复核。',
      status: 'submitted',
      levelBeforeAppeal: 'A',
      causedLevelChange: false,
      attachmentCount: 0,
    });

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/appeals`)
      .set('Cookie', ownerCookie)
      .send({ reason: '仍未处理，不能重复申诉' })
      .expect(409);

    const listResponse = await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/appeals`)
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonArray(listResponse)).toHaveLength(1);

    await request(httpServer)
      .get(
        `/project-owner/projects/${data.project.id}/appeals/${getString(
          appeal,
          'id',
        )}`,
      )
      .set('Cookie', ownerCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          appealNo: 1,
          attachmentCount: 0,
        });
      });
  });

  it('uploads appeal attachments through fake storage, signs URLs, and soft deletes only while submitted', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);
    const otherOwnerCookie = await login(data.otherOwner.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const adminCookie = await login(data.admin.phone);
    const appeal = await createAppeal(ownerCookie, data.project.id);
    const appealId = getString(appeal, 'id');

    await request(httpServer)
      .post(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', otherOwnerCookie)
      .attach('files', Buffer.from('content'), 'proof.pdf')
      .expect(403);

    await request(httpServer)
      .post(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', ownerCookie)
      .expect(400);

    await request(httpServer)
      .post(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', ownerCookie)
      .attach('files', Buffer.from('bad'), 'run.exe')
      .expect(400);

    await request(httpServer)
      .post(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', ownerCookie)
      .attach('files', Buffer.alloc(0), 'empty.pdf')
      .expect(400);

    const uploadResponse = await request(httpServer)
      .post(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', ownerCookie)
      .field('remark', '  复核补充材料  ')
      .attach('files', Buffer.from('pdf-content'), 'proof.pdf')
      .attach('files', Buffer.from('docx-content'), 'explain.docx')
      .expect(201);
    const uploadBody = getJsonBody(uploadResponse);
    expect(uploadBody).toMatchObject({
      successCount: 2,
      failedCount: 0,
      failures: [],
    });

    const attachments = getRecordArray(uploadBody, 'attachments');
    expect(attachments[0]).toMatchObject({
      appealId,
      projectId: data.project.id,
      uploadedByUserId: data.owner.id,
      storageDriver: 'fake',
      remark: '复核补充材料',
      status: 'active',
    });
    expect(getString(attachments[0], 'objectKey')).toContain(
      `/projects/${data.project.id}/appeals/${appealId}/`,
    );
    expect(getString(attachments[0], 'sha256')).toHaveLength(64);

    const storedAttachment = await attachmentModel
      .findById(getString(attachments[0], 'id'))
      .lean<Record<string, unknown> | null>()
      .exec();
    expect(storedAttachment).toMatchObject({
      objectKey: getString(attachments[0], 'objectKey'),
      sizeBytes: attachments[0].sizeBytes,
    });
    expect(storedAttachment).not.toHaveProperty('buffer');
    expect(storedAttachment).not.toHaveProperty('file');

    await request(httpServer)
      .get(
        `/review-manager/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(2);
      });

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/appeals/${appealId}/attachments`)
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(2);
      });

    const attachmentId = getString(attachments[0], 'id');
    const urlResponse = await request(httpServer)
      .get(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments/${attachmentId}/download-url`,
      )
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getString(getJsonBody(urlResponse), 'url')).toContain(
      'https://fake-storage.local/',
    );

    await request(httpServer)
      .get(
        `/admin/projects/${data.project.id}/appeals/${appealId}/attachments/${attachmentId}/download-url`,
      )
      .set('Cookie', adminCookie)
      .expect(200);

    const deleteResponse = await request(httpServer)
      .delete(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments/${attachmentId}`,
      )
      .set('Cookie', ownerCookie)
      .expect(200);
    expect(getJsonBody(deleteResponse)).toMatchObject({
      deleted: true,
      alreadyDeleted: false,
    });

    await request(httpServer)
      .delete(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments/${attachmentId}`,
      )
      .set('Cookie', ownerCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          deleted: false,
          alreadyDeleted: true,
        });
      });

    await request(httpServer)
      .get(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments/${attachmentId}/download-url`,
      )
      .set('Cookie', ownerCookie)
      .expect(404);

    await request(httpServer)
      .get(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', ownerCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(1);
      });

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/appeals/${appealId}/handle`,
      )
      .set('Cookie', managerCookie)
      .send({ decision: 'rejected', handlingOpinion: '材料不足，驳回' })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'rejected',
          causedLevelChange: false,
          levelAfterHandling: 'A',
        });
      });

    await request(httpServer)
      .post(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', ownerCookie)
      .attach('files', Buffer.from('late'), 'late.pdf')
      .expect(409);

    const remainingAttachmentId = getString(attachments[1], 'id');
    await request(httpServer)
      .delete(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments/${remainingAttachmentId}`,
      )
      .set('Cookie', ownerCookie)
      .expect(409);
  });

  it('normalizes mojibake Chinese appeal attachment filenames on upload and list', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const appeal = await createAppeal(ownerCookie, data.project.id);
    const appealId = getString(appeal, 'id');
    const boundary = '----reviewx-appeal-filename-test';
    const filename = '申诉补充材料-测试.pdf';

    const uploadResponse = await request(httpServer)
      .post(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', ownerCookie)
      .set('Content-Type', `multipart/form-data; boundary=${boundary}`)
      .send(
        buildMultipartAppealAttachmentUploadBody({
          boundary,
          filename,
          remark: '  中文附件备注  ',
          contentType: 'application/pdf',
          content: 'appeal-pdf-content',
        }),
      )
      .expect(201);
    const uploadBody = getJsonBody(uploadResponse);
    const attachment = getRecordArray(uploadBody, 'attachments')[0];

    if (!attachment) {
      throw new Error('uploaded appeal attachment is required');
    }

    expect(uploadBody).toMatchObject({
      successCount: 1,
      failedCount: 0,
      failures: [],
    });
    expect(attachment).toMatchObject({
      appealId,
      projectId: data.project.id,
      originalFilename: filename,
      remark: '中文附件备注',
      status: 'active',
    });
    expect(getString(attachment, 'objectKey')).toContain(
      `/projects/${data.project.id}/appeals/${appealId}/`,
    );
    expect(getString(attachment, 'objectKey')).toContain(
      `-${getString(attachment, 'safeFilename')}`,
    );
    expect(getString(attachment, 'objectKey')).not.toContain('ç');

    const storedAttachment = await attachmentModel
      .findById(getString(attachment, 'id'))
      .lean<Record<string, unknown> | null>()
      .exec();
    expect(storedAttachment).toMatchObject({
      originalFilename: filename,
      safeFilename: getString(attachment, 'safeFilename'),
      objectKey: getString(attachment, 'objectKey'),
    });

    const listResponse = await request(httpServer)
      .get(
        `/review-manager/projects/${data.project.id}/appeals/${appealId}/attachments`,
      )
      .set('Cookie', managerCookie)
      .expect(200);
    const listedAttachment = getJsonArray(listResponse)[0];

    if (!listedAttachment) {
      throw new Error('listed appeal attachment is required');
    }

    expect(listedAttachment).toMatchObject({
      originalFilename: filename,
      safeFilename: getString(attachment, 'safeFilename'),
    });

    await request(httpServer)
      .get(
        `/project-owner/projects/${data.project.id}/appeals/${appealId}/attachments/${getString(
          attachment,
          'id',
        )}/download-url`,
      )
      .set('Cookie', ownerCookie)
      .expect(200);
  });

  it('lets review managers and admins handle appeals, writes level change logs, and enforces max 3 appeals', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const otherManagerCookie = await login(data.otherReviewManager.phone);
    const adminCookie = await login(data.admin.phone);
    const clientCookie = await login(data.client.phone);
    const firstAppeal = await createAppeal(
      ownerCookie,
      data.project.id,
      '第一次申诉',
    );

    await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/appeals`)
      .set('Cookie', otherManagerCookie)
      .expect(403);

    await request(httpServer)
      .get(`/review-manager/projects/${data.project.id}/appeals`)
      .set('Cookie', managerCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(1);
      });

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/appeals`)
      .set('Cookie', clientCookie)
      .expect(403);

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/appeals`)
      .expect(401);

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/appeals`)
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(1);
      });

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/appeals/${getString(
          firstAppeal,
          'id',
        )}/handle`,
      )
      .set('Cookie', managerCookie)
      .send({ decision: 'accepted', handlingOpinion: '申诉有效，等级不变' })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'accepted',
          causedLevelChange: false,
          levelAfterHandling: 'A',
        });
      });

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/appeals/${getString(
          firstAppeal,
          'id',
        )}/handle`,
      )
      .set('Cookie', managerCookie)
      .send({ decision: 'rejected', handlingOpinion: '重复处理' })
      .expect(409);

    expect(await levelChangeLogModel.countDocuments({}).exec()).toBe(0);

    const secondAppeal = await createAppeal(
      ownerCookie,
      data.project.id,
      '第二次申诉',
    );

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/appeals/${getString(
          secondAppeal,
          'id',
        )}/handle`,
      )
      .set('Cookie', managerCookie)
      .send({
        decision: 'accepted',
        handlingOpinion: '非法等级',
        newFinalLevel: 'Z',
      })
      .expect(400);

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/appeals/${getString(
          secondAppeal,
          'id',
        )}/handle`,
      )
      .set('Cookie', managerCookie)
      .send({
        decision: 'accepted',
        handlingOpinion: '申诉有效，调整为 B',
        newFinalLevel: 'B',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'accepted',
          causedLevelChange: true,
          levelBeforeAppeal: 'A',
          levelAfterHandling: 'B',
        });
      });

    const storedProject = await projectModel
      .findById(data.project.id)
      .lean<Project | null>()
      .exec();
    expect(storedProject).toMatchObject({
      finalLevel: 'B',
      originalLevel: 'A',
    });

    const consensus = await consensusReviewModel
      .findOne({ projectId: new Types.ObjectId(data.project.id) })
      .lean<ConsensusReview | null>()
      .exec();
    expect(consensus).toMatchObject({
      finalLevel: 'A',
      originalLevel: 'A',
    });

    const historyResponse = await request(httpServer)
      .get(`/project-owner/projects/${data.project.id}/level-history`)
      .set('Cookie', ownerCookie)
      .expect(200);
    const history = getJsonArray(historyResponse);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      projectId: data.project.id,
      appealId: getString(secondAppeal, 'id'),
      fromLevel: 'A',
      toLevel: 'B',
      source: 'appeal_handling',
      reason: '申诉有效，调整为 B',
      changedByUserId: data.reviewManager.id,
    });

    await request(httpServer)
      .get(`/admin/projects/${data.project.id}/level-history`)
      .set('Cookie', adminCookie)
      .expect(200)
      .expect((response) => {
        expect(getJsonArray(response)).toHaveLength(1);
      });

    const thirdAppeal = await createAppeal(
      ownerCookie,
      data.project.id,
      '第三次申诉',
    );

    await request(httpServer)
      .post(
        `/admin/projects/${data.project.id}/appeals/${getString(
          thirdAppeal,
          'id',
        )}/handle`,
      )
      .set('Cookie', adminCookie)
      .send({ decision: 'rejected', handlingOpinion: '管理员兜底驳回' })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'rejected',
          handledByUserId: data.admin.id,
          causedLevelChange: false,
          levelAfterHandling: 'B',
        });
      });

    await request(httpServer)
      .post(`/project-owner/projects/${data.project.id}/appeals`)
      .set('Cookie', ownerCookie)
      .send({ reason: '第四次申诉不允许' })
      .expect(409);
  });

  it('handles historical appeals when project finalLevel is missing', async () => {
    const data = await seedData();
    const ownerCookie = await login(data.owner.phone);
    const managerCookie = await login(data.reviewManager.phone);
    const appeal = await createAppeal(ownerCookie, data.project.id, '历史申诉');

    await projectModel
      .updateOne(
        { _id: new Types.ObjectId(data.project.id) },
        { $set: { finalLevel: '', originalLevel: '' } },
      )
      .exec();
    await consensusReviewModel
      .updateOne(
        { projectId: new Types.ObjectId(data.project.id) },
        { $set: { finalLevel: '', originalLevel: '' } },
      )
      .exec();

    await request(httpServer)
      .post(
        `/review-manager/projects/${data.project.id}/appeals/${getString(
          appeal,
          'id',
        )}/handle`,
      )
      .set('Cookie', managerCookie)
      .send({ decision: 'rejected', handlingOpinion: '历史数据兜底驳回' })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'rejected',
          causedLevelChange: false,
          levelAfterHandling: 'A',
        });
      });

    const storedProject = await projectModel
      .findById(data.project.id)
      .lean<Project | null>()
      .exec();
    expect(storedProject).toMatchObject({
      finalLevel: 'A',
      originalLevel: 'A',
    });
    expect(await levelChangeLogModel.countDocuments({}).exec()).toBe(0);
  });

  async function seedData(): Promise<SeedData> {
    const admin = await createUser('+8613850000001', ['admin']);
    const client = await createUser('+8613850000002', ['client']);
    const owner = await createUser('+8613850000003', ['project_owner']);
    const otherOwner = await createUser('+8613850000004', ['project_owner']);
    const reviewManager = await createUser('+8613850000005', [
      'review_manager',
    ]);
    const otherReviewManager = await createUser('+8613850000006', [
      'review_manager',
    ]);
    const batch = await batchModel.create({
      name: '2026',
      year: 2026,
      isActive: true,
    });
    const project = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-APPEAL-001',
      name: '申诉项目',
      ownerUserId: new Types.ObjectId(owner.id),
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      finalLevel: 'A',
      originalLevel: 'A',
      isActive: true,
    });
    const unconfirmedProject = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-APPEAL-002',
      name: '未确认合议项目',
      ownerUserId: new Types.ObjectId(owner.id),
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      isActive: true,
    });
    const consensusFallbackProject = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-APPEAL-003',
      name: '合议等级兜底项目',
      ownerUserId: new Types.ObjectId(owner.id),
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      isActive: true,
    });
    const missingFinalLevelProject = await projectModel.create({
      batchId: batch._id,
      projectNo: 'P-APPEAL-004',
      name: '缺少等级项目',
      ownerUserId: new Types.ObjectId(owner.id),
      reviewManagerId: new Types.ObjectId(reviewManager.id),
      isActive: true,
    });

    await seedConsensus(project._id, reviewManager.id, 'confirmed');
    await seedConsensus(unconfirmedProject._id, reviewManager.id, 'draft');
    await seedConsensus(
      consensusFallbackProject._id,
      reviewManager.id,
      'confirmed',
    );
    await seedConsensus(
      missingFinalLevelProject._id,
      reviewManager.id,
      'confirmed',
      '',
    );

    return {
      admin,
      client,
      owner,
      otherOwner,
      reviewManager,
      otherReviewManager,
      batchId: batch._id.toString(),
      project: { id: project._id.toString() },
      consensusFallbackProject: {
        id: consensusFallbackProject._id.toString(),
      },
      unconfirmedProject: { id: unconfirmedProject._id.toString() },
      missingFinalLevelProject: {
        id: missingFinalLevelProject._id.toString(),
      },
    };
  }

  async function seedConsensus(
    projectId: Types.ObjectId,
    reviewManagerId: string,
    status: 'draft' | 'confirmed',
    finalLevel = status === 'confirmed' ? 'A' : '',
  ): Promise<void> {
    await consensusReviewModel.create({
      projectId,
      reviewSchemeSnapshot: {
        id: new Types.ObjectId().toString(),
        name: '申诉测试方案',
        totalScore: 100,
        items: [],
      },
      draftGeneratedAt: new Date(),
      draftGeneratedByUserId: new Types.ObjectId(reviewManagerId),
      draftSource: 'manual',
      draftOpinion: '草稿意见',
      draftScore: 80,
      finalOpinion: status === 'confirmed' ? '同意通过' : '',
      finalScore: status === 'confirmed' ? 82 : null,
      finalLevel: status === 'confirmed' ? finalLevel : '',
      originalLevel: status === 'confirmed' ? finalLevel : '',
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

  async function createUser(phone: string, roles: string[]): Promise<TestUser> {
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

  async function createAppeal(
    cookie: string,
    projectId: string,
    reason = '申诉说明',
  ): Promise<Record<string, unknown>> {
    const response = await request(httpServer)
      .post(`/project-owner/projects/${projectId}/appeals`)
      .set('Cookie', cookie)
      .send({ reason })
      .expect(201);

    return getJsonBody(response);
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

function buildMultipartAppealAttachmentUploadBody(input: {
  boundary: string;
  filename: string;
  remark: string;
  contentType: string;
  content: string;
}): Buffer {
  return Buffer.concat([
    Buffer.from(
      `--${input.boundary}\r\n` +
        'Content-Disposition: form-data; name="remark"\r\n\r\n' +
        `${input.remark}\r\n` +
        `--${input.boundary}\r\n` +
        'Content-Disposition: form-data; name="files"; filename="',
      'utf8',
    ),
    Buffer.from(input.filename, 'utf8'),
    Buffer.from(
      `"\r\nContent-Type: ${input.contentType}\r\n\r\n` +
        `${input.content}\r\n` +
        `--${input.boundary}--\r\n`,
      'utf8',
    ),
  ]);
}

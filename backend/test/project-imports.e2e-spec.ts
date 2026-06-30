import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { Connection, Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import * as XLSX from 'xlsx';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Batch } from '../src/modules/batches/schemas/batch.schema';
import { Dictionary } from '../src/modules/dictionaries/schemas/dictionary.schema';
import { Organization } from '../src/modules/organizations/schemas/organization.schema';
import { BATCH_INACTIVE_FOR_PROJECT_IMPORT } from '../src/modules/project-imports/constants/project-import-error-codes';
import { ProjectImportFieldMapping } from '../src/modules/project-imports/schemas/project-import-field-mapping.schema';
import { ProjectImportJob } from '../src/modules/project-imports/schemas/project-import-job.schema';
import { ProjectImportRow } from '../src/modules/project-imports/schemas/project-import-row.schema';
import { Project } from '../src/modules/projects/schemas/project.schema';
import { ReviewScheme } from '../src/modules/review-schemes/schemas/review-scheme.schema';
import { Session } from '../src/modules/sessions/schemas/session.schema';
import { TreeDictionary } from '../src/modules/tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../src/modules/users/schemas/user.schema';

process.env.NODE_ENV = 'test';

jest.setTimeout(30000);

type SeedData = {
  batchId: string;
  projectTypeId: string;
  statusId: string;
  disciplineId: string;
  departmentId: string;
  leadOrganizationId: string;
  cooperationOrganizationId: string;
  secondCooperationOrganizationId: string;
  ownerUserId: string;
};

describe('Project import admin APIs (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let connection: Connection;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let batchModel: Model<Batch>;
  let dictionaryModel: Model<Dictionary>;
  let treeDictionaryModel: Model<TreeDictionary>;
  let organizationModel: Model<Organization>;
  let reviewSchemeModel: Model<ReviewScheme>;
  let projectModel: Model<Project>;
  let fieldMappingModel: Model<ProjectImportFieldMapping>;
  let importJobModel: Model<ProjectImportJob>;
  let importRowModel: Model<ProjectImportRow>;
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
    treeDictionaryModel = app.get<Model<TreeDictionary>>(
      getModelToken(TreeDictionary.name),
    );
    organizationModel = app.get<Model<Organization>>(
      getModelToken(Organization.name),
    );
    reviewSchemeModel = app.get<Model<ReviewScheme>>(
      getModelToken(ReviewScheme.name),
    );
    projectModel = app.get<Model<Project>>(getModelToken(Project.name));
    fieldMappingModel = app.get<Model<ProjectImportFieldMapping>>(
      getModelToken(ProjectImportFieldMapping.name),
    );
    importJobModel = app.get<Model<ProjectImportJob>>(
      getModelToken(ProjectImportJob.name),
    );
    importRowModel = app.get<Model<ProjectImportRow>>(
      getModelToken(ProjectImportRow.name),
    );
    models = [
      userModel,
      sessionModel,
      batchModel,
      dictionaryModel,
      treeDictionaryModel,
      organizationModel,
      reviewSchemeModel,
      projectModel,
      fieldMappingModel,
      importJobModel,
      importRowModel,
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

  it('requires login and admin role for project import APIs', async () => {
    const deleteTargetId = new Types.ObjectId().toString();

    await request(httpServer).get('/admin/project-imports').expect(401);
    await request(httpServer)
      .delete(`/admin/project-imports/${deleteTargetId}`)
      .expect(401);

    await createUser({
      phone: '+8613810000001',
      name: 'Client User',
      roles: ['client'],
    });
    const nonAdminCookie = await login('+8613810000001');

    await request(httpServer)
      .get('/admin/project-imports')
      .set('Cookie', nonAdminCookie)
      .expect(403);
    await request(httpServer)
      .delete(`/admin/project-imports/${deleteTargetId}`)
      .set('Cookie', nonAdminCookie)
      .expect(403);
    await request(httpServer)
      .post('/admin/project-imports/upload')
      .set('Cookie', nonAdminCookie)
      .expect(403);

    await createUser({
      phone: '+8613810000002',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000002');

    const response = await request(httpServer)
      .get('/admin/project-imports')
      .set('Cookie', adminCookie)
      .expect(200);

    expect(getJsonBody(response)).toMatchObject({
      items: [],
      page: 1,
      pageSize: 100,
      total: 0,
    });
  });

  it('allows admin to delete unconfirmed import jobs and clears rows', async () => {
    await createUser({
      phone: '+8613810000003',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000003');
    const batchId = await createBatch('2026');

    const upload = await uploadWorkbook(adminCookie, batchId, [
      ['项目编号', '项目名称', '项目承担单位'],
      ['P-DELETE-001', '可删除任务', '不存在单位'],
    ]);
    const jobId = getString(upload, 'id');

    const deleteResponse = await request(httpServer)
      .delete(`/admin/project-imports/${jobId}`)
      .set('Cookie', adminCookie)
      .expect(200);

    expect(getJsonBody(deleteResponse)).toEqual({
      success: true,
      deletedJobId: jobId,
      deletedRows: 1,
    });
    await expect(importJobModel.exists({ _id: jobId }).exec()).resolves.toBe(
      null,
    );
    await expect(importRowModel.countDocuments({ jobId }).exec()).resolves.toBe(
      0,
    );

    const jobsResponse = await request(httpServer)
      .get('/admin/project-imports')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(jobsResponse)).toMatchObject({ items: [], total: 0 });
    await request(httpServer)
      .get(`/admin/project-imports/${jobId}/rows`)
      .set('Cookie', adminCookie)
      .expect(404);
  });

  it('rejects deleting jobs that already confirmed rows and keeps projects', async () => {
    await createUser({
      phone: '+8613810000004',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000004');
    const seed = await seedMasterData();
    const upload = await uploadWorkbook(adminCookie, seed.batchId, [
      ['项目编号', '项目名称', '项目负责人', '项目负责人手机', '项目承担单位'],
      [
        'P-CONFIRMED-DELETE-001',
        '已确认任务不可删',
        '张三',
        '13810000001',
        '重庆测试单位',
      ],
    ]);
    const jobId = getString(upload, 'id');
    const row = await getFirstImportRow(adminCookie, jobId);

    const confirmed = await request(httpServer)
      .post(
        `/admin/project-imports/${jobId}/rows/${getString(row, 'id')}/confirm`,
      )
      .set('Cookie', adminCookie)
      .expect(201);
    const confirmedBody = getJsonBody(confirmed);

    const deleteResponse = await request(httpServer)
      .delete(`/admin/project-imports/${jobId}`)
      .set('Cookie', adminCookie)
      .expect(409);
    expect(getJsonBody(deleteResponse)).toMatchObject({
      message: '该导入任务已有项目确认入库，不能删除导入记录',
    });
    await expect(
      importJobModel.exists({ _id: jobId }).exec(),
    ).resolves.not.toBe(null);
    await expect(
      projectModel
        .exists({ _id: getString(confirmedBody, 'projectId') })
        .exec(),
    ).resolves.not.toBe(null);
  });

  it('rejects non-Excel files, missing required headers, and empty workbooks', async () => {
    await createUser({
      phone: '+8613810000010',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000010');
    const batchId = await createBatch('2026');

    await request(httpServer)
      .post('/admin/project-imports/upload')
      .set('Cookie', adminCookie)
      .field('batchId', batchId)
      .attach('file', Buffer.from('not excel'), 'projects.txt')
      .expect(400);

    await uploadWorkbook(
      adminCookie,
      batchId,
      [
        ['项目名称', '项目承担单位'],
        ['缺编号项目', '重庆测试单位'],
      ],
      400,
    );

    await uploadWorkbook(
      adminCookie,
      batchId,
      [['项目编号', '项目名称', '项目承担单位']],
      400,
    );
  });

  it('rejects inactive batch uploads and keeps disabled batch import history readable', async () => {
    await createUser({
      phone: '+8613810000015',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000015');
    const activeBatchId = await createBatch('2026');

    const activeUpload = await uploadWorkbook(adminCookie, activeBatchId, [
      ['项目编号', '项目名称', '项目承担单位'],
      ['P-ACTIVE-BATCH-001', '启用批次导入', '不存在单位'],
    ]);
    const jobId = getString(activeUpload, 'id');

    expect(activeUpload).toMatchObject({
      batchId: activeBatchId,
      totalRows: 1,
    });

    await batchModel
      .findByIdAndUpdate(activeBatchId, { $set: { isActive: false } })
      .exec();

    const historyResponse = await request(httpServer)
      .get('/admin/project-imports')
      .query({ batchId: activeBatchId, page: 1, pageSize: 1000 })
      .set('Cookie', adminCookie)
      .expect(200);

    expect(getJsonBody(historyResponse)).toMatchObject({
      page: 1,
      pageSize: 1000,
      total: 1,
    });
    await request(httpServer)
      .get(`/admin/project-imports/${jobId}`)
      .set('Cookie', adminCookie)
      .expect(200);
    await request(httpServer)
      .get(`/admin/project-imports/${jobId}/rows`)
      .set('Cookie', adminCookie)
      .expect(200);

    const inactiveBatchId = await createBatch('2027', false);
    const inactiveResponse = await request(httpServer)
      .post('/admin/project-imports/upload')
      .set('Cookie', adminCookie)
      .field('batchId', inactiveBatchId)
      .attach(
        'file',
        createWorkbookBuffer([
          ['项目编号', '项目名称', '项目承担单位'],
          ['P-INACTIVE-BATCH-001', '停用批次导入', '不存在单位'],
        ]),
        'projects.xlsx',
      )
      .expect(409);

    expect(getJsonBody(inactiveResponse)).toMatchObject({
      code: BATCH_INACTIVE_FOR_PROJECT_IMPORT,
      message: '批次已停用，不能导入项目。',
    });
    await expect(
      importJobModel.countDocuments({ batchId: inactiveBatchId }).exec(),
    ).resolves.toBe(0);
  });

  it('parses aliases, auto-matches master data, confirms rows, and keeps list contracts', async () => {
    const adminId = await createUser({
      phone: '+8613810000020',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000020');
    const seed = await seedMasterData();

    const upload = await uploadWorkbook(adminCookie, seed.batchId, [
      [
        '编号',
        '课题名称',
        '项目类别',
        '负责人姓名',
        '负责人电话',
        '依托单位',
        '总拨款',
        '已拨付金额',
        '学科分类',
        '主管处室',
        '参与单位',
        '实施状态',
      ],
      [
        'P-IMPORT-001',
        '自动匹配项目',
        '自然科学基金',
        '张三',
        '13810000001',
        '重庆测试单位',
        '100',
        '40',
        '计算机科学技术',
        '高新处',
        '重庆合作单位，重庆第二合作单位',
        '实施中',
      ],
    ]);

    expect(upload).toMatchObject({
      batchId: seed.batchId,
      totalRows: 1,
      importableRows: 1,
      pendingRows: 0,
      status: 'pending_confirmation',
      uploadedByUserId: adminId,
    });
    expect(getRecord(upload, 'fieldMapping')).toMatchObject({
      projectNo: '编号',
      name: '课题名称',
      leadOrganizationName: '依托单位',
    });

    const jobId = getString(upload, 'id');
    const jobsResponse = await request(httpServer)
      .get('/admin/project-imports')
      .query({ page: 1, pageSize: 1000 })
      .set('Cookie', adminCookie)
      .expect(200);
    expect(getJsonBody(jobsResponse)).toMatchObject({
      page: 1,
      pageSize: 1000,
      total: 1,
    });

    const rowsResponse = await request(httpServer)
      .get(`/admin/project-imports/${jobId}/rows`)
      .query({ page: 1, pageSize: 1000 })
      .set('Cookie', adminCookie)
      .expect(200);
    const row = getRecordArray(getJsonBody(rowsResponse), 'items')[0];
    expect(row).toMatchObject({
      rowNumber: 2,
      status: 'importable',
    });
    expect(getRecord(row, 'normalized')).toMatchObject({
      projectNo: 'P-IMPORT-001',
      name: '自动匹配项目',
      totalFunding: 100,
      allocatedFunding: 40,
    });
    expect(getRecord(row, 'resolved')).toMatchObject({
      projectTypeId: seed.projectTypeId,
      statusId: seed.statusId,
      ownerUserId: seed.ownerUserId,
      leadOrganizationId: seed.leadOrganizationId,
      departmentId: seed.departmentId,
    });
    expect(getStringArray(getRecord(row, 'resolved'), 'disciplineIds')).toEqual(
      [seed.disciplineId],
    );
    expect(
      getStringArray(getRecord(row, 'resolved'), 'cooperationOrganizationIds'),
    ).toEqual([
      seed.cooperationOrganizationId,
      seed.secondCooperationOrganizationId,
    ]);

    const confirmed = await request(httpServer)
      .post(
        `/admin/project-imports/${jobId}/rows/${getString(row, 'id')}/confirm`,
      )
      .set('Cookie', adminCookie)
      .expect(201);
    const confirmedBody = getJsonBody(confirmed);
    expect(confirmedBody).toMatchObject({
      status: 'confirmed',
      confirmedByUserId: adminId,
    });
    expect(typeof confirmedBody.projectId).toBe('string');

    const project = await projectModel
      .findById(getString(confirmedBody, 'projectId'))
      .lean<Project | null>()
      .exec();
    expect(project).toMatchObject({
      name: '自动匹配项目',
      importedFromJobId: jobId,
    });

    await request(httpServer)
      .post(
        `/admin/project-imports/${jobId}/rows/${getString(row, 'id')}/confirm`,
      )
      .set('Cookie', adminCookie)
      .expect(409);
    await request(httpServer)
      .post(`/admin/project-imports/${jobId}/rows/${getString(row, 'id')}/skip`)
      .set('Cookie', adminCookie)
      .expect(409);

    await assertMasterDataListContracts(adminCookie);
  });

  it('matches discipline names containing ideographic commas as complete names', async () => {
    await createUser({
      phone: '+8613810000025',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000025');
    const seed = await seedMasterData();
    const aerospaceDisciplineName = '航空、航天科学技术';
    const electronicsDisciplineName = '电子、通信与自动控制技术';
    const aerospaceDisciplineId = await createTreeNode(
      'discipline',
      aerospaceDisciplineName,
    );
    const electronicsDisciplineId = await createTreeNode(
      'discipline',
      electronicsDisciplineName,
    );

    const upload = await uploadWorkbook(adminCookie, seed.batchId, [
      [
        '项目编号',
        '项目名称',
        '项目类型',
        '项目负责人',
        '项目负责人手机',
        '项目承担单位',
        '学科',
        '受理处室',
      ],
      [
        'P-DISCIPLINE-COMMA-001',
        '顿号学科项目',
        '自然科学基金',
        '张三',
        '13810000001',
        '重庆测试单位',
        `${aerospaceDisciplineName}，${electronicsDisciplineName}`,
        '高新处',
      ],
    ]);

    expect(upload).toMatchObject({
      totalRows: 1,
      importableRows: 1,
      pendingRows: 0,
    });

    const row = await getFirstImportRow(adminCookie, getString(upload, 'id'));

    expect(row).toMatchObject({ status: 'importable', issues: [] });
    expect(
      getStringArray(getRecord(row, 'normalized'), 'disciplineNames'),
    ).toEqual([aerospaceDisciplineName, electronicsDisciplineName]);
    expect(getStringArray(getRecord(row, 'resolved'), 'disciplineIds')).toEqual(
      [aerospaceDisciplineId, electronicsDisciplineId],
    );
  });

  it('keeps pending rows blocked until admin creates missing organization and owner user', async () => {
    await createUser({
      phone: '+8613810000030',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000030');
    const seed = await seedMasterData();

    const upload = await uploadWorkbook(adminCookie, seed.batchId, [
      [
        '项目编号',
        '项目名称',
        '项目类型',
        '项目负责人',
        '项目负责人手机',
        '项目承担单位',
        '学科',
        '受理处室',
      ],
      [
        'P-PENDING-001',
        '待确认项目',
        '自然科学基金',
        '李四',
        '13810000999',
        '新增承担单位',
        '计算机科学技术',
        '高新处',
      ],
    ]);
    expect(upload).toMatchObject({
      totalRows: 1,
      importableRows: 0,
      pendingRows: 1,
    });

    const jobId = getString(upload, 'id');
    const pendingRow = await getFirstImportRow(adminCookie, jobId);
    expect(pendingRow).toMatchObject({ status: 'pending_confirmation' });
    expect(getIssueCodes(pendingRow)).toEqual(
      expect.arrayContaining([
        'owner_not_found',
        'lead_organization_not_found',
      ]),
    );

    await request(httpServer)
      .post(
        `/admin/project-imports/${jobId}/rows/${getString(pendingRow, 'id')}/confirm`,
      )
      .set('Cookie', adminCookie)
      .expect(409);

    const updatedResponse = await request(httpServer)
      .patch(
        `/admin/project-imports/${jobId}/rows/${getString(pendingRow, 'id')}`,
      )
      .set('Cookie', adminCookie)
      .send({
        createOrganization: {
          name: '新增承担单位',
          contactName: '王五',
          contactPhone: '13810000998',
        },
        createOwnerUser: {
          name: '李四',
          phone: '13810000999',
        },
      })
      .expect(200);
    const updatedRow = getJsonBody(updatedResponse);
    expect(updatedRow).toMatchObject({ status: 'importable', issues: [] });

    const createdOwner = await userModel
      .findOne({ phone: '13810000999' })
      .lean<User | null>()
      .exec();
    expect(createdOwner).toMatchObject({
      name: '李四',
      roles: ['project_owner'],
      mustChangePassword: true,
      isActive: true,
    });

    await request(httpServer)
      .post(
        `/admin/project-imports/${jobId}/rows/${getString(updatedRow, 'id')}/confirm`,
      )
      .set('Cookie', adminCookie)
      .expect(201);
  });

  it('supports bulk confirmation, skip, invalid funding, and existing project updates', async () => {
    await createUser({
      phone: '+8613810000040',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000040');
    const seed = await seedMasterData();

    await projectModel.create({
      batchId: new Types.ObjectId(seed.batchId),
      projectNo: 'P-EXISTING-001',
      name: '旧项目名称',
      leadOrganizationId: new Types.ObjectId(seed.leadOrganizationId),
      reviewLocation: '不要覆盖的会议室',
      isActive: true,
    });

    const upload = await uploadWorkbook(adminCookie, seed.batchId, [
      [
        '项目编号',
        '项目名称',
        '项目类型',
        '项目负责人',
        '项目负责人手机',
        '项目承担单位',
        '拨款总额',
        '已拨款',
        '学科',
        '受理处室',
        '合作单位',
        '状态',
      ],
      [
        'P-EXISTING-001',
        '更新后的项目名称',
        '自然科学基金',
        '张三',
        '13810000001',
        '重庆测试单位',
        '200',
        '80',
        '计算机科学技术',
        '高新处',
        '重庆合作单位',
        '实施中',
      ],
      [
        'P-BAD-FUNDING-001',
        '金额错误项目',
        '自然科学基金',
        '张三',
        '13810000001',
        '重庆测试单位',
        '10',
        '20',
        '未知学科',
        '高新处',
        '',
        '实施中',
      ],
    ]);
    expect(upload).toMatchObject({
      totalRows: 2,
      importableRows: 1,
      pendingRows: 1,
    });

    const jobId = getString(upload, 'id');
    const rowsResponse = await request(httpServer)
      .get(`/admin/project-imports/${jobId}/rows`)
      .query({ page: 1, pageSize: 1000 })
      .set('Cookie', adminCookie)
      .expect(200);
    const rows = getRecordArray(getJsonBody(rowsResponse), 'items');
    const importableRow = findRow(rows, 'P-EXISTING-001');
    const pendingRow = findRow(rows, 'P-BAD-FUNDING-001');
    expect(importableRow).toMatchObject({ status: 'importable' });
    expect(getIssueCodes(importableRow)).toEqual(['existing_project_matched']);
    expect(pendingRow).toMatchObject({ status: 'pending_confirmation' });
    expect(getIssueCodes(pendingRow)).toEqual(
      expect.arrayContaining(['funding_inconsistent', 'discipline_not_found']),
    );

    const bulkResponse = await request(httpServer)
      .post(`/admin/project-imports/${jobId}/confirm`)
      .set('Cookie', adminCookie)
      .expect(201);
    expect(getJsonBody(bulkResponse)).toMatchObject({
      successCount: 1,
      failedCount: 0,
      skippedCount: 1,
    });

    const updatedProject = await projectModel
      .findOne({
        batchId: new Types.ObjectId(seed.batchId),
        projectNo: 'P-EXISTING-001',
      })
      .lean<Project | null>()
      .exec();
    expect(updatedProject).toMatchObject({
      name: '更新后的项目名称',
      reviewLocation: '不要覆盖的会议室',
      importedFromJobId: jobId,
    });

    const skippedResponse = await request(httpServer)
      .post(
        `/admin/project-imports/${jobId}/rows/${getString(pendingRow, 'id')}/skip`,
      )
      .set('Cookie', adminCookie)
      .expect(201);
    expect(getJsonBody(skippedResponse)).toMatchObject({ status: 'skipped' });
  });

  it('uses configured field aliases during upload and falls back after deletion', async () => {
    await createUser({
      phone: '+8613810000050',
      name: 'Admin User',
      roles: ['admin'],
    });
    const adminCookie = await login('+8613810000050');
    const seed = await seedMasterData();

    await request(httpServer)
      .put('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .send({
        aliases: ['项目唯一编号'],
        isActive: true,
        description: '导入接入测试',
      })
      .expect(200);

    const customUpload = await uploadWorkbook(adminCookie, seed.batchId, [
      ['项目唯一编号', '项目名称', '项目承担单位'],
      ['P-CUSTOM-ALIAS-001', '自定义别名项目', '重庆测试单位'],
    ]);
    expect(getRecord(customUpload, 'fieldMapping')).toMatchObject({
      projectNo: '项目唯一编号',
      name: '项目名称',
      leadOrganizationName: '项目承担单位',
    });

    await request(httpServer)
      .delete('/admin/project-import-field-mappings/projectNo')
      .set('Cookie', adminCookie)
      .expect(200);

    const fallbackUpload = await uploadWorkbook(adminCookie, seed.batchId, [
      ['项目编号', '项目名称', '项目承担单位'],
      ['P-DEFAULT-ALIAS-001', '默认别名项目', '重庆测试单位'],
    ]);
    expect(getRecord(fallbackUpload, 'fieldMapping')).toMatchObject({
      projectNo: '项目编号',
      name: '项目名称',
      leadOrganizationName: '项目承担单位',
    });
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

  async function createBatch(name: string, isActive = true): Promise<string> {
    const batch = await batchModel.create({
      name,
      year: Number(name),
      isActive,
    });

    return batch._id.toString();
  }

  async function seedMasterData(): Promise<SeedData> {
    const batchId = await createBatch('2026');
    const projectTypeId = await createTreeNode('project_type', '自然科学基金');
    const disciplineId = await createTreeNode('discipline', '计算机科学技术');
    const departmentId = await createTreeNode('department', '高新处');
    const status = await dictionaryModel.create({
      dictType: 'project_status',
      code: 'in_progress',
      name: '实施中',
      sortOrder: 0,
      isActive: true,
    });
    const leadOrganization = await organizationModel.create({
      name: '重庆测试单位',
      isActive: true,
    });
    const cooperationOrganization = await organizationModel.create({
      name: '重庆合作单位',
      isActive: true,
    });
    const secondCooperationOrganization = await organizationModel.create({
      name: '重庆第二合作单位',
      isActive: true,
    });
    const ownerUserId = await createUser({
      phone: '13810000001',
      name: '张三',
      roles: ['project_owner'],
    });

    return {
      batchId,
      projectTypeId,
      statusId: status._id.toString(),
      disciplineId,
      departmentId,
      leadOrganizationId: leadOrganization._id.toString(),
      cooperationOrganizationId: cooperationOrganization._id.toString(),
      secondCooperationOrganizationId:
        secondCooperationOrganization._id.toString(),
      ownerUserId,
    };
  }

  async function createTreeNode(
    treeType: string,
    name: string,
  ): Promise<string> {
    const node = await treeDictionaryModel.create({
      treeType,
      name,
      level: 1,
      pathIds: [],
      sortOrder: 0,
      isActive: true,
    });

    return node._id.toString();
  }

  async function uploadWorkbook(
    cookie: string,
    batchId: string,
    rows: unknown[][],
    expectedStatus = 201,
  ): Promise<Record<string, unknown>> {
    const response = await request(httpServer)
      .post('/admin/project-imports/upload')
      .set('Cookie', cookie)
      .field('batchId', batchId)
      .attach('file', createWorkbookBuffer(rows), 'projects.xlsx')
      .expect(expectedStatus);

    return getJsonBody(response);
  }

  async function getFirstImportRow(
    cookie: string,
    jobId: string,
  ): Promise<Record<string, unknown>> {
    const response = await request(httpServer)
      .get(`/admin/project-imports/${jobId}/rows`)
      .set('Cookie', cookie)
      .expect(200);

    const row = getRecordArray(getJsonBody(response), 'items')[0];

    if (!row) {
      throw new Error('expected at least one import row');
    }

    return row;
  }

  async function assertMasterDataListContracts(cookie: string): Promise<void> {
    const dictionariesResponse = await request(httpServer)
      .get('/admin/dictionaries')
      .set('Cookie', cookie)
      .expect(200);
    expect(Array.isArray(dictionariesResponse.body)).toBe(true);

    const treeDictionariesResponse = await request(httpServer)
      .get('/admin/tree-dictionaries')
      .set('Cookie', cookie)
      .expect(200);
    expect(Array.isArray(treeDictionariesResponse.body)).toBe(true);

    const reviewSchemesResponse = await request(httpServer)
      .get('/admin/review-schemes')
      .set('Cookie', cookie)
      .expect(200);
    expect(Array.isArray(reviewSchemesResponse.body)).toBe(true);

    const projectsResponse = await request(httpServer)
      .get('/admin/projects')
      .query({ page: 1, pageSize: 1000 })
      .set('Cookie', cookie)
      .expect(200);
    expect(getJsonBody(projectsResponse)).toMatchObject({
      page: 1,
      pageSize: 1000,
    });

    const organizationsResponse = await request(httpServer)
      .get('/admin/organizations')
      .query({ page: 1, pageSize: 1000 })
      .set('Cookie', cookie)
      .expect(200);
    expect(getJsonBody(organizationsResponse)).toMatchObject({
      page: 1,
      pageSize: 1000,
    });
  }
});

function createWorkbookBuffer(rows: unknown[][]): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
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

function getIssueCodes(record: Record<string, unknown>): string[] {
  const issues = record.issues;

  if (!Array.isArray(issues)) {
    throw new Error('issues must be an array');
  }

  return issues
    .filter(isRecord)
    .map((issue) => issue.code)
    .filter((code): code is string => typeof code === 'string');
}

function findRow(
  rows: Record<string, unknown>[],
  projectNo: string,
): Record<string, unknown> {
  const row = rows.find((item) => {
    const normalized = item.normalized;
    return isRecord(normalized) && normalized.projectNo === projectNo;
  });

  if (!row) {
    throw new Error(`row ${projectNo} not found`);
  }

  return row;
}

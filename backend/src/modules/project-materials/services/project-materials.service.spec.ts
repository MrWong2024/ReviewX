import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import configuration from '../../../config/configuration';
import { envValidationSchema } from '../../../config/env.validation';
import {
  Dictionary,
  DictionarySchema,
} from '../../dictionaries/schemas/dictionary.schema';
import {
  ProjectExpertAssignment,
  ProjectExpertAssignmentSchema,
} from '../../project-expert-assignments/schemas/project-expert-assignment.schema';
import { Project, ProjectSchema } from '../../projects/schemas/project.schema';
import { STORAGE_SERVICE } from '../../storage/storage.constants';
import { StorageConfigService } from '../../storage/storage-config.service';
import type {
  SignedUrlOptions,
  SignedUrlResult,
  StorageService,
  UploadFileInput,
} from '../../storage/storage.interface';
import { sanitizeFilename } from '../../storage/utils/object-key.util';
import { MATERIAL_TYPE_DICT_TYPE } from '../constants/project-material.constants';
import {
  ProjectMaterialDeletionLog,
  ProjectMaterialDeletionLogSchema,
} from '../schemas/project-material-deletion-log.schema';
import {
  ProjectMaterial,
  ProjectMaterialSchema,
} from '../schemas/project-material.schema';
import {
  ProjectMaterialsService,
  ProjectMaterialResponse,
  UploadedProjectMaterialFile,
} from './project-materials.service';

process.env.NODE_ENV = 'test';
process.env.STORAGE_DRIVER = 'fake';

type SeedData = {
  currentUser: ReturnType<typeof buildCurrentUser>;
  adminUser: ReturnType<typeof buildCurrentUser>;
  reviewManagerUser: ReturnType<typeof buildCurrentUser>;
  expertUser: ReturnType<typeof buildCurrentUser>;
  materialTypeId: string;
  projectId: string;
};

type StoredMaterialProbe = {
  originalFilename: string;
  safeFilename: string;
  objectKey: string;
  status: string;
  submittedAt?: Date | null;
  submittedByUserId?: Types.ObjectId | null;
};

type StoredDeletionLogProbe = {
  materialId: Types.ObjectId;
  deletedByUserId: Types.ObjectId;
  deletedByRole: string;
  deleteReason?: string;
  objectKey: string;
  materialStatusBeforeDelete: string;
  storageDeleteSucceeded: boolean;
};

describe('ProjectMaterialsService', () => {
  let moduleRef: TestingModule;
  let service: ProjectMaterialsService;
  let connection: Connection;
  let projectModel: Model<Project>;
  let dictionaryModel: Model<Dictionary>;
  let materialModel: Model<ProjectMaterial>;
  let deletionLogModel: Model<ProjectMaterialDeletionLog>;
  let assignmentModel: Model<ProjectExpertAssignment>;
  let uploadFileMock: jest.MockedFunction<StorageService['uploadFile']>;
  let getSignedUrlMock: jest.MockedFunction<StorageService['getSignedUrl']>;
  let deleteObjectMock: jest.MockedFunction<StorageService['deleteObject']>;
  let models: Model<unknown>[];

  beforeAll(async () => {
    uploadFileMock = jest.fn((input: UploadFileInput) =>
      Promise.resolve({
        objectKey: input.objectKey,
        bucket: 'fake-storage',
        sizeBytes: input.sizeBytes,
        mimeType: input.mimeType,
      }),
    );
    getSignedUrlMock = jest.fn(
      (
        objectKey: string,
        options: SignedUrlOptions,
      ): Promise<SignedUrlResult> =>
        Promise.resolve({
          url: `https://fake-storage.local/${objectKey}`,
          expiresAt: new Date(Date.now() + options.expiresInSeconds * 1000),
        }),
    );
    deleteObjectMock = jest.fn(() => Promise.resolve());

    const storageService: StorageService = {
      driver: 'fake',
      uploadFile: uploadFileMock,
      getSignedUrl: getSignedUrlMock,
      deleteObject: deleteObjectMock,
    };

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
          load: [configuration],
          validationSchema: envValidationSchema,
        }),
        MongooseModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            uri: configService.getOrThrow<string>('mongo.uri'),
            autoIndex: configService.getOrThrow<boolean>('mongo.autoIndex'),
            serverSelectionTimeoutMS: configService.getOrThrow<number>(
              'mongo.serverSelectionTimeoutMs',
            ),
          }),
        }),
        MongooseModule.forFeature([
          { name: ProjectMaterial.name, schema: ProjectMaterialSchema },
          {
            name: ProjectMaterialDeletionLog.name,
            schema: ProjectMaterialDeletionLogSchema,
          },
          { name: Project.name, schema: ProjectSchema },
          { name: Dictionary.name, schema: DictionarySchema },
          {
            name: ProjectExpertAssignment.name,
            schema: ProjectExpertAssignmentSchema,
          },
        ]),
      ],
      providers: [
        ProjectMaterialsService,
        { provide: STORAGE_SERVICE, useValue: storageService },
        {
          provide: StorageConfigService,
          useValue: { getObjectPrefix: () => 'reviewx' },
        },
      ],
    }).compile();

    service = moduleRef.get(ProjectMaterialsService);
    connection = moduleRef.get<Connection>(getConnectionToken());
    projectModel = moduleRef.get<Model<Project>>(getModelToken(Project.name));
    dictionaryModel = moduleRef.get<Model<Dictionary>>(
      getModelToken(Dictionary.name),
    );
    materialModel = moduleRef.get<Model<ProjectMaterial>>(
      getModelToken(ProjectMaterial.name),
    );
    deletionLogModel = moduleRef.get<Model<ProjectMaterialDeletionLog>>(
      getModelToken(ProjectMaterialDeletionLog.name),
    );
    assignmentModel = moduleRef.get<Model<ProjectExpertAssignment>>(
      getModelToken(ProjectExpertAssignment.name),
    );
    models = [
      projectModel,
      dictionaryModel,
      materialModel,
      deletionLogModel,
      assignmentModel,
    ];

    for (const model of models) {
      await model.syncIndexes();
    }
  });

  beforeEach(async () => {
    uploadFileMock.mockClear();
    getSignedUrlMock.mockClear();
    deleteObjectMock.mockClear();
    await clearCollections();
  });

  afterAll(async () => {
    await clearCollections();
    await connection.close();
    await moduleRef.close();
  });

  it('persists normalized Chinese filenames and builds object keys from the safe filename', async () => {
    const data = await seedData();
    const mojibakeFilename = toLatin1Mojibake('结题材料.pdf');

    const result = await service.uploadOwnerMaterials({
      projectId: data.projectId,
      dto: { materialTypeId: data.materialTypeId },
      files: [buildFile(mojibakeFilename, 'pdf-content')],
      currentUser: data.currentUser,
    });
    const material = getOnlyMaterial(result.materials);
    const expectedSafeFilename = sanitizeFilename('结题材料.pdf');

    expect(result).toMatchObject({
      successCount: 1,
      failedCount: 0,
      failures: [],
    });
    expect(material.originalFilename).toBe('结题材料.pdf');
    expect(material.safeFilename).toBe(expectedSafeFilename);
    expect(material.objectKey).toContain(
      `/projects/${data.projectId}/materials/proof/`,
    );
    expect(material.objectKey).toContain(`-${expectedSafeFilename}`);
    expect(uploadFileMock.mock.calls[0]?.[0].objectKey).toBe(
      material.objectKey,
    );

    const storedMaterial = await findStoredMaterial(material.id);
    expect(storedMaterial).toMatchObject({
      originalFilename: '结题材料.pdf',
      safeFilename: expectedSafeFilename,
      objectKey: material.objectKey,
      status: 'draft',
    });
    expect(material.status).toBe('draft');
  });

  it('keeps English filenames unchanged', async () => {
    const data = await seedData();

    const result = await service.uploadOwnerMaterials({
      projectId: data.projectId,
      dto: { materialTypeId: data.materialTypeId },
      files: [buildFile('report.pdf', 'pdf-content')],
      currentUser: data.currentUser,
    });
    const material = getOnlyMaterial(result.materials);

    expect(material.originalFilename).toBe('report.pdf');
    expect(material.safeFilename).toBe('report.pdf');
    expect(material.objectKey).toContain('-report.pdf');
  });

  it('keeps valid UTF-8 Chinese filenames unchanged before safe filename generation', async () => {
    const data = await seedData();

    const result = await service.uploadOwnerMaterials({
      projectId: data.projectId,
      dto: { materialTypeId: data.materialTypeId },
      files: [buildFile('财务资料汇总.xlsx', 'xlsx-content')],
      currentUser: data.currentUser,
    });
    const material = getOnlyMaterial(result.materials);
    const expectedSafeFilename = sanitizeFilename('财务资料汇总.xlsx');

    expect(material.originalFilename).toBe('财务资料汇总.xlsx');
    expect(material.safeFilename).toBe(expectedSafeFilename);
    expect(material.objectKey).toContain(`-${expectedSafeFilename}`);
  });

  it('uses normalized filenames in multi-file upload failures', async () => {
    const data = await seedData();

    const result = await service.uploadOwnerMaterials({
      projectId: data.projectId,
      dto: { materialTypeId: data.materialTypeId },
      files: [
        buildFile('report.pdf', 'pdf-content'),
        buildFile(toLatin1Mojibake('结题材料.exe'), 'exe-content'),
      ],
      currentUser: data.currentUser,
    });

    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.failures).toEqual([
      {
        originalFilename: '结题材料.exe',
        message: 'File extension is not allowed',
      },
    ]);
    await expect(materialModel.countDocuments({}).exec()).resolves.toBe(1);
  });

  it('hides draft materials from review roles until owner submits them', async () => {
    const data = await seedData();
    const material = await uploadOneMaterial(data, 'draft.pdf');

    await expect(
      service.listOwnerMaterials(data.projectId, {}, data.currentUser),
    ).resolves.toMatchObject([{ id: material.id, status: 'draft' }]);
    await expect(
      service.listReviewManagerMaterials(
        data.projectId,
        {},
        data.reviewManagerUser,
      ),
    ).resolves.toEqual([]);
    await expect(
      service.listExpertMaterials(data.projectId, {}, data.expertUser),
    ).resolves.toEqual([]);
    await expect(
      service.getExpertProject(data.projectId, data.expertUser),
    ).resolves.toMatchObject({ materialCount: 0 });

    const result = await service.submitOwnerMaterials(
      data.projectId,
      {},
      data.currentUser,
    );

    expect(result).toMatchObject({
      submittedCount: 1,
      alreadySubmittedCount: 0,
      skippedCount: 0,
      submittedMaterialIds: [material.id],
      skipped: [],
    });
    const storedMaterial = await findStoredMaterial(material.id);
    expect(storedMaterial.status).toBe('submitted');
    expect(storedMaterial.submittedAt).toBeTruthy();
    expect(storedMaterial.submittedByUserId?.toString()).toBe(
      data.currentUser.user.id,
    );
    await expect(
      service.listReviewManagerMaterials(
        data.projectId,
        {},
        data.reviewManagerUser,
      ),
    ).resolves.toMatchObject([{ id: material.id, status: 'submitted' }]);
    await expect(
      service.listExpertMaterials(data.projectId, {}, data.expertUser),
    ).resolves.toMatchObject([{ id: material.id, status: 'submitted' }]);
    await expect(
      service.getExpertProject(data.projectId, data.expertUser),
    ).resolves.toMatchObject({ materialCount: 1 });
  });

  it('submits specified draft or legacy active materials and counts already submitted or skipped ids', async () => {
    const data = await seedData();
    const draftMaterial = await uploadOneMaterial(data, 'draft.pdf');
    const submittedMaterial = await uploadOneMaterial(data, 'submitted.pdf');
    const legacyActiveMaterial = await uploadOneMaterial(data, 'legacy.pdf');
    await materialModel
      .updateOne(
        { _id: new Types.ObjectId(submittedMaterial.id) },
        { $set: { status: 'submitted', submittedAt: new Date() } },
      )
      .exec();
    await materialModel
      .updateOne(
        { _id: new Types.ObjectId(legacyActiveMaterial.id) },
        { $set: { status: 'active' } },
      )
      .exec();
    const missingMaterialId = new Types.ObjectId().toString();

    const result = await service.submitOwnerMaterials(
      data.projectId,
      {
        materialIds: [
          draftMaterial.id,
          submittedMaterial.id,
          legacyActiveMaterial.id,
          missingMaterialId,
        ],
      },
      data.currentUser,
    );

    expect(result).toMatchObject({
      submittedCount: 2,
      alreadySubmittedCount: 1,
      skippedCount: 1,
      skipped: [{ materialId: missingMaterialId, reason: 'not_found' }],
    });
    expect(result.submittedMaterialIds).toEqual([
      draftMaterial.id,
      legacyActiveMaterial.id,
    ]);
    await expect(findStoredMaterial(draftMaterial.id)).resolves.toMatchObject({
      status: 'submitted',
    });
    await expect(
      findStoredMaterial(legacyActiveMaterial.id),
    ).resolves.toMatchObject({
      status: 'submitted',
    });
  });

  it('physically deletes owner draft materials and writes deletion logs', async () => {
    const data = await seedData();
    const material = await uploadOneMaterial(data, 'delete-me.pdf');
    deleteObjectMock.mockClear();

    const result = await service.deleteOwnerMaterial(
      data.projectId,
      material.id,
      data.currentUser,
    );

    expect(result).toMatchObject({
      deleted: true,
      alreadyDeleted: false,
    });
    expect(result.deletionLogId).toBeTruthy();
    expect(deleteObjectMock).toHaveBeenCalledWith(material.objectKey);
    await expect(
      materialModel.findById(material.id).exec(),
    ).resolves.toBeNull();
    const deletionLog = await findDeletionLog(result.deletionLogId ?? '');
    expect(deletionLog).toMatchObject({
      materialId: new Types.ObjectId(material.id),
      deletedByUserId: new Types.ObjectId(data.currentUser.user.id),
      deletedByRole: 'project_owner',
      deleteReason: 'project_owner_draft_delete',
      objectKey: material.objectKey,
      materialStatusBeforeDelete: 'draft',
      storageDeleteSucceeded: true,
    });
  });

  it('rejects project owner deletion of submitted materials without deleting storage', async () => {
    const data = await seedData();
    const material = await uploadOneMaterial(data, 'submitted.pdf');
    await service.submitOwnerMaterials(data.projectId, {}, data.currentUser);
    deleteObjectMock.mockClear();

    await expect(
      service.deleteOwnerMaterial(
        data.projectId,
        material.id,
        data.currentUser,
      ),
    ).rejects.toThrow('Submitted material cannot be deleted by project owner');
    expect(deleteObjectMock).not.toHaveBeenCalled();
    await expect(
      materialModel.findById(material.id).exec(),
    ).resolves.toBeTruthy();
  });

  it('keeps material records when storage deletion fails', async () => {
    const data = await seedData();
    const material = await uploadOneMaterial(data, 'storage-fails.pdf');
    deleteObjectMock.mockRejectedValueOnce(new Error('storage down'));

    await expect(
      service.deleteOwnerMaterial(
        data.projectId,
        material.id,
        data.currentUser,
      ),
    ).rejects.toThrow('Failed to delete material object');
    await expect(
      materialModel.findById(material.id).exec(),
    ).resolves.toBeTruthy();
    await expect(deletionLogModel.countDocuments({}).exec()).resolves.toBe(0);
  });

  it('requires admin deletion reasons and lets admins delete submitted materials with audit logs', async () => {
    const data = await seedData();
    const material = await uploadOneMaterial(data, 'admin-delete.pdf');
    await service.submitOwnerMaterials(data.projectId, {}, data.currentUser);
    deleteObjectMock.mockClear();

    await expect(
      service.deleteAdminMaterial(
        data.projectId,
        material.id,
        { reason: '' },
        data.adminUser,
      ),
    ).rejects.toThrow('reason is required');
    expect(deleteObjectMock).not.toHaveBeenCalled();

    const result = await service.deleteAdminMaterial(
      data.projectId,
      material.id,
      { reason: ' obsolete material ' },
      data.adminUser,
    );

    expect(result).toMatchObject({ deleted: true });
    expect(deleteObjectMock).toHaveBeenCalledWith(material.objectKey);
    await expect(
      materialModel.findById(material.id).exec(),
    ).resolves.toBeNull();
    const deletionLog = await findDeletionLog(result.deletionLogId);
    expect(deletionLog).toMatchObject({
      materialId: new Types.ObjectId(material.id),
      deletedByUserId: new Types.ObjectId(data.adminUser.user.id),
      deletedByRole: 'admin',
      deleteReason: 'obsolete material',
      materialStatusBeforeDelete: 'submitted',
      storageDeleteSucceeded: true,
    });
  });

  async function seedData(): Promise<SeedData> {
    const ownerUserId = new Types.ObjectId();
    const reviewManagerUserId = new Types.ObjectId();
    const expertUserId = new Types.ObjectId();
    const adminUserId = new Types.ObjectId();
    const project = await projectModel.create({
      batchId: new Types.ObjectId(),
      projectNo: 'P-MAT-SVC-001',
      name: 'Material Service Project',
      ownerUserId,
      reviewManagerId: reviewManagerUserId,
      isActive: true,
    });
    const materialType = await dictionaryModel.create({
      dictType: MATERIAL_TYPE_DICT_TYPE,
      code: 'proof',
      name: '证明材料',
      sortOrder: 1,
      isActive: true,
    });
    await assignmentModel.create({
      projectId: project._id,
      expertUserId,
      assignedByUserId: reviewManagerUserId,
      source: 'manual',
      status: 'assigned',
    });

    return {
      currentUser: buildCurrentUser(ownerUserId.toString()),
      adminUser: buildCurrentUser(adminUserId.toString(), ['admin']),
      reviewManagerUser: buildCurrentUser(reviewManagerUserId.toString(), [
        'review_manager',
      ]),
      expertUser: buildCurrentUser(expertUserId.toString(), ['expert']),
      materialTypeId: materialType._id.toString(),
      projectId: project._id.toString(),
    };
  }

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }

  async function findStoredMaterial(id: string): Promise<StoredMaterialProbe> {
    const material = await materialModel
      .findById(id)
      .select({
        originalFilename: 1,
        safeFilename: 1,
        objectKey: 1,
        status: 1,
        submittedAt: 1,
        submittedByUserId: 1,
      })
      .lean<StoredMaterialProbe | null>()
      .exec();

    if (!material) {
      throw new Error('stored material not found');
    }

    return material;
  }

  async function findDeletionLog(id: string): Promise<StoredDeletionLogProbe> {
    const deletionLog = await deletionLogModel
      .findById(id)
      .select({
        materialId: 1,
        deletedByUserId: 1,
        deletedByRole: 1,
        deleteReason: 1,
        objectKey: 1,
        materialStatusBeforeDelete: 1,
        storageDeleteSucceeded: 1,
      })
      .lean<StoredDeletionLogProbe | null>()
      .exec();

    if (!deletionLog) {
      throw new Error('deletion log not found');
    }

    return deletionLog;
  }

  async function uploadOneMaterial(
    data: SeedData,
    filename: string,
  ): Promise<ProjectMaterialResponse> {
    const result = await service.uploadOwnerMaterials({
      projectId: data.projectId,
      dto: { materialTypeId: data.materialTypeId },
      files: [buildFile(filename, 'file-content')],
      currentUser: data.currentUser,
    });

    return getOnlyMaterial(result.materials);
  }
});

function buildFile(
  originalname: string,
  content: string,
): UploadedProjectMaterialFile {
  return {
    originalname,
    size: Buffer.byteLength(content),
    buffer: Buffer.from(content),
    mimetype: 'application/octet-stream',
  };
}

function buildCurrentUser(
  userId: string,
  roles: Array<'admin' | 'review_manager' | 'expert' | 'project_owner'> = [
    'project_owner',
  ],
) {
  const now = new Date();

  return {
    user: {
      id: userId,
      phone: '+8613900000000',
      name: 'Project Owner',
      roles,
      organizationIds: [],
      disciplineIds: [],
      mustChangePassword: false,
      isActive: true,
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
    },
    session: {
      id: new Types.ObjectId().toString(),
      userId,
      expiresAt: new Date(now.getTime() + 86400000),
      createdAt: now,
      updatedAt: now,
    },
  };
}

function getOnlyMaterial(
  materials: ProjectMaterialResponse[],
): ProjectMaterialResponse {
  const material = materials[0];

  if (!material) {
    throw new Error('expected one uploaded material');
  }

  return material;
}

function toLatin1Mojibake(value: string): string {
  return Buffer.from(value, 'utf8').toString('latin1');
}

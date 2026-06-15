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
  materialTypeId: string;
  projectId: string;
};

type StoredMaterialProbe = {
  originalFilename: string;
  safeFilename: string;
  objectKey: string;
};

describe('ProjectMaterialsService', () => {
  let moduleRef: TestingModule;
  let service: ProjectMaterialsService;
  let connection: Connection;
  let projectModel: Model<Project>;
  let dictionaryModel: Model<Dictionary>;
  let materialModel: Model<ProjectMaterial>;
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
    assignmentModel = moduleRef.get<Model<ProjectExpertAssignment>>(
      getModelToken(ProjectExpertAssignment.name),
    );
    models = [projectModel, dictionaryModel, materialModel, assignmentModel];

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
    });
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

  async function seedData(): Promise<SeedData> {
    const ownerUserId = new Types.ObjectId();
    const project = await projectModel.create({
      batchId: new Types.ObjectId(),
      projectNo: 'P-MAT-SVC-001',
      name: 'Material Service Project',
      ownerUserId,
      isActive: true,
    });
    const materialType = await dictionaryModel.create({
      dictType: MATERIAL_TYPE_DICT_TYPE,
      code: 'proof',
      name: '证明材料',
      sortOrder: 1,
      isActive: true,
    });

    return {
      currentUser: buildCurrentUser(ownerUserId.toString()),
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
      .select({ originalFilename: 1, safeFilename: 1, objectKey: 1 })
      .lean<StoredMaterialProbe | null>()
      .exec();

    if (!material) {
      throw new Error('stored material not found');
    }

    return material;
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

function buildCurrentUser(userId: string) {
  const now = new Date();

  return {
    user: {
      id: userId,
      phone: '+8613900000000',
      name: 'Project Owner',
      roles: ['project_owner' as const],
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

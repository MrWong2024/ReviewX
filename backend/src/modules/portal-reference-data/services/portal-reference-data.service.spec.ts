import { BadRequestException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import configuration from '../../../config/configuration';
import { envValidationSchema } from '../../../config/env.validation';
import { Batch, BatchSchema } from '../../batches/schemas/batch.schema';
import {
  Dictionary,
  DictionarySchema,
} from '../../dictionaries/schemas/dictionary.schema';
import {
  Organization,
  OrganizationSchema,
} from '../../organizations/schemas/organization.schema';
import {
  ReviewScheme,
  ReviewSchemeSchema,
} from '../../review-schemes/schemas/review-scheme.schema';
import {
  TreeDictionary,
  TreeDictionarySchema,
} from '../../tree-dictionaries/schemas/tree-dictionary.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { PortalReferenceDataService } from './portal-reference-data.service';

process.env.NODE_ENV = 'test';

describe('PortalReferenceDataService', () => {
  let moduleRef: TestingModule;
  let service: PortalReferenceDataService;
  let connection: Connection;
  let dictionaryModel: Model<Dictionary>;
  let treeDictionaryModel: Model<TreeDictionary>;
  let batchModel: Model<Batch>;
  let organizationModel: Model<Organization>;
  let reviewSchemeModel: Model<ReviewScheme>;
  let userModel: Model<User>;
  let models: Model<unknown>[];

  beforeAll(async () => {
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
          { name: Dictionary.name, schema: DictionarySchema },
          { name: TreeDictionary.name, schema: TreeDictionarySchema },
          { name: Batch.name, schema: BatchSchema },
          { name: Organization.name, schema: OrganizationSchema },
          { name: ReviewScheme.name, schema: ReviewSchemeSchema },
          { name: User.name, schema: UserSchema },
        ]),
      ],
      providers: [PortalReferenceDataService],
    }).compile();

    service = moduleRef.get(PortalReferenceDataService);
    connection = moduleRef.get<Connection>(getConnectionToken());
    dictionaryModel = moduleRef.get<Model<Dictionary>>(
      getModelToken(Dictionary.name),
    );
    treeDictionaryModel = moduleRef.get<Model<TreeDictionary>>(
      getModelToken(TreeDictionary.name),
    );
    batchModel = moduleRef.get<Model<Batch>>(getModelToken(Batch.name));
    organizationModel = moduleRef.get<Model<Organization>>(
      getModelToken(Organization.name),
    );
    reviewSchemeModel = moduleRef.get<Model<ReviewScheme>>(
      getModelToken(ReviewScheme.name),
    );
    userModel = moduleRef.get<Model<User>>(getModelToken(User.name));
    models = [
      dictionaryModel,
      treeDictionaryModel,
      batchModel,
      organizationModel,
      reviewSchemeModel,
      userModel,
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
    await moduleRef.close();
  });

  it('returns active material_type dictionaries by default and excludes inactive items', async () => {
    const active = await dictionaryModel.create({
      dictType: 'material_type',
      code: 'ppt',
      name: '汇报 PPT',
      sortOrder: 2,
      isActive: true,
      description: 'not returned',
    });
    await dictionaryModel.create({
      dictType: 'material_type',
      code: 'old',
      name: '旧材料',
      sortOrder: 1,
      isActive: false,
    });

    const result = await service.listDictionaries({
      dictType: 'material_type',
    });

    expect(result.items).toEqual([
      {
        id: active._id.toString(),
        dictType: 'material_type',
        code: 'ppt',
        name: '汇报 PPT',
        sortOrder: 2,
        isActive: true,
      },
    ]);
    expect(result.items[0]).not.toHaveProperty('description');

    const inactiveResult = await service.listDictionaries({
      dictType: 'material_type',
      isActive: false,
    });
    expect(inactiveResult.items).toHaveLength(1);
    expect(inactiveResult.items[0]).toMatchObject({
      code: 'old',
      isActive: false,
    });
  });

  it('returns active tree dictionary summaries for project display mappings', async () => {
    const projectType = await treeDictionaryModel.create({
      treeType: 'project_type',
      code: 'tech',
      name: '科技项目',
      pathIds: [],
      level: 1,
      sortOrder: 2,
      isActive: true,
      fullName: 'not returned',
    });
    const discipline = await treeDictionaryModel.create({
      treeType: 'discipline',
      code: 'cs',
      name: '计算机科学技术',
      pathIds: [],
      level: 1,
      sortOrder: 1,
      isActive: true,
    });
    await treeDictionaryModel.create({
      treeType: 'discipline',
      code: 'old',
      name: '停用学科',
      pathIds: [],
      level: 1,
      sortOrder: 3,
      isActive: false,
    });

    const result = await service.listTreeDictionaries({
      treeTypes: ['project_type', 'discipline'],
    });

    expect(result.items).toEqual([
      {
        id: discipline._id.toString(),
        treeType: 'discipline',
        parentId: null,
        code: 'cs',
        name: '计算机科学技术',
        sortOrder: 1,
        isActive: true,
      },
      {
        id: projectType._id.toString(),
        treeType: 'project_type',
        parentId: null,
        code: 'tech',
        name: '科技项目',
        sortOrder: 2,
        isActive: true,
      },
    ]);
    expect(result.items[0]).not.toHaveProperty('fullName');
  });

  it('returns batch, organization, and review scheme summaries only', async () => {
    await batchModel.create({
      name: '2025',
      isActive: false,
    });
    const batch = await batchModel.create({
      name: '2026',
      year: 2026,
      description: 'not returned',
      isActive: true,
    });
    const regionId = new Types.ObjectId();
    const organization = await organizationModel.create({
      name: '重庆测试单位',
      contactName: '联系人',
      contactPhone: '+8613800000000',
      regionId,
      isActive: true,
    });
    const reviewScheme = await reviewSchemeModel.create({
      name: '验收评审方案',
      description: 'not returned',
      items: [{ name: '技术', maxScore: 100 }],
      totalScore: 100,
      isActive: true,
    });

    const batches = await service.listBatches({});
    expect(batches.items).toHaveLength(1);
    expect(batches.items[0]).toMatchObject({
      id: batch._id.toString(),
      name: '2026',
      isActive: true,
    });
    expect(batches.items[0].createdAt).toBeTruthy();
    expect(batches.items[0]).not.toHaveProperty('description');

    const organizations = await service.listOrganizations({
      keyword: '联系人',
    });
    expect(organizations.items).toEqual([
      {
        id: organization._id.toString(),
        name: '重庆测试单位',
        regionId: regionId.toString(),
        isActive: true,
      },
    ]);
    expect(organizations.items[0]).not.toHaveProperty('contactName');
    expect(organizations.items[0]).not.toHaveProperty('contactPhone');

    const reviewSchemes = await service.listReviewSchemes({});
    expect(reviewSchemes.items).toEqual([
      {
        id: reviewScheme._id.toString(),
        name: '验收评审方案',
        totalScore: 100,
        isActive: true,
      },
    ]);
    expect(reviewSchemes.items[0]).not.toHaveProperty('items');
  });

  it('requires user role filters, rejects admin role, and never returns sensitive user fields', async () => {
    const organizationId = new Types.ObjectId();
    const disciplineId = new Types.ObjectId();
    const reviewManager = await userModel.create({
      phone: '+8613900000001',
      passwordHash: 'hashed-password',
      name: '评审负责人',
      roles: ['review_manager'],
      organizationIds: [organizationId],
      disciplineIds: [disciplineId],
      isActive: true,
      mustChangePassword: true,
      status: 'active',
    });
    await userModel.create({
      phone: '+8613900000002',
      passwordHash: 'hashed-password',
      name: '管理员兼负责人',
      roles: ['admin', 'review_manager'],
      isActive: true,
      status: 'active',
    });

    await expect(service.listUsers({})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.listUsers({ role: 'admin' })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    const result = await service.listUsers({ role: 'review_manager' });

    expect(result.items).toEqual([
      {
        id: reviewManager._id.toString(),
        name: '评审负责人',
        phone: '+8613900000001',
        roles: ['review_manager'],
        organizationIds: [organizationId.toString()],
        disciplineIds: [disciplineId.toString()],
        isActive: true,
      },
    ]);
    expectResponseHasNoForbiddenUserFields(result);
  });

  async function clearCollections(): Promise<void> {
    for (const model of models) {
      await model.deleteMany({}).exec();
    }
  }
});

function expectResponseHasNoForbiddenUserFields(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      expectResponseHasNoForbiddenUserFields(item);
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  expect(value).not.toHaveProperty('passwordHash');
  expect(value).not.toHaveProperty('mustChangePassword');
  expect(value).not.toHaveProperty('token');
  expect(value).not.toHaveProperty('sessionToken');

  for (const childValue of Object.values(value)) {
    expectResponseHasNoForbiddenUserFields(childValue);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

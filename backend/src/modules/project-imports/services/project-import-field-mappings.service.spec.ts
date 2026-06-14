import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import configuration from '../../../config/configuration';
import { envValidationSchema } from '../../../config/env.validation';
import {
  PROJECT_IMPORT_FIELD_ALIASES,
  PROJECT_IMPORT_STANDARD_FIELDS,
} from '../constants/project-import-field-map';
import {
  ProjectImportFieldMapping,
  ProjectImportFieldMappingSchema,
} from '../schemas/project-import-field-mapping.schema';
import { ProjectImportFieldMappingsService } from './project-import-field-mappings.service';

process.env.NODE_ENV = 'test';

describe('ProjectImportFieldMappingsService', () => {
  let moduleRef: TestingModule;
  let service: ProjectImportFieldMappingsService;
  let connection: Connection;
  let fieldMappingModel: Model<ProjectImportFieldMapping>;
  let currentUserId: string;

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
          {
            name: ProjectImportFieldMapping.name,
            schema: ProjectImportFieldMappingSchema,
          },
        ]),
      ],
      providers: [ProjectImportFieldMappingsService],
    }).compile();

    service = moduleRef.get(ProjectImportFieldMappingsService);
    connection = moduleRef.get<Connection>(getConnectionToken());
    fieldMappingModel = moduleRef.get<Model<ProjectImportFieldMapping>>(
      getModelToken(ProjectImportFieldMapping.name),
    );
    await fieldMappingModel.syncIndexes();
  });

  beforeEach(async () => {
    currentUserId = new Types.ObjectId().toString();
    await fieldMappingModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await fieldMappingModel.deleteMany({}).exec();
    await connection.close();
    await moduleRef.close();
  });

  it('returns standard fields and complete list views with default aliases', async () => {
    const standardFields = service.listStandardFields();
    expect(standardFields.items).toHaveLength(
      PROJECT_IMPORT_STANDARD_FIELDS.length,
    );
    expect(standardFields.items[0]).toMatchObject({
      standardField: 'projectNo',
      label: '项目编号',
      required: true,
      defaultAliases: PROJECT_IMPORT_FIELD_ALIASES.projectNo,
    });

    const list = await service.list({});
    expect(list.items).toHaveLength(PROJECT_IMPORT_STANDARD_FIELDS.length);
    expect(
      list.items.find((item) => item.standardField === 'projectNo'),
    ).toMatchObject({
      standardField: 'projectNo',
      aliases: [],
      effectiveAliases: PROJECT_IMPORT_FIELD_ALIASES.projectNo,
      isConfigured: false,
      isActive: true,
    });
  });

  it('upserts, updates, deletes, and falls back to default aliases', async () => {
    const created = await service.upsert(
      'projectNo',
      {
        aliases: [' 项目唯一编号 ', '项目合同号'],
        isActive: true,
        description: '本地 Excel 表头',
      },
      currentUserId,
    );
    expect(created).toMatchObject({
      standardField: 'projectNo',
      aliases: ['项目唯一编号', '项目合同号'],
      normalizedAliases: ['项目唯一编号', '项目合同号'],
      effectiveAliases: ['项目唯一编号', '项目合同号'],
      isConfigured: true,
      isActive: true,
      createdByUserId: currentUserId,
      updatedByUserId: currentUserId,
    });

    const updated = await service.update(
      'projectNo',
      {
        aliases: ['项目本地编号'],
        isActive: false,
        description: '停用自定义配置',
      },
      currentUserId,
    );
    expect(updated).toMatchObject({
      aliases: ['项目本地编号'],
      effectiveAliases: PROJECT_IMPORT_FIELD_ALIASES.projectNo,
      isConfigured: true,
      isActive: false,
      description: '停用自定义配置',
    });

    await expect(
      service.update('name', { isActive: false }, currentUserId),
    ).rejects.toThrow('字段映射配置不存在');

    await expect(service.remove('name')).rejects.toThrow('字段映射配置不存在');
    await expect(service.remove('projectNo')).resolves.toEqual({
      success: true,
    });

    const fallback = await service.findByStandardField('projectNo');
    expect(fallback).toMatchObject({
      standardField: 'projectNo',
      aliases: [],
      effectiveAliases: PROJECT_IMPORT_FIELD_ALIASES.projectNo,
      isConfigured: false,
      isActive: true,
    });
  });

  it('resets a field to default aliases without deleting the configuration', async () => {
    await service.upsert(
      'projectNo',
      { aliases: ['项目唯一编号'], isActive: false },
      currentUserId,
    );

    const reset = await service.resetDefaults('projectNo', currentUserId);

    expect(reset).toMatchObject({
      standardField: 'projectNo',
      aliases: PROJECT_IMPORT_FIELD_ALIASES.projectNo,
      effectiveAliases: PROJECT_IMPORT_FIELD_ALIASES.projectNo,
      isConfigured: true,
      isActive: true,
    });
  });

  it('builds effective alias maps from active configurations with per-field fallback', async () => {
    const defaults = await service.getEffectiveAliasMap();
    expect(defaults.projectNo).toEqual(PROJECT_IMPORT_FIELD_ALIASES.projectNo);

    await service.upsert(
      'projectNo',
      { aliases: ['项目唯一编号'], isActive: true },
      currentUserId,
    );

    const configured = await service.getEffectiveAliasMap();
    expect(configured.projectNo).toEqual(['项目唯一编号']);
    expect(configured.name).toEqual(PROJECT_IMPORT_FIELD_ALIASES.name);

    await service.update('projectNo', { isActive: false }, currentUserId);

    const inactive = await service.getEffectiveAliasMap();
    expect(inactive.projectNo).toEqual(PROJECT_IMPORT_FIELD_ALIASES.projectNo);
  });

  it('rejects invalid fields and invalid aliases', async () => {
    await expect(service.findByStandardField('unknownField')).rejects.toThrow(
      '未知的导入标准字段',
    );
    await expect(
      service.upsert('projectNo', { aliases: [] }, currentUserId),
    ).rejects.toThrow('字段别名不能为空');
    await expect(
      service.upsert('projectNo', { aliases: ['   '] }, currentUserId),
    ).rejects.toThrow('字段别名不能为空');
    await expect(
      service.upsert(
        'projectNo',
        { aliases: ['项目唯一编号', ' 项目唯一编号 '] },
        currentUserId,
      ),
    ).rejects.toThrow('同一字段下存在重复别名');
  });

  it('rejects aliases used by another field configuration or reserved default aliases', async () => {
    await service.upsert(
      'name',
      { aliases: ['本地项目名称'], isActive: false },
      currentUserId,
    );

    await expect(
      service.upsert('projectNo', { aliases: ['本地项目名称'] }, currentUserId),
    ).rejects.toThrow('字段别名已被其他标准字段使用');

    await expect(
      service.upsert('projectNo', { aliases: ['项目名称'] }, currentUserId),
    ).rejects.toThrow('字段别名已被其他标准字段使用');
  });
});

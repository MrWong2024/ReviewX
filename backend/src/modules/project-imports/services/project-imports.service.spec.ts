import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import configuration from '../../../config/configuration';
import { envValidationSchema } from '../../../config/env.validation';
import { BatchesService } from '../../batches/services/batches.service';
import { Dictionary } from '../../dictionaries/schemas/dictionary.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import { Project } from '../../projects/schemas/project.schema';
import { ProjectsService } from '../../projects/services/projects.service';
import { TreeDictionary } from '../../tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import type { ProjectImportJobStatus } from '../constants/project-import-status';
import {
  ProjectImportJob,
  ProjectImportJobSchema,
} from '../schemas/project-import-job.schema';
import {
  ProjectImportRow,
  ProjectImportRowSchema,
} from '../schemas/project-import-row.schema';
import { ProjectImportFieldMappingsService } from './project-import-field-mappings.service';
import { ProjectImportsService } from './project-imports.service';

process.env.NODE_ENV = 'test';

type ProjectsServiceMock = {
  upsertImportedProject: jest.Mock;
};

describe('ProjectImportsService', () => {
  let moduleRef: TestingModule;
  let service: ProjectImportsService;
  let connection: Connection;
  let jobModel: Model<ProjectImportJob>;
  let rowModel: Model<ProjectImportRow>;
  let projectsService: ProjectsServiceMock;

  beforeAll(async () => {
    projectsService = {
      upsertImportedProject: jest.fn(),
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
          { name: ProjectImportJob.name, schema: ProjectImportJobSchema },
          { name: ProjectImportRow.name, schema: ProjectImportRowSchema },
        ]),
      ],
      providers: [
        ProjectImportsService,
        { provide: getModelToken(Dictionary.name), useValue: {} },
        { provide: getModelToken(TreeDictionary.name), useValue: {} },
        { provide: getModelToken(Organization.name), useValue: {} },
        { provide: getModelToken(User.name), useValue: {} },
        { provide: getModelToken(Project.name), useValue: {} },
        { provide: BatchesService, useValue: {} },
        { provide: OrganizationsService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: ProjectsService, useValue: projectsService },
        { provide: ProjectImportFieldMappingsService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(ProjectImportsService);
    connection = moduleRef.get<Connection>(getConnectionToken());
    jobModel = moduleRef.get<Model<ProjectImportJob>>(
      getModelToken(ProjectImportJob.name),
    );
    rowModel = moduleRef.get<Model<ProjectImportRow>>(
      getModelToken(ProjectImportRow.name),
    );
    await Promise.all([jobModel.syncIndexes(), rowModel.syncIndexes()]);
  });

  beforeEach(async () => {
    projectsService.upsertImportedProject.mockClear();
    await Promise.all([
      jobModel.deleteMany({}).exec(),
      rowModel.deleteMany({}).exec(),
    ]);
  });

  afterAll(async () => {
    await Promise.all([
      jobModel.deleteMany({}).exec(),
      rowModel.deleteMany({}).exec(),
    ]);
    await connection.close();
    await moduleRef.close();
  });

  it('rejects invalid ids and missing jobs', async () => {
    await expect(service.deleteJob('invalid-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.deleteJob(new Types.ObjectId().toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects parsing jobs', async () => {
    const jobId = await createJob({ status: 'parsing' });

    await expect(service.deleteJob(jobId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.deleteJob(jobId)).rejects.toThrow(
      '导入任务仍在解析中，不能删除',
    );
  });

  it('rejects jobs with confirmed row counters', async () => {
    const jobId = await createJob({ confirmedRows: 1 });

    await expect(service.deleteJob(jobId)).rejects.toThrow(
      '该导入任务已有项目确认入库，不能删除导入记录',
    );
  });

  it('rejects jobs with confirmed row records even when counters are stale', async () => {
    const jobId = await createJob({ confirmedRows: 0 });
    await createRow(jobId, 2, 'confirmed');

    await expect(service.deleteJob(jobId)).rejects.toThrow(
      '该导入任务已有项目确认入库，不能删除导入记录',
    );
  });

  it('deletes unconfirmed jobs and their rows without touching projects', async () => {
    const jobId = await createJob({ status: 'completed' });
    await createRow(jobId, 2, 'importable');
    await createRow(jobId, 3, 'skipped');

    await expect(service.deleteJob(jobId)).resolves.toEqual({
      success: true,
      deletedJobId: jobId,
      deletedRows: 2,
    });
    await expect(jobModel.countDocuments({ _id: jobId }).exec()).resolves.toBe(
      0,
    );
    await expect(rowModel.countDocuments({ jobId }).exec()).resolves.toBe(0);
    expect(projectsService.upsertImportedProject).not.toHaveBeenCalled();
  });

  async function createJob(
    input: Partial<{
      confirmedRows: number;
      status: ProjectImportJobStatus;
    }> = {},
  ): Promise<string> {
    const job = await jobModel.create({
      originalFilename: 'projects.xlsx',
      uploadedByUserId: new Types.ObjectId(),
      batchId: new Types.ObjectId(),
      status: input.status ?? 'pending_confirmation',
      totalRows: 1,
      importableRows: input.status === 'completed' ? 0 : 1,
      pendingRows: 0,
      confirmedRows: input.confirmedRows ?? 0,
      skippedRows: input.status === 'completed' ? 1 : 0,
      failedRows: 0,
      fieldMapping: {},
    });

    return job._id.toString();
  }

  async function createRow(
    jobId: string,
    rowNumber: number,
    status: ProjectImportRow['status'],
  ): Promise<void> {
    await rowModel.create({
      jobId: new Types.ObjectId(jobId),
      rowNumber,
      raw: {},
      normalized: {},
      resolved: {},
      issues: [],
      status,
    });
  }
});

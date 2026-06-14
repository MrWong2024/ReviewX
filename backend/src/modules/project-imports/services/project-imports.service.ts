import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UserRole } from '../../../common/constants/user-roles';
import {
  PaginatedResponse,
  PaginationQueryDto,
} from '../../../common/dto/pagination-query.dto';
import { escapeRegExp, toObjectId } from '../../../common/utils/mongo-query';
import { BatchesService } from '../../batches/services/batches.service';
import { Dictionary } from '../../dictionaries/schemas/dictionary.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import {
  ImportedProjectInput,
  ProjectsService,
} from '../../projects/services/projects.service';
import { Project } from '../../projects/schemas/project.schema';
import { TreeDictionary } from '../../tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { QueryProjectImportJobsDto } from '../dto/query-project-import-jobs.dto';
import { QueryProjectImportRowsDto } from '../dto/query-project-import-rows.dto';
import { UpdateProjectImportRowDto } from '../dto/update-project-import-row.dto';
import { ProjectImportIssueCode } from '../constants/project-import-issue-codes';
import {
  ProjectImportJobStatus,
  ProjectImportRowStatus,
} from '../constants/project-import-status';
import { ProjectImportFieldMapping } from '../constants/project-import-field-map';
import { ProjectImportFieldMappingsService } from './project-import-field-mappings.service';
import {
  parseProjectImportWorkbook,
  ParsedProjectImportRow,
} from '../utils/excel-parser';
import { normalizeUploadedFilename } from '../utils/project-import-filename.util';
import { ProjectImportJob } from '../schemas/project-import-job.schema';
import { ProjectImportRow } from '../schemas/project-import-row.schema';
import {
  ProjectImportIssue,
  ProjectImportIssueCandidate,
  ProjectImportNormalizedRecord,
  ProjectImportResolvedRecord,
} from '../types/project-import-records';

export const PROJECT_IMPORT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type UploadedProjectImportFile = {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype?: string;
};

export type ProjectImportJobResponse = {
  id: string;
  originalFilename: string;
  uploadedByUserId: string;
  batchId: string;
  status: ProjectImportJobStatus;
  totalRows: number;
  importableRows: number;
  pendingRows: number;
  confirmedRows: number;
  skippedRows: number;
  failedRows: number;
  fieldMapping: ProjectImportFieldMapping;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectImportRowResponse = {
  id: string;
  jobId: string;
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: ProjectImportNormalizedRecord;
  resolved: ProjectImportResolvedRecord;
  issues: ProjectImportIssue[];
  status: ProjectImportRowStatus;
  projectId?: string | null;
  confirmedByUserId?: string | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BulkConfirmProjectImportResponse = {
  successCount: number;
  failedCount: number;
  skippedCount: number;
};

type TimestampFields = {
  createdAt: Date;
  updatedAt: Date;
};

type ProjectImportJobLean = TimestampFields & {
  _id: Types.ObjectId;
  originalFilename: string;
  uploadedByUserId: Types.ObjectId;
  batchId: Types.ObjectId;
  status: ProjectImportJobStatus;
  totalRows: number;
  importableRows: number;
  pendingRows: number;
  confirmedRows: number;
  skippedRows: number;
  failedRows: number;
  fieldMapping: ProjectImportFieldMapping;
  errorMessage?: string;
};

type ProjectImportRowLean = TimestampFields & {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: ProjectImportNormalizedRecord;
  resolved: ProjectImportResolvedRecord;
  issues: ProjectImportIssue[];
  status: ProjectImportRowStatus;
  projectId?: Types.ObjectId | null;
  confirmedByUserId?: Types.ObjectId | null;
  confirmedAt?: Date | null;
};

type NamedLean = {
  _id: Types.ObjectId;
  name: string;
  isActive?: boolean;
};

type UserMatchLean = {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  roles: string[];
  isActive?: boolean;
};

type DictionaryMatchLean = NamedLean & {
  dictType: string;
};

type TreeNodeMatchLean = NamedLean & {
  treeType: string;
};

type ExistingProjectLean = {
  _id: Types.ObjectId;
  projectNo: string;
  name: string;
};

type EvaluationInput = {
  jobId?: string;
  rowId?: string;
  batchId: string;
  rowNumber: number;
  normalized: ProjectImportNormalizedRecord;
  duplicateProjectNos?: Set<string>;
  manualResolved?: ProjectImportResolvedRecord;
};

type EvaluationResult = {
  resolved: ProjectImportResolvedRecord;
  issues: ProjectImportIssue[];
  status: ProjectImportRowStatus;
};

const NON_BLOCKING_ISSUES = new Set<ProjectImportIssueCode>([
  'existing_project_matched',
  'lead_organization_duplicated_in_cooperation',
]);

@Injectable()
export class ProjectImportsService {
  constructor(
    @InjectModel(ProjectImportJob.name)
    private readonly jobModel: Model<ProjectImportJob>,
    @InjectModel(ProjectImportRow.name)
    private readonly rowModel: Model<ProjectImportRow>,
    @InjectModel(Dictionary.name)
    private readonly dictionaryModel: Model<Dictionary>,
    @InjectModel(TreeDictionary.name)
    private readonly treeDictionaryModel: Model<TreeDictionary>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    private readonly batchesService: BatchesService,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly fieldMappingsService: ProjectImportFieldMappingsService,
  ) {}

  async upload(input: {
    file: UploadedProjectImportFile | undefined;
    batchId: string;
    uploadedByUserId: string;
  }): Promise<ProjectImportJobResponse> {
    this.assertExcelFile(input.file);

    if (!(await this.batchesService.existsById(input.batchId))) {
      throw new NotFoundException('Batch not found');
    }

    const effectiveAliasMap =
      await this.fieldMappingsService.getEffectiveAliasMap();
    const parsed = parseProjectImportWorkbook(
      input.file.buffer,
      effectiveAliasMap,
    );
    const duplicateProjectNos = this.findDuplicateProjectNos(parsed.rows);
    const job = await this.jobModel.create({
      originalFilename: normalizeUploadedFilename(input.file.originalname),
      uploadedByUserId: toObjectId(input.uploadedByUserId, 'uploadedByUserId'),
      batchId: toObjectId(input.batchId, 'batchId'),
      status: 'pending_confirmation',
      totalRows: parsed.rows.length,
      fieldMapping: parsed.fieldMapping,
    });

    const rowInputs = await Promise.all(
      parsed.rows.map(async (row) => {
        const evaluation = await this.evaluateRow({
          batchId: input.batchId,
          rowNumber: row.rowNumber,
          normalized: row.normalized,
          duplicateProjectNos,
        });

        return {
          jobId: job._id,
          rowNumber: row.rowNumber,
          raw: row.raw,
          normalized: row.normalized,
          resolved: evaluation.resolved,
          issues: evaluation.issues,
          status: evaluation.status,
        };
      }),
    );

    await this.rowModel.insertMany(rowInputs);
    await this.refreshJobStats(job._id.toString());

    return this.findJobById(job._id.toString());
  }

  async listJobs(
    query: QueryProjectImportJobsDto,
  ): Promise<PaginatedResponse<ProjectImportJobResponse>> {
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.batchId) {
      filter.batchId = toObjectId(query.batchId, 'batchId');
    }

    if (query.keyword) {
      filter.originalFilename = new RegExp(escapeRegExp(query.keyword), 'i');
    }

    return this.paginateJobs(filter, query);
  }

  async findJobById(id: string): Promise<ProjectImportJobResponse> {
    const job = await this.findJobLeanById(id);
    return this.toJobResponse(job);
  }

  async listRows(
    jobId: string,
    query: QueryProjectImportRowsDto,
  ): Promise<PaginatedResponse<ProjectImportRowResponse>> {
    await this.findJobLeanById(jobId);
    const filter: Record<string, unknown> = {
      jobId: toObjectId(jobId, 'jobId'),
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [
        { 'normalized.projectNo': keyword },
        { 'normalized.name': keyword },
        { 'normalized.leadOrganizationName': keyword },
        { 'normalized.ownerName': keyword },
      ];
    }

    return this.paginateRows(filter, query);
  }

  async updateRow(
    jobId: string,
    rowId: string,
    dto: UpdateProjectImportRowDto,
  ): Promise<ProjectImportRowResponse> {
    const job = await this.findJobLeanById(jobId);
    const row = await this.findRowLean(jobId, rowId);

    if (row.status === 'confirmed') {
      throw new ConflictException('Confirmed row cannot be modified');
    }

    const normalized = {
      ...row.normalized,
      ...(dto.normalized ?? {}),
    };
    await this.applyCreatedOrganization(dto, normalized, row);
    await this.applyCreatedOwnerUser(dto, normalized, row);

    const manualResolved = {
      ...row.resolved,
      ...(dto.resolved ?? {}),
    };
    const evaluation = await this.evaluateRow({
      jobId,
      rowId,
      batchId: job.batchId.toString(),
      rowNumber: row.rowNumber,
      normalized,
      manualResolved,
    });

    const updated = await this.rowModel
      .findByIdAndUpdate(
        row._id,
        {
          $set: {
            normalized,
            resolved: evaluation.resolved,
            issues: evaluation.issues,
            status: evaluation.status,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<ProjectImportRowLean | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException('Project import row not found');
    }

    await this.refreshJobStats(jobId);
    return this.toRowResponse(updated);
  }

  async confirmRow(input: {
    jobId: string;
    rowId: string;
    confirmedByUserId: string;
  }): Promise<ProjectImportRowResponse> {
    const job = await this.findJobLeanById(input.jobId);
    const row = await this.findRowLean(input.jobId, input.rowId);

    if (row.status !== 'importable') {
      throw new ConflictException('Only importable rows can be confirmed');
    }

    const evaluation = await this.evaluateRow({
      jobId: input.jobId,
      rowId: input.rowId,
      batchId: job.batchId.toString(),
      rowNumber: row.rowNumber,
      normalized: row.normalized,
      manualResolved: row.resolved,
    });

    if (evaluation.status !== 'importable') {
      const updated = await this.markRowFailed(
        row,
        evaluation.issues,
        'Row is no longer importable',
      );
      await this.refreshJobStats(input.jobId);
      return updated;
    }

    try {
      const project = await this.projectsService.upsertImportedProject(
        this.toImportedProjectInput(job, row, evaluation.resolved),
      );
      const updated = await this.rowModel
        .findByIdAndUpdate(
          row._id,
          {
            $set: {
              resolved: evaluation.resolved,
              issues: evaluation.issues,
              status: 'confirmed',
              projectId: toObjectId(project.id, 'projectId'),
              confirmedByUserId: toObjectId(
                input.confirmedByUserId,
                'confirmedByUserId',
              ),
              confirmedAt: new Date(),
            },
          },
          { returnDocument: 'after' },
        )
        .lean<ProjectImportRowLean | null>()
        .exec();

      if (!updated) {
        throw new NotFoundException('Project import row not found');
      }

      await this.refreshJobStats(input.jobId);
      return this.toRowResponse(updated);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to confirm row';
      const updated = await this.markRowFailed(row, [], message);
      await this.refreshJobStats(input.jobId);
      return updated;
    }
  }

  async confirmJob(input: {
    jobId: string;
    confirmedByUserId: string;
  }): Promise<BulkConfirmProjectImportResponse> {
    await this.findJobLeanById(input.jobId);
    const rows = await this.rowModel
      .find({ jobId: toObjectId(input.jobId, 'jobId') })
      .sort({ rowNumber: 1 })
      .lean<ProjectImportRowLean[]>()
      .exec();
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      if (row.status !== 'importable') {
        skippedCount += 1;
        continue;
      }

      const result = await this.confirmRow({
        jobId: input.jobId,
        rowId: row._id.toString(),
        confirmedByUserId: input.confirmedByUserId,
      });

      if (result.status === 'confirmed') {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    await this.refreshJobStats(input.jobId);
    return { successCount, failedCount, skippedCount };
  }

  async skipRow(
    jobId: string,
    rowId: string,
  ): Promise<ProjectImportRowResponse> {
    await this.findJobLeanById(jobId);
    const row = await this.findRowLean(jobId, rowId);

    if (row.status === 'confirmed') {
      throw new ConflictException('Confirmed row cannot be skipped');
    }

    const updated = await this.rowModel
      .findByIdAndUpdate(
        row._id,
        { $set: { status: 'skipped' } },
        { returnDocument: 'after' },
      )
      .lean<ProjectImportRowLean | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException('Project import row not found');
    }

    await this.refreshJobStats(jobId);
    return this.toRowResponse(updated);
  }

  private async evaluateRow(input: EvaluationInput): Promise<EvaluationResult> {
    const resolved: ProjectImportResolvedRecord = {};
    const issues: ProjectImportIssue[] = [];
    const normalized = input.normalized;

    this.addRequiredFieldIssues(normalized, issues);
    this.addFundingIssues(normalized, issues);

    await this.resolveExistingProject(input, resolved, issues);
    await this.resolveTreeNode(
      'projectTypeName',
      'projectTypeId',
      'project_type',
      'project_type_not_found',
      'project_type_ambiguous',
      normalized.projectTypeName,
      input.manualResolved?.projectTypeId,
      resolved,
      issues,
      true,
    );
    await this.resolveDictionary(
      normalized.statusName,
      input.manualResolved?.statusId,
      resolved,
      issues,
    );
    await this.resolveOwner(normalized, input.manualResolved, resolved, issues);
    await this.resolveLeadOrganization(
      normalized,
      input.manualResolved,
      resolved,
      issues,
    );
    await this.resolveCooperationOrganizations(
      normalized,
      input.manualResolved,
      resolved,
      issues,
    );
    await this.resolveDisciplines(
      normalized,
      input.manualResolved,
      resolved,
      issues,
    );
    await this.resolveTreeNode(
      'departmentName',
      'departmentId',
      'department',
      'department_not_found',
      'department_ambiguous',
      normalized.departmentName,
      input.manualResolved?.departmentId,
      resolved,
      issues,
      true,
    );
    await this.addDuplicateProjectNoIssue(input, issues);

    const hasBlockingIssue = issues.some(
      (issue) => !NON_BLOCKING_ISSUES.has(issue.code),
    );

    return {
      resolved,
      issues,
      status: hasBlockingIssue ? 'pending_confirmation' : 'importable',
    };
  }

  private addRequiredFieldIssues(
    normalized: ProjectImportNormalizedRecord,
    issues: ProjectImportIssue[],
  ): void {
    const requiredFields: Array<keyof ProjectImportNormalizedRecord> = [
      'projectNo',
      'name',
      'leadOrganizationName',
    ];

    for (const field of requiredFields) {
      if (!normalized[field]) {
        issues.push({
          field,
          code: 'required_field_missing',
          message: `${String(field)} is required`,
        });
      }
    }
  }

  private addFundingIssues(
    normalized: ProjectImportNormalizedRecord,
    issues: ProjectImportIssue[],
  ): void {
    const invalidFundingFields = this.getStringArray(
      normalized,
      'invalidFundingFields',
    );

    for (const field of invalidFundingFields) {
      issues.push({
        field,
        code: 'invalid_number',
        message: `${field} must be a non-negative number`,
      });
    }

    if (
      typeof normalized.totalFunding === 'number' &&
      typeof normalized.allocatedFunding === 'number' &&
      normalized.allocatedFunding > normalized.totalFunding
    ) {
      issues.push({
        field: 'allocatedFunding',
        code: 'funding_inconsistent',
        message: 'allocatedFunding must not exceed totalFunding',
      });
    }
  }

  private async resolveExistingProject(
    input: EvaluationInput,
    resolved: ProjectImportResolvedRecord,
    issues: ProjectImportIssue[],
  ): Promise<void> {
    if (!input.normalized.projectNo) {
      return;
    }

    const existing = await this.projectModel
      .findOne({
        batchId: toObjectId(input.batchId, 'batchId'),
        projectNo: input.normalized.projectNo,
      })
      .select({ projectNo: 1, name: 1 })
      .lean<ExistingProjectLean | null>()
      .exec();

    if (!existing) {
      return;
    }

    resolved.projectId = existing._id.toString();
    resolved.matchedExistingProject = true;
    issues.push({
      field: 'projectNo',
      code: 'existing_project_matched',
      message: 'Existing project matched and will be updated on confirmation',
      candidates: [
        {
          id: existing._id.toString(),
          name: existing.name,
          extra: existing.projectNo,
        },
      ],
    });
  }

  private async resolveDictionary(
    statusName: string | undefined,
    manualStatusId: string | undefined,
    resolved: ProjectImportResolvedRecord,
    issues: ProjectImportIssue[],
  ): Promise<void> {
    if (manualStatusId) {
      await this.assertDictionaryType(manualStatusId, 'project_status');
      resolved.statusId = manualStatusId;
      return;
    }

    if (!statusName) {
      return;
    }

    const matches = await this.dictionaryModel
      .find({ dictType: 'project_status', name: statusName })
      .select({ name: 1 })
      .lean<DictionaryMatchLean[]>()
      .exec();

    this.applyMatches({
      field: 'statusName',
      resolvedField: 'statusId',
      notFoundCode: 'status_not_found',
      ambiguousCode: 'status_ambiguous',
      matches,
      resolved,
      issues,
      required: true,
    });
  }

  private async resolveTreeNode(
    field: string,
    resolvedField: keyof ProjectImportResolvedRecord,
    treeType: string,
    notFoundCode: ProjectImportIssueCode,
    ambiguousCode: ProjectImportIssueCode,
    name: string | undefined,
    manualId: string | undefined,
    resolved: ProjectImportResolvedRecord,
    issues: ProjectImportIssue[],
    required: boolean,
  ): Promise<void> {
    if (manualId) {
      await this.assertTreeType(manualId, treeType);
      this.setResolvedString(resolved, resolvedField, manualId);
      return;
    }

    if (!name) {
      return;
    }

    const matches = await this.treeDictionaryModel
      .find({ treeType, name })
      .select({ name: 1 })
      .lean<TreeNodeMatchLean[]>()
      .exec();

    this.applyMatches({
      field,
      resolvedField,
      notFoundCode,
      ambiguousCode,
      matches,
      resolved,
      issues,
      required,
    });
  }

  private async resolveOwner(
    normalized: ProjectImportNormalizedRecord,
    manualResolved: ProjectImportResolvedRecord | undefined,
    resolved: ProjectImportResolvedRecord,
    issues: ProjectImportIssue[],
  ): Promise<void> {
    if (manualResolved?.ownerUserId) {
      await this.assertUserRole(manualResolved.ownerUserId, 'project_owner');
      resolved.ownerUserId = manualResolved.ownerUserId;
      return;
    }

    if (!normalized.ownerName && !normalized.ownerPhone) {
      issues.push({
        field: 'ownerName',
        code: 'owner_not_found',
        message: 'Project owner is required',
      });
      return;
    }

    const phoneMatches = normalized.ownerPhone
      ? await this.userModel
          .find({ phone: normalized.ownerPhone })
          .select({ name: 1, phone: 1, roles: 1, isActive: 1 })
          .lean<UserMatchLean[]>()
          .exec()
      : [];
    const matches =
      phoneMatches.length > 0
        ? phoneMatches
        : await this.userModel
            .find({ name: normalized.ownerName })
            .select({ name: 1, phone: 1, roles: 1, isActive: 1 })
            .lean<UserMatchLean[]>()
            .exec();
    const ownerMatches = matches.filter(
      (user) => user.roles.includes('project_owner') && user.isActive !== false,
    );

    if (ownerMatches.length === 1) {
      resolved.ownerUserId = ownerMatches[0]._id.toString();
      return;
    }

    issues.push({
      field: normalized.ownerPhone ? 'ownerPhone' : 'ownerName',
      code: ownerMatches.length === 0 ? 'owner_not_found' : 'owner_ambiguous',
      message:
        ownerMatches.length === 0
          ? 'Project owner not found'
          : 'Project owner is ambiguous',
      candidates: this.toUserCandidates(ownerMatches),
    });
  }

  private async resolveLeadOrganization(
    normalized: ProjectImportNormalizedRecord,
    manualResolved: ProjectImportResolvedRecord | undefined,
    resolved: ProjectImportResolvedRecord,
    issues: ProjectImportIssue[],
  ): Promise<void> {
    if (manualResolved?.leadOrganizationId) {
      await this.assertOrganizationActive(manualResolved.leadOrganizationId);
      resolved.leadOrganizationId = manualResolved.leadOrganizationId;
      return;
    }

    if (!normalized.leadOrganizationName) {
      return;
    }

    const matches = await this.organizationModel
      .find({ name: normalized.leadOrganizationName })
      .select({ name: 1, isActive: 1 })
      .lean<NamedLean[]>()
      .exec();
    const activeMatches = matches.filter((item) => item.isActive !== false);

    this.applyMatches({
      field: 'leadOrganizationName',
      resolvedField: 'leadOrganizationId',
      notFoundCode: 'lead_organization_not_found',
      ambiguousCode: 'lead_organization_ambiguous',
      matches: activeMatches,
      resolved,
      issues,
      required: true,
    });
  }

  private async resolveCooperationOrganizations(
    normalized: ProjectImportNormalizedRecord,
    manualResolved: ProjectImportResolvedRecord | undefined,
    resolved: ProjectImportResolvedRecord,
    issues: ProjectImportIssue[],
  ): Promise<void> {
    if (manualResolved?.cooperationOrganizationIds) {
      await this.assertOrganizationsActive(
        manualResolved.cooperationOrganizationIds,
      );
      resolved.cooperationOrganizationIds =
        manualResolved.cooperationOrganizationIds.filter(
          (id) => id !== resolved.leadOrganizationId,
        );
      return;
    }

    const names = normalized.cooperationOrganizationNames ?? [];
    const ids: string[] = [];

    for (const name of names) {
      if (name === normalized.leadOrganizationName) {
        issues.push({
          field: 'cooperationOrganizationNames',
          code: 'lead_organization_duplicated_in_cooperation',
          message: 'Lead organization is duplicated in cooperation list',
        });
        continue;
      }

      const matches = await this.organizationModel
        .find({ name })
        .select({ name: 1, isActive: 1 })
        .lean<NamedLean[]>()
        .exec();
      const activeMatches = matches.filter((item) => item.isActive !== false);

      if (activeMatches.length === 1) {
        ids.push(activeMatches[0]._id.toString());
        continue;
      }

      issues.push({
        field: 'cooperationOrganizationNames',
        code:
          activeMatches.length === 0
            ? 'cooperation_organization_not_found'
            : 'cooperation_organization_ambiguous',
        message:
          activeMatches.length === 0
            ? `Cooperation organization not found: ${name}`
            : `Cooperation organization is ambiguous: ${name}`,
        candidates: this.toCandidates(activeMatches),
      });
    }

    resolved.cooperationOrganizationIds = [...new Set(ids)];
  }

  private async resolveDisciplines(
    normalized: ProjectImportNormalizedRecord,
    manualResolved: ProjectImportResolvedRecord | undefined,
    resolved: ProjectImportResolvedRecord,
    issues: ProjectImportIssue[],
  ): Promise<void> {
    if (manualResolved?.disciplineIds) {
      for (const disciplineId of manualResolved.disciplineIds) {
        await this.assertTreeType(disciplineId, 'discipline');
      }
      resolved.disciplineIds = manualResolved.disciplineIds;
      return;
    }

    const disciplineNames = normalized.disciplineNames ?? [];

    if (disciplineNames.length === 0) {
      return;
    }

    const ids: string[] = [];

    for (const name of disciplineNames) {
      const matches = await this.treeDictionaryModel
        .find({ treeType: 'discipline', name })
        .select({ name: 1 })
        .lean<TreeNodeMatchLean[]>()
        .exec();

      if (matches.length === 1) {
        ids.push(matches[0]._id.toString());
        continue;
      }

      issues.push({
        field: 'disciplineName',
        code:
          matches.length === 0
            ? 'discipline_not_found'
            : 'discipline_ambiguous',
        message:
          matches.length === 0
            ? `Discipline not found: ${name}`
            : `Discipline is ambiguous: ${name}`,
        candidates: this.toCandidates(matches),
      });
    }

    resolved.disciplineIds = [...new Set(ids)];
  }

  private async addDuplicateProjectNoIssue(
    input: EvaluationInput,
    issues: ProjectImportIssue[],
  ): Promise<void> {
    if (!input.normalized.projectNo) {
      return;
    }

    if (input.duplicateProjectNos?.has(input.normalized.projectNo)) {
      issues.push({
        field: 'projectNo',
        code: 'duplicate_project_no_in_file',
        message: 'Duplicate project number in Excel file',
      });
      return;
    }

    if (!input.jobId) {
      return;
    }

    const duplicate = await this.rowModel
      .exists({
        jobId: toObjectId(input.jobId, 'jobId'),
        _id: input.rowId
          ? { $ne: toObjectId(input.rowId, 'rowId') }
          : undefined,
        'normalized.projectNo': input.normalized.projectNo,
      })
      .exec();

    if (duplicate) {
      issues.push({
        field: 'projectNo',
        code: 'duplicate_project_no_in_file',
        message: 'Duplicate project number in import job',
      });
    }
  }

  private applyMatches(input: {
    field: string;
    resolvedField: keyof ProjectImportResolvedRecord;
    notFoundCode: ProjectImportIssueCode;
    ambiguousCode: ProjectImportIssueCode;
    matches: NamedLean[];
    resolved: ProjectImportResolvedRecord;
    issues: ProjectImportIssue[];
    required: boolean;
  }): void {
    if (input.matches.length === 1) {
      this.setResolvedString(
        input.resolved,
        input.resolvedField,
        input.matches[0]._id.toString(),
      );
      return;
    }

    if (!input.required && input.matches.length === 0) {
      return;
    }

    input.issues.push({
      field: input.field,
      code:
        input.matches.length === 0 ? input.notFoundCode : input.ambiguousCode,
      message:
        input.matches.length === 0
          ? `${input.field} not found`
          : `${input.field} is ambiguous`,
      candidates: this.toCandidates(input.matches),
    });
  }

  private setResolvedString(
    resolved: ProjectImportResolvedRecord,
    field: keyof ProjectImportResolvedRecord,
    value: string,
  ): void {
    if (
      field === 'matchedExistingProject' ||
      field === 'cooperationOrganizationIds' ||
      field === 'disciplineIds'
    ) {
      return;
    }

    resolved[field] = value;
  }

  private async applyCreatedOrganization(
    dto: UpdateProjectImportRowDto,
    normalized: ProjectImportNormalizedRecord,
    row: ProjectImportRowLean,
  ): Promise<void> {
    if (!dto.createOrganization) {
      return;
    }

    const organization = await this.organizationsService.create({
      name: dto.createOrganization.name,
      contactName:
        dto.createOrganization.contactName ??
        normalized.organizationContactName,
      contactPhone:
        dto.createOrganization.contactPhone ??
        normalized.organizationContactPhone,
      regionId: dto.createOrganization.regionId,
      isActive: true,
    });
    const resolved = {
      ...row.resolved,
      ...(dto.resolved ?? {}),
    };

    if (
      !resolved.leadOrganizationId ||
      normalized.leadOrganizationName === organization.name
    ) {
      resolved.leadOrganizationId = organization.id;
    }

    const cooperationNames = normalized.cooperationOrganizationNames ?? [];

    if (cooperationNames.includes(organization.name)) {
      resolved.cooperationOrganizationIds = [
        ...new Set([
          ...(resolved.cooperationOrganizationIds ?? []),
          organization.id,
        ]),
      ];
    }

    dto.resolved = resolved;
  }

  private async applyCreatedOwnerUser(
    dto: UpdateProjectImportRowDto,
    normalized: ProjectImportNormalizedRecord,
    row: ProjectImportRowLean,
  ): Promise<void> {
    if (!dto.createOwnerUser) {
      return;
    }

    await this.assertOrganizationsActive(
      dto.createOwnerUser.organizationIds ?? [],
    );

    for (const disciplineId of dto.createOwnerUser.disciplineIds ?? []) {
      await this.assertTreeType(disciplineId, 'discipline');
    }

    const user = await this.usersService.createWithPlainPassword({
      phone: dto.createOwnerUser.phone,
      password: dto.createOwnerUser.phone,
      name: dto.createOwnerUser.name,
      roles: ['project_owner'],
      organizationIds: dto.createOwnerUser.organizationIds,
      disciplineIds: dto.createOwnerUser.disciplineIds,
      mustChangePassword: true,
      isActive: true,
    });
    const resolved = {
      ...row.resolved,
      ...(dto.resolved ?? {}),
      ownerUserId: user.id,
    };

    normalized.ownerName = dto.createOwnerUser.name;
    normalized.ownerPhone = dto.createOwnerUser.phone;
    dto.resolved = resolved;
  }

  private async assertDictionaryType(
    id: string,
    dictType: string,
  ): Promise<void> {
    const count = await this.dictionaryModel
      .countDocuments({ _id: toObjectId(id), dictType })
      .exec();

    if (count !== 1) {
      throw new BadRequestException(`${dictType} dictionary not found`);
    }
  }

  private async assertTreeType(id: string, treeType: string): Promise<void> {
    const count = await this.treeDictionaryModel
      .countDocuments({ _id: toObjectId(id), treeType })
      .exec();

    if (count !== 1) {
      throw new BadRequestException(`${treeType} tree node not found`);
    }
  }

  private async assertOrganizationActive(id: string): Promise<void> {
    const count = await this.organizationModel
      .countDocuments({ _id: toObjectId(id), isActive: true })
      .exec();

    if (count !== 1) {
      throw new BadRequestException('Organization not found or inactive');
    }
  }

  private async assertOrganizationsActive(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const objectIds = ids.map((id) => toObjectId(id, 'organizationId'));
    const count = await this.organizationModel
      .countDocuments({ _id: { $in: objectIds }, isActive: true })
      .exec();

    if (count !== objectIds.length) {
      throw new BadRequestException('Organization not found or inactive');
    }
  }

  private async assertUserRole(id: string, role: UserRole): Promise<void> {
    const count = await this.userModel
      .countDocuments({
        _id: toObjectId(id, 'userId'),
        roles: { $in: [role] },
        isActive: { $ne: false },
      })
      .exec();

    if (count !== 1) {
      throw new BadRequestException(`User must have ${role} role`);
    }
  }

  private toImportedProjectInput(
    job: ProjectImportJobLean,
    row: ProjectImportRowLean,
    resolved: ProjectImportResolvedRecord,
  ): ImportedProjectInput {
    if (
      !row.normalized.projectNo ||
      !row.normalized.name ||
      !resolved.leadOrganizationId
    ) {
      throw new BadRequestException('Missing required project import fields');
    }

    return {
      batchId: job.batchId.toString(),
      projectNo: row.normalized.projectNo,
      name: row.normalized.name,
      projectTypeId: resolved.projectTypeId,
      statusId: resolved.statusId,
      ownerUserId: resolved.ownerUserId,
      leadOrganizationId: resolved.leadOrganizationId,
      cooperationOrganizationIds: resolved.cooperationOrganizationIds ?? [],
      totalFunding: row.normalized.totalFunding ?? null,
      allocatedFunding: row.normalized.allocatedFunding ?? null,
      disciplineIds: resolved.disciplineIds ?? [],
      departmentId: resolved.departmentId,
      importedFromJobId: job._id.toString(),
    };
  }

  private async markRowFailed(
    row: ProjectImportRowLean,
    issues: ProjectImportIssue[],
    message: string,
  ): Promise<ProjectImportRowResponse> {
    const updated = await this.rowModel
      .findByIdAndUpdate(
        row._id,
        {
          $set: {
            status: 'failed',
            issues: [
              ...issues,
              {
                field: 'row',
                code: 'unknown_error',
                message,
              },
            ],
          },
        },
        { returnDocument: 'after' },
      )
      .lean<ProjectImportRowLean | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException('Project import row not found');
    }

    return this.toRowResponse(updated);
  }

  private async refreshJobStats(jobId: string): Promise<void> {
    const objectId = toObjectId(jobId, 'jobId');
    const [
      importableRows,
      pendingRows,
      confirmedRows,
      skippedRows,
      failedRows,
    ] = await Promise.all([
      this.rowModel.countDocuments({ jobId: objectId, status: 'importable' }),
      this.rowModel.countDocuments({
        jobId: objectId,
        status: 'pending_confirmation',
      }),
      this.rowModel.countDocuments({ jobId: objectId, status: 'confirmed' }),
      this.rowModel.countDocuments({ jobId: objectId, status: 'skipped' }),
      this.rowModel.countDocuments({ jobId: objectId, status: 'failed' }),
    ]);
    const totalRows =
      importableRows + pendingRows + confirmedRows + skippedRows + failedRows;
    const status: ProjectImportJobStatus =
      totalRows > 0 &&
      importableRows === 0 &&
      pendingRows === 0 &&
      failedRows === 0
        ? 'completed'
        : 'pending_confirmation';

    await this.jobModel
      .findByIdAndUpdate(objectId, {
        $set: {
          totalRows,
          importableRows,
          pendingRows,
          confirmedRows,
          skippedRows,
          failedRows,
          status,
        },
      })
      .exec();
  }

  private findDuplicateProjectNos(rows: ParsedProjectImportRow[]): Set<string> {
    const counts = new Map<string, number>();

    for (const row of rows) {
      const projectNo = row.normalized.projectNo;

      if (projectNo) {
        counts.set(projectNo, (counts.get(projectNo) ?? 0) + 1);
      }
    }

    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([projectNo]) => projectNo),
    );
  }

  private assertExcelFile(
    file: UploadedProjectImportFile | undefined,
  ): asserts file is UploadedProjectImportFile {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    if (file.size > PROJECT_IMPORT_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Excel file is too large');
    }

    if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
      throw new BadRequestException('Only .xlsx and .xls files are allowed');
    }
  }

  private async paginateJobs(
    filter: Record<string, unknown>,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ProjectImportJobResponse>> {
    const [items, total] = await Promise.all([
      this.jobModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ProjectImportJobLean[]>()
        .exec(),
      this.jobModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toJobResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  private async paginateRows(
    filter: Record<string, unknown>,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ProjectImportRowResponse>> {
    const [items, total] = await Promise.all([
      this.rowModel
        .find(filter)
        .sort({ rowNumber: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ProjectImportRowLean[]>()
        .exec(),
      this.rowModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toRowResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  private async findJobLeanById(id: string): Promise<ProjectImportJobLean> {
    const job = await this.jobModel
      .findById(toObjectId(id))
      .lean<ProjectImportJobLean | null>()
      .exec();

    if (!job) {
      throw new NotFoundException('Project import job not found');
    }

    return job;
  }

  private async findRowLean(
    jobId: string,
    rowId: string,
  ): Promise<ProjectImportRowLean> {
    const row = await this.rowModel
      .findOne({ _id: toObjectId(rowId), jobId: toObjectId(jobId, 'jobId') })
      .lean<ProjectImportRowLean | null>()
      .exec();

    if (!row) {
      throw new NotFoundException('Project import row not found');
    }

    return row;
  }

  private toJobResponse(job: ProjectImportJobLean): ProjectImportJobResponse {
    return {
      id: job._id.toString(),
      originalFilename: job.originalFilename,
      uploadedByUserId: job.uploadedByUserId.toString(),
      batchId: job.batchId.toString(),
      status: job.status,
      totalRows: job.totalRows,
      importableRows: job.importableRows,
      pendingRows: job.pendingRows,
      confirmedRows: job.confirmedRows,
      skippedRows: job.skippedRows,
      failedRows: job.failedRows,
      fieldMapping: job.fieldMapping,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private toRowResponse(row: ProjectImportRowLean): ProjectImportRowResponse {
    return {
      id: row._id.toString(),
      jobId: row.jobId.toString(),
      rowNumber: row.rowNumber,
      raw: row.raw,
      normalized: row.normalized,
      resolved: row.resolved,
      issues: row.issues,
      status: row.status,
      projectId: row.projectId?.toString() ?? null,
      confirmedByUserId: row.confirmedByUserId?.toString() ?? null,
      confirmedAt: row.confirmedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toCandidates(items: NamedLean[]): ProjectImportIssueCandidate[] {
    return items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
    }));
  }

  private toUserCandidates(
    users: UserMatchLean[],
  ): ProjectImportIssueCandidate[] {
    return users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      extra: user.phone,
    }));
  }

  private getStringArray(
    value: Record<string, unknown>,
    key: string,
  ): string[] {
    const array = value[key];

    return Array.isArray(array)
      ? array.filter((item): item is string => typeof item === 'string')
      : [];
  }
}

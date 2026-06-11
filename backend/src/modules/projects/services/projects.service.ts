import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '../../../common/constants/user-roles';
import { PaginatedResponse } from '../../../common/dto/pagination-query.dto';
import {
  escapeRegExp,
  TimestampFields,
  toObjectId,
} from '../../../common/utils/mongo-query';
import { BatchesService } from '../../batches/services/batches.service';
import { DictionariesService } from '../../dictionaries/services/dictionaries.service';
import { OrganizationsService } from '../../organizations/services/organizations.service';
import {
  ReviewSchemeResponse,
  ReviewSchemesService,
} from '../../review-schemes/services/review-schemes.service';
import { TreeDictionariesService } from '../../tree-dictionaries/services/tree-dictionaries.service';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BatchUpdateReviewAssignmentDto } from '../dto/batch-update-review-assignment.dto';
import { CreateProjectDto } from '../dto/create-project.dto';
import { QueryProjectsDto } from '../dto/query-projects.dto';
import { QueryReviewManagerProjectsDto } from '../dto/query-review-manager-projects.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UpdateProjectScheduleDto } from '../dto/update-project-schedule.dto';
import { UpdateReviewAssignmentDto } from '../dto/update-review-assignment.dto';
import { Project } from '../schemas/project.schema';

export type ProjectResponse = {
  id: string;
  batchId: string;
  projectNo: string;
  name: string;
  projectTypeId?: string | null;
  statusId?: string | null;
  ownerUserId?: string | null;
  leadOrganizationId?: string | null;
  cooperationOrganizationIds: string[];
  totalFunding?: number | null;
  allocatedFunding?: number | null;
  disciplineIds: string[];
  departmentId?: string | null;
  reviewManagerId?: string | null;
  reviewSchemeId?: string | null;
  reviewTime?: Date | null;
  reviewLocation?: string;
  meetingUrl?: string;
  followUpNeeds?: string;
  finalLevel?: string;
  originalLevel?: string;
  importedFromJobId?: string;
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectLean = TimestampFields & {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  projectNo: string;
  name: string;
  projectTypeId?: Types.ObjectId | null;
  statusId?: Types.ObjectId | null;
  ownerUserId?: Types.ObjectId | null;
  leadOrganizationId?: Types.ObjectId | null;
  cooperationOrganizationIds: Types.ObjectId[];
  totalFunding?: number | null;
  allocatedFunding?: number | null;
  disciplineIds: Types.ObjectId[];
  departmentId?: Types.ObjectId | null;
  reviewManagerId?: Types.ObjectId | null;
  reviewSchemeId?: Types.ObjectId | null;
  reviewTime?: Date | null;
  reviewLocation?: string;
  meetingUrl?: string;
  followUpNeeds?: string;
  finalLevel?: string;
  originalLevel?: string;
  importedFromJobId?: string;
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  isActive: boolean;
};

export type ProjectForReviewAssignment = ProjectLean;

export type ReviewSchemeSnapshot = {
  id: string;
  name: string;
  totalScore: number;
  items: ReviewSchemeResponse['items'];
};

export type BatchReviewAssignmentResult = {
  successCount: number;
  failedCount: number;
  failures: {
    projectId: string;
    statusCode: number;
    message: string;
  }[];
};

type NormalizedProjectInput = {
  batchId: Types.ObjectId;
  projectNo: string;
  name: string;
  projectTypeId?: Types.ObjectId | null;
  statusId?: Types.ObjectId | null;
  ownerUserId?: Types.ObjectId | null;
  leadOrganizationId?: Types.ObjectId | null;
  cooperationOrganizationIds: Types.ObjectId[];
  totalFunding?: number | null;
  allocatedFunding?: number | null;
  disciplineIds: Types.ObjectId[];
  departmentId?: Types.ObjectId | null;
  reviewManagerId?: Types.ObjectId | null;
  reviewSchemeId?: Types.ObjectId | null;
  reviewTime?: Date | null;
  reviewLocation?: string;
  meetingUrl?: string;
  followUpNeeds?: string;
  finalLevel?: string;
  originalLevel?: string;
  importedFromJobId?: string;
  isActive?: boolean;
};

export type ImportedProjectInput = {
  batchId: string;
  projectNo: string;
  name: string;
  projectTypeId?: string | null;
  statusId?: string | null;
  ownerUserId?: string | null;
  leadOrganizationId?: string | null;
  cooperationOrganizationIds?: string[];
  totalFunding?: number | null;
  allocatedFunding?: number | null;
  disciplineIds?: string[];
  departmentId?: string | null;
  importedFromJobId: string;
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private readonly batchesService: BatchesService,
    private readonly dictionariesService: DictionariesService,
    private readonly treeDictionariesService: TreeDictionariesService,
    private readonly organizationsService: OrganizationsService,
    private readonly reviewSchemesService: ReviewSchemesService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectResponse> {
    const input = await this.normalizeCreateInput(dto);
    await this.assertUniqueProjectNo(input.batchId, input.projectNo);
    const project = await this.projectModel.create(input);
    return this.toResponse(project.toObject<ProjectLean>());
  }

  async list(
    query: QueryProjectsDto,
  ): Promise<PaginatedResponse<ProjectResponse>> {
    const filter = this.buildProjectFilter(query);

    const [items, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ProjectLean[]>()
        .exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async listForReviewManager(
    query: QueryReviewManagerProjectsDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedResponse<ProjectResponse>> {
    const isAdmin = currentUser.user.roles.includes('admin');
    const filter = this.buildProjectFilter({
      ...query,
      isActive: true,
      ...(isAdmin ? {} : { reviewManagerId: currentUser.user.id }),
    });

    const [items, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ProjectLean[]>()
        .exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async findById(id: string): Promise<ProjectResponse> {
    return this.toResponse(await this.findLeanById(id));
  }

  async findActiveForReviewAssignment(
    id: string,
  ): Promise<ProjectForReviewAssignment> {
    return this.findActiveLeanById(id);
  }

  async findForReviewAssignment(
    id: string,
  ): Promise<ProjectForReviewAssignment> {
    return this.findLeanById(id);
  }

  assertCanManageProject(
    project: ProjectForReviewAssignment,
    currentUser: AuthenticatedUser,
  ): void {
    if (currentUser.user.roles.includes('admin')) {
      return;
    }

    if (
      currentUser.user.roles.includes('review_manager') &&
      project.reviewManagerId?.toString() === currentUser.user.id
    ) {
      return;
    }

    throw new ForbiddenException();
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
    const current = await this.findLeanById(id);
    const input = await this.normalizeUpdateInput(current, dto);

    await this.assertUniqueProjectNo(input.batchId, input.projectNo, id);

    const project = await this.projectModel
      .findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after' })
      .lean<ProjectLean | null>()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toResponse(project);
  }

  async remove(id: string): Promise<ProjectResponse> {
    return this.update(id, { isActive: false });
  }

  async updateReviewAssignment(
    id: string,
    dto: UpdateReviewAssignmentDto,
  ): Promise<ProjectResponse> {
    this.assertReviewAssignmentBody(dto);
    await this.findActiveLeanById(id);

    const update = await this.buildReviewAssignmentUpdate(dto);
    const project = await this.projectModel
      .findByIdAndUpdate(
        toObjectId(id),
        { $set: update },
        { returnDocument: 'after' },
      )
      .lean<ProjectLean | null>()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toResponse(project);
  }

  async batchUpdateReviewAssignment(
    dto: BatchUpdateReviewAssignmentDto,
  ): Promise<BatchReviewAssignmentResult> {
    this.assertReviewAssignmentBody(dto);

    const failures: BatchReviewAssignmentResult['failures'] = [];
    let successCount = 0;

    for (const projectId of dto.projectIds) {
      try {
        await this.updateReviewAssignment(projectId, dto);
        successCount += 1;
      } catch (error) {
        failures.push({
          projectId,
          statusCode: this.getErrorStatus(error),
          message: this.getErrorMessage(error),
        });
      }
    }

    return {
      successCount,
      failedCount: failures.length,
      failures,
    };
  }

  async updateSchedule(
    id: string,
    dto: UpdateProjectScheduleDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectResponse> {
    const project = await this.findActiveLeanById(id);
    this.assertCanManageProject(project, currentUser);

    const update: Record<string, unknown> = {};

    if (dto.reviewTime !== undefined) {
      update.reviewTime = dto.reviewTime;
    }

    if (dto.reviewLocation !== undefined) {
      update.reviewLocation = dto.reviewLocation;
    }

    if (dto.meetingUrl !== undefined) {
      update.meetingUrl = dto.meetingUrl;
    }

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(
        project._id,
        { $set: update },
        { returnDocument: 'after' },
      )
      .lean<ProjectLean | null>()
      .exec();

    if (!updatedProject) {
      throw new NotFoundException('Project not found');
    }

    return this.toResponse(updatedProject);
  }

  async upsertImportedProject(
    input: ImportedProjectInput,
  ): Promise<ProjectResponse> {
    const batchId = toObjectId(input.batchId, 'batchId');
    const projectNo = input.projectNo.trim();
    const existing = await this.projectModel
      .findOne({ batchId, projectNo })
      .lean<ProjectLean | null>()
      .exec();
    const update = {
      batchId,
      projectNo,
      name: input.name.trim(),
      projectTypeId: this.optionalObjectId(
        input.projectTypeId,
        'projectTypeId',
      ),
      statusId: this.optionalObjectId(input.statusId, 'statusId'),
      ownerUserId: this.optionalObjectId(input.ownerUserId, 'ownerUserId'),
      leadOrganizationId: this.optionalObjectId(
        input.leadOrganizationId,
        'leadOrganizationId',
      ),
      cooperationOrganizationIds: this.toObjectIdArray(
        input.cooperationOrganizationIds ?? [],
        'cooperationOrganizationIds',
      ),
      totalFunding: input.totalFunding ?? null,
      allocatedFunding: input.allocatedFunding ?? null,
      disciplineIds: this.toObjectIdArray(
        input.disciplineIds ?? [],
        'disciplineIds',
      ),
      departmentId: this.optionalObjectId(input.departmentId, 'departmentId'),
      importedFromJobId: input.importedFromJobId,
      isActive: true,
    };

    if (existing) {
      const project = await this.projectModel
        .findByIdAndUpdate(
          existing._id,
          { $set: update },
          { returnDocument: 'after' },
        )
        .lean<ProjectLean | null>()
        .exec();

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      return this.toResponse(project);
    }

    const project = await this.projectModel.create(update);
    return this.toResponse(project.toObject<ProjectLean>());
  }

  private buildProjectFilter(query: {
    batchId?: string;
    reviewManagerId?: string;
    reviewSchemeId?: string;
    projectTypeId?: string;
    statusId?: string;
    departmentId?: string;
    disciplineId?: string;
    hasReviewManager?: boolean;
    hasReviewScheme?: boolean;
    keyword?: string;
    isActive?: boolean;
  }): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.batchId) {
      filter.batchId = toObjectId(query.batchId, 'batchId');
    }

    if (query.reviewManagerId) {
      filter.reviewManagerId = toObjectId(
        query.reviewManagerId,
        'reviewManagerId',
      );
    }

    if (query.reviewSchemeId) {
      filter.reviewSchemeId = toObjectId(
        query.reviewSchemeId,
        'reviewSchemeId',
      );
    }

    if (query.projectTypeId) {
      filter.projectTypeId = toObjectId(query.projectTypeId, 'projectTypeId');
    }

    if (query.statusId) {
      filter.statusId = toObjectId(query.statusId, 'statusId');
    }

    if (query.departmentId) {
      filter.departmentId = toObjectId(query.departmentId, 'departmentId');
    }

    if (query.disciplineId) {
      filter.disciplineIds = toObjectId(query.disciplineId, 'disciplineId');
    }

    if (
      query.hasReviewManager !== undefined &&
      query.reviewManagerId === undefined
    ) {
      filter.reviewManagerId = query.hasReviewManager
        ? { $ne: null }
        : { $in: [null, undefined] };
    }

    if (
      query.hasReviewScheme !== undefined &&
      query.reviewSchemeId === undefined
    ) {
      filter.reviewSchemeId = query.hasReviewScheme
        ? { $ne: null }
        : { $in: [null, undefined] };
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [{ projectNo: keyword }, { name: keyword }];
    }

    return filter;
  }

  private assertReviewAssignmentBody(dto: UpdateReviewAssignmentDto): void {
    if (dto.reviewManagerId === undefined && dto.reviewSchemeId === undefined) {
      throw new BadRequestException(
        'reviewManagerId or reviewSchemeId is required',
      );
    }
  }

  private async buildReviewAssignmentUpdate(
    dto: UpdateReviewAssignmentDto,
  ): Promise<Record<string, unknown>> {
    const update: Record<string, unknown> = {};

    if (dto.reviewManagerId !== undefined) {
      await this.assertActiveUserRole(
        dto.reviewManagerId,
        'review_manager',
        'reviewManagerId',
      );
      update.reviewManagerId = toObjectId(
        dto.reviewManagerId,
        'reviewManagerId',
      );
    }

    if (dto.reviewSchemeId !== undefined) {
      const scheme = await this.findActiveReviewScheme(dto.reviewSchemeId);
      update.reviewSchemeId = toObjectId(dto.reviewSchemeId, 'reviewSchemeId');
      update.reviewSchemeSnapshot = this.toReviewSchemeSnapshot(scheme);
    }

    return update;
  }

  private async findActiveReviewScheme(
    reviewSchemeId: string,
  ): Promise<ReviewSchemeResponse> {
    try {
      return await this.reviewSchemesService.findActiveById(reviewSchemeId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException('Active review scheme not found');
      }

      throw error;
    }
  }

  private toReviewSchemeSnapshot(
    scheme: ReviewSchemeResponse,
  ): ReviewSchemeSnapshot {
    return {
      id: scheme.id,
      name: scheme.name,
      totalScore: scheme.totalScore,
      items: scheme.items.map((item) => ({ ...item })),
    };
  }

  private async assertActiveUserRole(
    userId: string,
    role: UserRole,
    fieldName: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (!user || user.isActive === false || user.status !== 'active') {
      throw new BadRequestException(`${fieldName} must be an active user`);
    }

    if (!user.roles.includes(role)) {
      throw new BadRequestException(`${fieldName} must have ${role} role`);
    }
  }

  private getErrorStatus(error: unknown): number {
    return error instanceof HttpException ? error.getStatus() : 500;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = response.message;
        return Array.isArray(message) ? message.join('; ') : String(message);
      }
    }

    return error instanceof Error ? error.message : 'Unknown error';
  }

  private async normalizeCreateInput(
    dto: CreateProjectDto,
  ): Promise<NormalizedProjectInput> {
    await this.assertBatch(dto.batchId);
    await this.assertProjectReferences(dto);

    return {
      batchId: toObjectId(dto.batchId, 'batchId'),
      projectNo: dto.projectNo,
      name: dto.name,
      projectTypeId: this.optionalObjectId(dto.projectTypeId, 'projectTypeId'),
      statusId: this.optionalObjectId(dto.statusId, 'statusId'),
      ownerUserId: this.optionalObjectId(dto.ownerUserId, 'ownerUserId'),
      leadOrganizationId: this.optionalObjectId(
        dto.leadOrganizationId,
        'leadOrganizationId',
      ),
      cooperationOrganizationIds: this.toObjectIdArray(
        dto.cooperationOrganizationIds ?? [],
        'cooperationOrganizationIds',
      ),
      totalFunding: dto.totalFunding ?? null,
      allocatedFunding: dto.allocatedFunding ?? null,
      disciplineIds: this.toObjectIdArray(
        dto.disciplineIds ?? [],
        'disciplineIds',
      ),
      departmentId: this.optionalObjectId(dto.departmentId, 'departmentId'),
      reviewManagerId: this.optionalObjectId(
        dto.reviewManagerId,
        'reviewManagerId',
      ),
      reviewSchemeId: this.optionalObjectId(
        dto.reviewSchemeId,
        'reviewSchemeId',
      ),
      reviewTime: dto.reviewTime ?? null,
      reviewLocation: dto.reviewLocation,
      meetingUrl: dto.meetingUrl,
      followUpNeeds: dto.followUpNeeds,
      finalLevel: dto.finalLevel,
      originalLevel: dto.originalLevel,
      importedFromJobId: dto.importedFromJobId,
      isActive: dto.isActive,
    };
  }

  private async normalizeUpdateInput(
    current: ProjectLean,
    dto: UpdateProjectDto,
  ): Promise<NormalizedProjectInput> {
    const merged: CreateProjectDto = {
      batchId: dto.batchId ?? current.batchId.toString(),
      projectNo: dto.projectNo ?? current.projectNo,
      name: dto.name ?? current.name,
      projectTypeId:
        dto.projectTypeId === undefined
          ? current.projectTypeId?.toString()
          : dto.projectTypeId,
      statusId:
        dto.statusId === undefined
          ? current.statusId?.toString()
          : dto.statusId,
      ownerUserId:
        dto.ownerUserId === undefined
          ? current.ownerUserId?.toString()
          : dto.ownerUserId,
      leadOrganizationId:
        dto.leadOrganizationId === undefined
          ? current.leadOrganizationId?.toString()
          : dto.leadOrganizationId,
      cooperationOrganizationIds:
        dto.cooperationOrganizationIds ??
        current.cooperationOrganizationIds.map((id) => id.toString()),
      totalFunding:
        dto.totalFunding === undefined
          ? (current.totalFunding ?? undefined)
          : dto.totalFunding,
      allocatedFunding:
        dto.allocatedFunding === undefined
          ? (current.allocatedFunding ?? undefined)
          : dto.allocatedFunding,
      disciplineIds:
        dto.disciplineIds ?? current.disciplineIds.map((id) => id.toString()),
      departmentId:
        dto.departmentId === undefined
          ? current.departmentId?.toString()
          : dto.departmentId,
      reviewManagerId:
        dto.reviewManagerId === undefined
          ? current.reviewManagerId?.toString()
          : dto.reviewManagerId,
      reviewSchemeId:
        dto.reviewSchemeId === undefined
          ? current.reviewSchemeId?.toString()
          : dto.reviewSchemeId,
      reviewTime:
        dto.reviewTime === undefined
          ? (current.reviewTime ?? undefined)
          : dto.reviewTime,
      reviewLocation: dto.reviewLocation ?? current.reviewLocation,
      meetingUrl: dto.meetingUrl ?? current.meetingUrl,
      followUpNeeds: dto.followUpNeeds ?? current.followUpNeeds,
      finalLevel: dto.finalLevel ?? current.finalLevel,
      originalLevel: dto.originalLevel ?? current.originalLevel,
      importedFromJobId: dto.importedFromJobId ?? current.importedFromJobId,
      isActive: dto.isActive ?? current.isActive,
    };

    return this.normalizeCreateInput(merged);
  }

  private async assertProjectReferences(dto: CreateProjectDto): Promise<void> {
    if (dto.projectTypeId) {
      await this.treeDictionariesService.findByIdAndType(
        dto.projectTypeId,
        'project_type',
      );
    }

    if (dto.statusId) {
      await this.dictionariesService.findByIdAndType(
        dto.statusId,
        'project_status',
      );
    }

    if (dto.ownerUserId) {
      await this.assertUserRole(
        dto.ownerUserId,
        'project_owner',
        'ownerUserId',
      );
    }

    if (dto.leadOrganizationId) {
      await this.organizationsService.assertAllExist([dto.leadOrganizationId]);
    }

    const cooperationOrganizationIds = dto.cooperationOrganizationIds ?? [];

    if (
      dto.leadOrganizationId &&
      cooperationOrganizationIds.includes(dto.leadOrganizationId)
    ) {
      throw new BadRequestException(
        'leadOrganizationId must not appear in cooperationOrganizationIds',
      );
    }

    if (cooperationOrganizationIds.length > 0) {
      await this.organizationsService.assertAllExist(
        cooperationOrganizationIds,
      );
    }

    for (const disciplineId of dto.disciplineIds ?? []) {
      await this.treeDictionariesService.findByIdAndType(
        disciplineId,
        'discipline',
      );
    }

    if (dto.departmentId) {
      await this.treeDictionariesService.findByIdAndType(
        dto.departmentId,
        'department',
      );
    }

    if (dto.reviewManagerId) {
      await this.assertUserRole(
        dto.reviewManagerId,
        'review_manager',
        'reviewManagerId',
      );
    }

    if (dto.reviewSchemeId) {
      await this.reviewSchemesService.findActiveById(dto.reviewSchemeId);
    }
  }

  private async assertBatch(batchId: string): Promise<void> {
    if (!(await this.batchesService.existsById(batchId))) {
      throw new NotFoundException('Batch not found');
    }
  }

  private async assertUserRole(
    userId: string,
    role: UserRole,
    fieldName: string,
  ): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.roles.includes(role)) {
      throw new BadRequestException(`${fieldName} must have ${role} role`);
    }
  }

  private async assertUniqueProjectNo(
    batchId: Types.ObjectId,
    projectNo: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = { batchId, projectNo };

    if (excludeId) {
      filter._id = { $ne: toObjectId(excludeId) };
    }

    const duplicate = await this.projectModel.exists(filter).exec();

    if (duplicate) {
      throw new ConflictException('Project number already exists in batch');
    }
  }

  private optionalObjectId(
    value: string | null | undefined,
    fieldName: string,
  ): Types.ObjectId | null {
    return value ? toObjectId(value, fieldName) : null;
  }

  private toObjectIdArray(
    values: string[],
    fieldName: string,
  ): Types.ObjectId[] {
    return values.map((value) => toObjectId(value, fieldName));
  }

  private async findLeanById(id: string): Promise<ProjectLean> {
    const project = await this.projectModel
      .findById(toObjectId(id))
      .lean<ProjectLean | null>()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async findActiveLeanById(id: string): Promise<ProjectLean> {
    const project = await this.projectModel
      .findOne({ _id: toObjectId(id), isActive: true })
      .lean<ProjectLean | null>()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private toResponse(project: ProjectLean): ProjectResponse {
    return {
      id: project._id.toString(),
      batchId: project.batchId.toString(),
      projectNo: project.projectNo,
      name: project.name,
      projectTypeId: project.projectTypeId?.toString() ?? null,
      statusId: project.statusId?.toString() ?? null,
      ownerUserId: project.ownerUserId?.toString() ?? null,
      leadOrganizationId: project.leadOrganizationId?.toString() ?? null,
      cooperationOrganizationIds: project.cooperationOrganizationIds.map((id) =>
        id.toString(),
      ),
      totalFunding: project.totalFunding,
      allocatedFunding: project.allocatedFunding,
      disciplineIds: project.disciplineIds.map((id) => id.toString()),
      departmentId: project.departmentId?.toString() ?? null,
      reviewManagerId: project.reviewManagerId?.toString() ?? null,
      reviewSchemeId: project.reviewSchemeId?.toString() ?? null,
      reviewTime: project.reviewTime,
      reviewLocation: project.reviewLocation,
      meetingUrl: project.meetingUrl,
      followUpNeeds: project.followUpNeeds,
      finalLevel: project.finalLevel,
      originalLevel: project.originalLevel,
      importedFromJobId: project.importedFromJobId,
      reviewSchemeSnapshot: project.reviewSchemeSnapshot,
      isActive: project.isActive,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'node:crypto';
import { Model, Types } from 'mongoose';
import {
  PaginatedResponse,
  PaginationQueryDto,
} from '../../../common/dto/pagination-query.dto';
import {
  escapeRegExp,
  TimestampFields,
  toObjectId,
} from '../../../common/utils/mongo-query';
import { normalizeUploadedFilename } from '../../../common/utils/uploaded-filename.util';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { Dictionary } from '../../dictionaries/schemas/dictionary.schema';
import { ProjectExpertAssignment } from '../../project-expert-assignments/schemas/project-expert-assignment.schema';
import { Project } from '../../projects/schemas/project.schema';
import {
  DEFAULT_SIGNED_URL_EXPIRES_SECONDS,
  STORAGE_SERVICE,
} from '../../storage/storage.constants';
import type { StorageDriver } from '../../storage/storage.constants';
import { StorageConfigService } from '../../storage/storage-config.service';
import type { StorageService } from '../../storage/storage.interface';
import {
  buildObjectKey,
  getLowercaseExtension,
  sanitizeFilename,
} from '../../storage/utils/object-key.util';
import {
  ALLOWED_PROJECT_MATERIAL_EXTENSIONS,
  BLOCKED_PROJECT_MATERIAL_EXTENSIONS,
  MATERIAL_TYPE_DICT_TYPE,
  PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES,
  PROJECT_MATERIAL_MAX_FILES,
  ProjectMaterialPersistedStatus,
  ProjectMaterialStatus,
} from '../constants/project-material.constants';
import { DeleteProjectMaterialAdminDto } from '../dto/delete-project-material-admin.dto';
import { QueryExpertProjectsDto } from '../dto/query-expert-projects.dto';
import { QueryProjectMaterialsDto } from '../dto/query-project-materials.dto';
import { QueryProjectOwnerProjectsDto } from '../dto/query-project-owner-projects.dto';
import { SubmitProjectMaterialsDto } from '../dto/submit-project-materials.dto';
import { UpdateFollowUpNeedsDto } from '../dto/update-follow-up-needs.dto';
import { UploadProjectMaterialsDto } from '../dto/upload-project-materials.dto';
import {
  ProjectMaterialDeletedByRole,
  ProjectMaterialDeletionLog,
} from '../schemas/project-material-deletion-log.schema';
import { ProjectMaterial } from '../schemas/project-material.schema';

export type UploadedProjectMaterialFile = {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype?: string;
};

export type MaterialTypeSummary = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
};

export type ProjectMaterialResponse = {
  id: string;
  projectId: string;
  materialTypeId: string;
  materialType?: MaterialTypeSummary;
  uploadedByUserId: string;
  originalFilename: string;
  safeFilename: string;
  objectKey: string;
  bucket: string;
  storageDriver: StorageDriver;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sha256?: string;
  remark?: string;
  status: ProjectMaterialStatus;
  submittedAt?: Date | null;
  submittedByUserId?: string | null;
  deletedAt?: Date | null;
  deletedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectPortalResponse = {
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
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  isActive: boolean;
  materialCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UploadProjectMaterialsResult = {
  materials: ProjectMaterialResponse[];
  successCount: number;
  failedCount: number;
  failures: {
    originalFilename: string;
    message: string;
  }[];
};

export type DeleteProjectMaterialResult = {
  deleted: boolean;
  alreadyDeleted?: boolean;
  deletionLogId?: string;
};

export type AdminDeleteProjectMaterialResult = {
  deleted: boolean;
  deletionLogId: string;
};

export type SubmitProjectMaterialsResult = {
  submittedCount: number;
  alreadySubmittedCount: number;
  skippedCount: number;
  submittedMaterialIds: string[];
  skipped: {
    materialId: string;
    reason: string;
  }[];
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
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  isActive: boolean;
};

type ProjectMaterialLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  materialTypeId: Types.ObjectId;
  uploadedByUserId: Types.ObjectId;
  originalFilename: string;
  safeFilename: string;
  objectKey: string;
  bucket: string;
  storageDriver: StorageDriver;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sha256?: string;
  remark?: string;
  status: ProjectMaterialPersistedStatus;
  submittedAt?: Date | null;
  submittedByUserId?: Types.ObjectId | null;
  deletedAt?: Date | null;
  deletedByUserId?: Types.ObjectId | null;
};

type ProjectMaterialVisibleLean = Omit<ProjectMaterialLean, 'status'> & {
  status: ProjectMaterialStatus;
};

type MaterialTypeLean = {
  _id: Types.ObjectId;
  dictType: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

type AssignmentProjectIdLean = {
  projectId: Types.ObjectId;
};

type ValidatedFile = {
  file: UploadedProjectMaterialFile;
  originalFilename: string;
  safeFilename: string;
  extension: string;
  mimeType: string;
  sha256: string;
};

const OWNER_VISIBLE_MATERIAL_STATUSES: ProjectMaterialStatus[] = [
  'draft',
  'submitted',
  'active',
];
const SUBMITTABLE_MATERIAL_STATUSES: ProjectMaterialStatus[] = [
  'draft',
  'active',
];
const SUBMITTED_MATERIAL_STATUSES: ProjectMaterialStatus[] = ['submitted'];
const ADMIN_VISIBLE_MATERIAL_STATUSES: ProjectMaterialStatus[] = [
  'draft',
  'submitted',
  'active',
];

@Injectable()
export class ProjectMaterialsService {
  constructor(
    @InjectModel(ProjectMaterial.name)
    private readonly materialModel: Model<ProjectMaterial>,
    @InjectModel(ProjectMaterialDeletionLog.name)
    private readonly deletionLogModel: Model<ProjectMaterialDeletionLog>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Dictionary.name)
    private readonly dictionaryModel: Model<Dictionary>,
    @InjectModel(ProjectExpertAssignment.name)
    private readonly assignmentModel: Model<ProjectExpertAssignment>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    private readonly storageConfigService: StorageConfigService,
  ) {}

  async listProjectOwnerProjects(
    query: QueryProjectOwnerProjectsDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedResponse<ProjectPortalResponse>> {
    const filter = this.buildProjectFilter(query, {
      ownerUserId: toObjectId(currentUser.user.id, 'userId'),
      isActive: true,
    });

    return this.paginateProjects(
      filter,
      query,
      OWNER_VISIBLE_MATERIAL_STATUSES,
    );
  }

  async getProjectOwnerProject(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectPortalResponse> {
    const project = await this.assertProjectOwnerAccess(
      projectId,
      currentUser.user.id,
    );
    return this.toProjectPortalResponse(
      project,
      await this.countMaterialsByStatuses(
        project._id,
        OWNER_VISIBLE_MATERIAL_STATUSES,
      ),
    );
  }

  async updateFollowUpNeeds(
    projectId: string,
    dto: UpdateFollowUpNeedsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectPortalResponse> {
    const project = await this.assertProjectOwnerAccess(
      projectId,
      currentUser.user.id,
    );
    const updated = await this.projectModel
      .findByIdAndUpdate(
        project._id,
        { $set: { followUpNeeds: dto.followUpNeeds } },
        { returnDocument: 'after' },
      )
      .lean<ProjectLean | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException('Project not found');
    }

    return this.toProjectPortalResponse(
      updated,
      await this.countMaterialsByStatuses(
        updated._id,
        OWNER_VISIBLE_MATERIAL_STATUSES,
      ),
    );
  }

  async listExpertProjects(
    query: QueryExpertProjectsDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedResponse<ProjectPortalResponse>> {
    const projectIds = await this.findAssignedProjectIds(currentUser.user.id);

    if (projectIds.length === 0) {
      return {
        items: [],
        page: query.page,
        pageSize: query.pageSize,
        total: 0,
      };
    }

    const filter = this.buildProjectFilter(query, {
      _id: { $in: projectIds },
      isActive: true,
    });

    return this.paginateProjects(filter, query, SUBMITTED_MATERIAL_STATUSES);
  }

  async getExpertProject(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectPortalResponse> {
    const project = await this.assertExpertAssignedAccess(
      projectId,
      currentUser.user.id,
    );
    return this.toProjectPortalResponse(
      project,
      await this.countMaterialsByStatuses(
        project._id,
        SUBMITTED_MATERIAL_STATUSES,
      ),
    );
  }

  async listOwnerMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMaterialResponse[]> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    return this.listMaterialsByStatuses(
      projectId,
      query,
      OWNER_VISIBLE_MATERIAL_STATUSES,
    );
  }

  async uploadOwnerMaterials(input: {
    projectId: string;
    dto: UploadProjectMaterialsDto;
    files: UploadedProjectMaterialFile[] | undefined;
    currentUser: AuthenticatedUser;
  }): Promise<UploadProjectMaterialsResult> {
    const project = await this.assertProjectOwnerAccess(
      input.projectId,
      input.currentUser.user.id,
    );
    const files = input.files ?? [];

    if (files.length === 0) {
      throw new BadRequestException('files are required');
    }

    if (files.length > PROJECT_MATERIAL_MAX_FILES) {
      throw new BadRequestException(
        `At most ${PROJECT_MATERIAL_MAX_FILES} files can be uploaded at once`,
      );
    }

    const materialType = await this.findActiveMaterialType(
      input.dto.materialTypeId,
    );
    const failures: UploadProjectMaterialsResult['failures'] = [];
    const materials: ProjectMaterialResponse[] = [];
    const isSingleFile = files.length === 1;

    for (const file of files) {
      try {
        const validatedFile = this.validateFile(file);
        const uploaded = await this.uploadAndPersistMaterial({
          project,
          materialType,
          uploadedByUserId: input.currentUser.user.id,
          remark: input.dto.remark ?? '',
          validatedFile,
        });
        materials.push(uploaded);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to upload file';

        if (isSingleFile) {
          throw error;
        }

        failures.push({
          originalFilename: normalizeUploadedFilename(file.originalname),
          message,
        });
      }
    }

    if (materials.length === 0 && failures.length > 0) {
      throw new BadRequestException({
        message: 'No files were uploaded',
        failures,
      });
    }

    return {
      materials,
      successCount: materials.length,
      failedCount: failures.length,
      failures,
    };
  }

  async getOwnerMaterialDownloadUrl(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    return this.getMaterialSignedUrl(
      projectId,
      materialId,
      OWNER_VISIBLE_MATERIAL_STATUSES,
    );
  }

  async submitOwnerMaterials(
    projectId: string,
    dto: SubmitProjectMaterialsDto,
    currentUser: AuthenticatedUser,
  ): Promise<SubmitProjectMaterialsResult> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    const requestedMaterialIds = [...new Set(dto.materialIds ?? [])];
    const submitAll = requestedMaterialIds.length === 0;
    const projectObjectId = toObjectId(projectId, 'projectId');
    const submittedByUserId = toObjectId(currentUser.user.id, 'userId');
    const now = new Date();

    if (submitAll) {
      const materials = await this.materialModel
        .find({
          projectId: projectObjectId,
          status: { $in: SUBMITTABLE_MATERIAL_STATUSES },
        })
        .select({ _id: 1 })
        .lean<{ _id: Types.ObjectId }[]>()
        .exec();
      const materialObjectIds = materials.map((material) => material._id);

      if (materialObjectIds.length > 0) {
        await this.materialModel
          .updateMany(
            { _id: { $in: materialObjectIds } },
            {
              $set: {
                status: 'submitted',
                submittedAt: now,
                submittedByUserId,
              },
            },
          )
          .exec();
      }

      return {
        submittedCount: materialObjectIds.length,
        alreadySubmittedCount: 0,
        skippedCount: 0,
        submittedMaterialIds: materialObjectIds.map((id) => id.toString()),
        skipped: [],
      };
    }

    const requestedObjectIds = requestedMaterialIds.map((materialId) =>
      toObjectId(materialId, 'materialId'),
    );
    const materials = await this.materialModel
      .find({
        _id: { $in: requestedObjectIds },
        projectId: projectObjectId,
        status: { $in: OWNER_VISIBLE_MATERIAL_STATUSES },
      })
      .select({ _id: 1, status: 1 })
      .lean<{ _id: Types.ObjectId; status: ProjectMaterialStatus }[]>()
      .exec();
    const materialsById = new Map(
      materials.map((material) => [material._id.toString(), material]),
    );
    const submitIds: Types.ObjectId[] = [];
    const submittedMaterialIds: string[] = [];
    const skipped: SubmitProjectMaterialsResult['skipped'] = [];
    let alreadySubmittedCount = 0;

    for (const materialId of requestedMaterialIds) {
      const material = materialsById.get(materialId);

      if (!material) {
        skipped.push({ materialId, reason: 'not_found' });
        continue;
      }

      if (material.status === 'submitted') {
        alreadySubmittedCount += 1;
        continue;
      }

      submitIds.push(material._id);
      submittedMaterialIds.push(materialId);
    }

    if (submitIds.length > 0) {
      await this.materialModel
        .updateMany(
          { _id: { $in: submitIds } },
          {
            $set: {
              status: 'submitted',
              submittedAt: now,
              submittedByUserId,
            },
          },
        )
        .exec();
    }

    return {
      submittedCount: submittedMaterialIds.length,
      alreadySubmittedCount,
      skippedCount: skipped.length,
      submittedMaterialIds,
      skipped,
    };
  }

  async deleteOwnerMaterial(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ): Promise<DeleteProjectMaterialResult> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    const material = await this.findMaterialByProjectAndStatuses(
      projectId,
      materialId,
      OWNER_VISIBLE_MATERIAL_STATUSES,
    );

    if (material.status === 'submitted') {
      throw new ConflictException(
        'Submitted material cannot be deleted by project owner',
      );
    }

    return this.deleteMaterialWithStorage({
      material,
      deletedByUserId: currentUser.user.id,
      deletedByRole: 'project_owner',
      deleteReason: 'project_owner_draft_delete',
    });
  }

  async softDeleteOwnerMaterial(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ): Promise<DeleteProjectMaterialResult> {
    return this.deleteOwnerMaterial(projectId, materialId, currentUser);
  }

  async listReviewManagerMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMaterialResponse[]> {
    await this.assertReviewManagerAccess(projectId, currentUser);
    return this.listMaterialsByStatuses(
      projectId,
      query,
      SUBMITTED_MATERIAL_STATUSES,
    );
  }

  async getReviewManagerMaterialDownloadUrl(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertReviewManagerAccess(projectId, currentUser);
    return this.getMaterialSignedUrl(
      projectId,
      materialId,
      SUBMITTED_MATERIAL_STATUSES,
    );
  }

  async listExpertMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMaterialResponse[]> {
    await this.assertExpertAssignedAccess(projectId, currentUser.user.id);
    return this.listMaterialsByStatuses(
      projectId,
      query,
      SUBMITTED_MATERIAL_STATUSES,
    );
  }

  async getExpertMaterialDownloadUrl(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertExpertAssignedAccess(projectId, currentUser.user.id);
    return this.getMaterialSignedUrl(
      projectId,
      materialId,
      SUBMITTED_MATERIAL_STATUSES,
    );
  }

  async listAdminMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
  ): Promise<ProjectMaterialResponse[]> {
    await this.findActiveProject(projectId);
    return this.listMaterialsByStatuses(
      projectId,
      query,
      ADMIN_VISIBLE_MATERIAL_STATUSES,
    );
  }

  async getAdminMaterialDownloadUrl(projectId: string, materialId: string) {
    await this.findActiveProject(projectId);
    return this.getMaterialSignedUrl(
      projectId,
      materialId,
      ADMIN_VISIBLE_MATERIAL_STATUSES,
    );
  }

  async deleteAdminMaterial(
    projectId: string,
    materialId: string,
    dto: DeleteProjectMaterialAdminDto,
    currentUser: AuthenticatedUser,
  ): Promise<AdminDeleteProjectMaterialResult> {
    await this.findActiveProject(projectId);
    const reason = typeof dto.reason === 'string' ? dto.reason.trim() : '';

    if (!reason) {
      throw new BadRequestException('reason is required');
    }

    const material = await this.findMaterialByProjectAndStatuses(
      projectId,
      materialId,
      ADMIN_VISIBLE_MATERIAL_STATUSES,
    );
    const result = await this.deleteMaterialWithStorage({
      material,
      deletedByUserId: currentUser.user.id,
      deletedByRole: 'admin',
      deleteReason: reason,
    });

    if (!result.deletionLogId) {
      throw new InternalServerErrorException('Failed to create deletion log');
    }

    return { deleted: true, deletionLogId: result.deletionLogId };
  }

  private async uploadAndPersistMaterial(input: {
    project: ProjectLean;
    materialType: MaterialTypeLean;
    uploadedByUserId: string;
    remark: string;
    validatedFile: ValidatedFile;
  }): Promise<ProjectMaterialResponse> {
    const objectKey = buildObjectKey({
      objectPrefix: this.storageConfigService.getObjectPrefix(),
      projectId: input.project._id.toString(),
      materialTypeCode: input.materialType.code,
      materialTypeId: input.materialType._id.toString(),
      safeFilename: input.validatedFile.safeFilename,
    });
    const uploaded = await this.storageService.uploadFile({
      objectKey,
      buffer: input.validatedFile.file.buffer,
      sizeBytes: input.validatedFile.file.size,
      mimeType: input.validatedFile.mimeType,
    });

    try {
      const material = await this.materialModel.create({
        projectId: input.project._id,
        materialTypeId: input.materialType._id,
        uploadedByUserId: toObjectId(input.uploadedByUserId, 'userId'),
        originalFilename: input.validatedFile.originalFilename,
        safeFilename: input.validatedFile.safeFilename,
        objectKey: uploaded.objectKey,
        bucket: uploaded.bucket,
        storageDriver: this.storageService.driver,
        mimeType: uploaded.mimeType,
        extension: input.validatedFile.extension,
        sizeBytes: uploaded.sizeBytes,
        sha256: input.validatedFile.sha256,
        remark: input.remark,
        status: 'draft',
        submittedAt: null,
        submittedByUserId: null,
      });

      return this.toMaterialResponse(
        material.toObject<ProjectMaterialVisibleLean>(),
        {
          [input.materialType._id.toString()]: this.toMaterialTypeSummary(
            input.materialType,
          ),
        },
      );
    } catch (error) {
      await this.storageService.deleteObject(uploaded.objectKey);
      throw error;
    }
  }

  private validateFile(file: UploadedProjectMaterialFile): ValidatedFile {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size <= 0) {
      throw new BadRequestException('File must not be empty');
    }

    if (file.size > PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File is too large');
    }

    const originalFilename = normalizeUploadedFilename(file.originalname);
    const safeFilename = sanitizeFilename(originalFilename);
    const extension = getLowercaseExtension(safeFilename);

    if (!extension) {
      throw new BadRequestException('File extension is required');
    }

    if (BLOCKED_PROJECT_MATERIAL_EXTENSIONS.includes(extension as never)) {
      throw new BadRequestException('File extension is not allowed');
    }

    if (!ALLOWED_PROJECT_MATERIAL_EXTENSIONS.includes(extension as never)) {
      throw new BadRequestException('File extension is not allowed');
    }

    return {
      file,
      originalFilename,
      safeFilename,
      extension,
      mimeType: file.mimetype?.trim() || 'application/octet-stream',
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
    };
  }

  private async getMaterialSignedUrl(
    projectId: string,
    materialId: string,
    statuses: ProjectMaterialStatus[],
  ) {
    const material = await this.findMaterialByProjectAndStatuses(
      projectId,
      materialId,
      statuses,
    );
    return this.storageService.getSignedUrl(material.objectKey, {
      expiresInSeconds: DEFAULT_SIGNED_URL_EXPIRES_SECONDS,
    });
  }

  private async listMaterialsByStatuses(
    projectId: string,
    query: QueryProjectMaterialsDto,
    statuses: ProjectMaterialStatus[],
  ): Promise<ProjectMaterialResponse[]> {
    const filter: Record<string, unknown> = {
      projectId: toObjectId(projectId, 'projectId'),
      status: { $in: statuses },
    };

    if (query.materialTypeId) {
      filter.materialTypeId = toObjectId(
        query.materialTypeId,
        'materialTypeId',
      );
    }

    const items = await this.materialModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean<ProjectMaterialVisibleLean[]>()
      .exec();
    const materialTypes = await this.getMaterialTypeMap(
      items.map((item) => item.materialTypeId),
    );

    return items
      .map((item) => this.toMaterialResponse(item, materialTypes))
      .sort((left, right) => {
        const leftOrder = left.materialType?.sortOrder ?? 0;
        const rightOrder = right.materialType?.sortOrder ?? 0;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return right.createdAt.getTime() - left.createdAt.getTime();
      });
  }

  private async paginateProjects(
    filter: Record<string, unknown>,
    query: PaginationQueryDto,
    materialCountStatuses: ProjectMaterialStatus[],
  ): Promise<PaginatedResponse<ProjectPortalResponse>> {
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
    const counts = await this.countMaterialsByProjectAndStatuses(
      items.map((item) => item._id),
      materialCountStatuses,
    );

    return {
      items: items.map((item) =>
        this.toProjectPortalResponse(
          item,
          counts.get(item._id.toString()) ?? 0,
        ),
      ),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  private buildProjectFilter(
    query: {
      batchId?: string;
      statusId?: string;
      projectTypeId?: string;
      reviewManagerId?: string;
      reviewSchemeId?: string;
      keyword?: string;
    },
    baseFilter: Record<string, unknown>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = { ...baseFilter };

    if (query.batchId) {
      filter.batchId = toObjectId(query.batchId, 'batchId');
    }

    if (query.statusId) {
      filter.statusId = toObjectId(query.statusId, 'statusId');
    }

    if (query.projectTypeId) {
      filter.projectTypeId = toObjectId(query.projectTypeId, 'projectTypeId');
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

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [{ projectNo: keyword }, { name: keyword }];
    }

    return filter;
  }

  private async assertProjectOwnerAccess(
    projectId: string,
    userId: string,
  ): Promise<ProjectLean> {
    const project = await this.findActiveProject(projectId);

    if (project.ownerUserId?.toString() !== userId) {
      throw new ForbiddenException();
    }

    return project;
  }

  private async assertReviewManagerAccess(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectLean> {
    const project = await this.findActiveProject(projectId);

    if (currentUser.user.roles.includes('admin')) {
      return project;
    }

    if (project.reviewManagerId?.toString() !== currentUser.user.id) {
      throw new ForbiddenException();
    }

    return project;
  }

  private async assertExpertAssignedAccess(
    projectId: string,
    expertUserId: string,
  ): Promise<ProjectLean> {
    const project = await this.findActiveProject(projectId);
    const assignment = await this.assignmentModel
      .exists({
        projectId: project._id,
        expertUserId: toObjectId(expertUserId, 'expertUserId'),
        status: 'assigned',
      })
      .exec();

    if (!assignment) {
      throw new ForbiddenException();
    }

    return project;
  }

  private async findActiveProject(projectId: string): Promise<ProjectLean> {
    const project = await this.projectModel
      .findOne({ _id: toObjectId(projectId), isActive: true })
      .lean<ProjectLean | null>()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async findMaterialByProjectAndStatuses(
    projectId: string,
    materialId: string,
    statuses: ProjectMaterialStatus[],
  ): Promise<ProjectMaterialVisibleLean> {
    const material = await this.materialModel
      .findOne({
        _id: toObjectId(materialId, 'materialId'),
        projectId: toObjectId(projectId, 'projectId'),
        status: { $in: statuses },
      })
      .lean<ProjectMaterialVisibleLean | null>()
      .exec();

    if (!material) {
      throw new NotFoundException('Project material not found');
    }

    return material;
  }

  private async findActiveMaterialType(
    materialTypeId: string,
  ): Promise<MaterialTypeLean> {
    const materialType = await this.dictionaryModel
      .findOne({
        _id: toObjectId(materialTypeId, 'materialTypeId'),
        dictType: MATERIAL_TYPE_DICT_TYPE,
        isActive: true,
      })
      .select({ dictType: 1, code: 1, name: 1, sortOrder: 1, isActive: 1 })
      .lean<MaterialTypeLean | null>()
      .exec();

    if (!materialType) {
      throw new BadRequestException(
        'materialTypeId must be an active material_type dictionary',
      );
    }

    return materialType;
  }

  private async findAssignedProjectIds(
    expertUserId: string,
  ): Promise<Types.ObjectId[]> {
    const assignments = await this.assignmentModel
      .find({
        expertUserId: toObjectId(expertUserId, 'expertUserId'),
        status: 'assigned',
      })
      .select({ projectId: 1 })
      .lean<AssignmentProjectIdLean[]>()
      .exec();

    return assignments.map((assignment) => assignment.projectId);
  }

  private async countMaterialsByStatuses(
    projectId: Types.ObjectId,
    statuses: ProjectMaterialStatus[],
  ): Promise<number> {
    return this.materialModel
      .countDocuments({ projectId, status: { $in: statuses } })
      .exec();
  }

  private async countMaterialsByProjectAndStatuses(
    projectIds: Types.ObjectId[],
    statuses: ProjectMaterialStatus[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    await Promise.all(
      projectIds.map(async (projectId) => {
        counts.set(
          projectId.toString(),
          await this.countMaterialsByStatuses(projectId, statuses),
        );
      }),
    );

    return counts;
  }

  private async deleteMaterialWithStorage(input: {
    material: ProjectMaterialVisibleLean;
    deletedByUserId: string;
    deletedByRole: ProjectMaterialDeletedByRole;
    deleteReason?: string;
  }): Promise<DeleteProjectMaterialResult> {
    try {
      await this.storageService.deleteObject(input.material.objectKey);
    } catch {
      throw new InternalServerErrorException(
        'Failed to delete material object',
      );
    }

    const deletionLogId = await this.createMaterialDeletionLog({
      material: input.material,
      deletedByUserId: input.deletedByUserId,
      deletedByRole: input.deletedByRole,
      deleteReason: input.deleteReason ?? '',
    });

    // Storage deletion cannot join the DB transaction boundary; a later DB
    // failure leaves an operational recovery case rather than a soft-delete.
    await this.materialModel.deleteOne({ _id: input.material._id }).exec();

    return { deleted: true, alreadyDeleted: false, deletionLogId };
  }

  private async createMaterialDeletionLog(input: {
    material: ProjectMaterialVisibleLean;
    deletedByUserId: string;
    deletedByRole: ProjectMaterialDeletedByRole;
    deleteReason: string;
  }): Promise<string> {
    const deletionLog = await this.deletionLogModel.create({
      projectId: input.material.projectId,
      materialId: input.material._id,
      materialTypeId: input.material.materialTypeId,
      uploadedByUserId: input.material.uploadedByUserId,
      deletedByUserId: toObjectId(input.deletedByUserId, 'userId'),
      deletedByRole: input.deletedByRole,
      deleteReason: input.deleteReason,
      originalFilename: input.material.originalFilename,
      safeFilename: input.material.safeFilename,
      objectKey: input.material.objectKey,
      bucket: input.material.bucket,
      storageDriver: input.material.storageDriver,
      mimeType: input.material.mimeType,
      extension: input.material.extension,
      sizeBytes: input.material.sizeBytes,
      sha256: input.material.sha256,
      remark: input.material.remark,
      materialStatusBeforeDelete: input.material.status,
      submittedAt: input.material.submittedAt ?? null,
      submittedByUserId: input.material.submittedByUserId ?? null,
      storageDeleteSucceeded: true,
      storageDeleteError: null,
      deletedAt: new Date(),
    });
    const deletionLogObject = deletionLog.toObject<{ _id: Types.ObjectId }>();

    return deletionLogObject._id.toString();
  }

  private async getMaterialTypeMap(
    materialTypeIds: Types.ObjectId[],
  ): Promise<Record<string, MaterialTypeSummary>> {
    const uniqueIds = [
      ...new Set(materialTypeIds.map((id) => id.toString())),
    ].map((id) => toObjectId(id, 'materialTypeId'));

    if (uniqueIds.length === 0) {
      return {};
    }

    const materialTypes = await this.dictionaryModel
      .find({ _id: { $in: uniqueIds }, dictType: MATERIAL_TYPE_DICT_TYPE })
      .select({ dictType: 1, code: 1, name: 1, sortOrder: 1, isActive: 1 })
      .lean<MaterialTypeLean[]>()
      .exec();

    return Object.fromEntries(
      materialTypes.map((materialType) => [
        materialType._id.toString(),
        this.toMaterialTypeSummary(materialType),
      ]),
    );
  }

  private toProjectPortalResponse(
    project: ProjectLean,
    materialCount: number,
  ): ProjectPortalResponse {
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
      reviewSchemeSnapshot: project.reviewSchemeSnapshot,
      isActive: project.isActive,
      materialCount,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toMaterialResponse(
    material: ProjectMaterialVisibleLean,
    materialTypes: Record<string, MaterialTypeSummary>,
  ): ProjectMaterialResponse {
    return {
      id: material._id.toString(),
      projectId: material.projectId.toString(),
      materialTypeId: material.materialTypeId.toString(),
      materialType: materialTypes[material.materialTypeId.toString()],
      uploadedByUserId: material.uploadedByUserId.toString(),
      originalFilename: material.originalFilename,
      safeFilename: material.safeFilename,
      objectKey: material.objectKey,
      bucket: material.bucket,
      storageDriver: material.storageDriver,
      mimeType: material.mimeType,
      extension: material.extension,
      sizeBytes: material.sizeBytes,
      sha256: material.sha256,
      remark: material.remark,
      status: material.status,
      submittedAt: material.submittedAt,
      submittedByUserId: material.submittedByUserId?.toString() ?? null,
      deletedAt: material.deletedAt,
      deletedByUserId: material.deletedByUserId?.toString() ?? null,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
    };
  }

  private toMaterialTypeSummary(
    materialType: MaterialTypeLean,
  ): MaterialTypeSummary {
    return {
      id: materialType._id.toString(),
      code: materialType.code,
      name: materialType.name,
      sortOrder: materialType.sortOrder,
    };
  }
}

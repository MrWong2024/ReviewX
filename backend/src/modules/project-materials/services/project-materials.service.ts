import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
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
  ProjectMaterialStatus,
} from '../constants/project-material.constants';
import { QueryExpertProjectsDto } from '../dto/query-expert-projects.dto';
import { QueryProjectMaterialsDto } from '../dto/query-project-materials.dto';
import { QueryProjectOwnerProjectsDto } from '../dto/query-project-owner-projects.dto';
import { UpdateFollowUpNeedsDto } from '../dto/update-follow-up-needs.dto';
import { UploadProjectMaterialsDto } from '../dto/upload-project-materials.dto';
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
  storageDriver: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sha256?: string;
  remark?: string;
  status: ProjectMaterialStatus;
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
  alreadyDeleted: boolean;
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
  storageDriver: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sha256?: string;
  remark?: string;
  status: ProjectMaterialStatus;
  deletedAt?: Date | null;
  deletedByUserId?: Types.ObjectId | null;
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

@Injectable()
export class ProjectMaterialsService {
  constructor(
    @InjectModel(ProjectMaterial.name)
    private readonly materialModel: Model<ProjectMaterial>,
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

    return this.paginateProjects(filter, query);
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
      await this.countActiveMaterials(project._id),
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
      await this.countActiveMaterials(updated._id),
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

    return this.paginateProjects(filter, query);
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
      await this.countActiveMaterials(project._id),
    );
  }

  async listOwnerMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMaterialResponse[]> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    return this.listActiveMaterials(projectId, query);
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
    return this.getMaterialSignedUrl(projectId, materialId);
  }

  async softDeleteOwnerMaterial(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ): Promise<DeleteProjectMaterialResult> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    const material = await this.findMaterialByProject(projectId, materialId);

    if (material.status === 'deleted') {
      return { deleted: false, alreadyDeleted: true };
    }

    await this.materialModel
      .updateOne(
        { _id: material._id },
        {
          $set: {
            status: 'deleted',
            deletedAt: new Date(),
            deletedByUserId: toObjectId(currentUser.user.id, 'userId'),
          },
        },
      )
      .exec();

    return { deleted: true, alreadyDeleted: false };
  }

  async listReviewManagerMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMaterialResponse[]> {
    await this.assertReviewManagerAccess(projectId, currentUser);
    return this.listActiveMaterials(projectId, query);
  }

  async getReviewManagerMaterialDownloadUrl(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertReviewManagerAccess(projectId, currentUser);
    return this.getMaterialSignedUrl(projectId, materialId);
  }

  async listExpertMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectMaterialResponse[]> {
    await this.assertExpertAssignedAccess(projectId, currentUser.user.id);
    return this.listActiveMaterials(projectId, query);
  }

  async getExpertMaterialDownloadUrl(
    projectId: string,
    materialId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertExpertAssignedAccess(projectId, currentUser.user.id);
    return this.getMaterialSignedUrl(projectId, materialId);
  }

  async listAdminMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
  ): Promise<ProjectMaterialResponse[]> {
    await this.findActiveProject(projectId);
    return this.listActiveMaterials(projectId, query);
  }

  async getAdminMaterialDownloadUrl(projectId: string, materialId: string) {
    await this.findActiveProject(projectId);
    return this.getMaterialSignedUrl(projectId, materialId);
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
        status: 'active',
      });

      return this.toMaterialResponse(material.toObject<ProjectMaterialLean>(), {
        [input.materialType._id.toString()]: this.toMaterialTypeSummary(
          input.materialType,
        ),
      });
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

  private async getMaterialSignedUrl(projectId: string, materialId: string) {
    const material = await this.findActiveMaterialByProject(
      projectId,
      materialId,
    );
    return this.storageService.getSignedUrl(material.objectKey, {
      expiresInSeconds: DEFAULT_SIGNED_URL_EXPIRES_SECONDS,
    });
  }

  private async listActiveMaterials(
    projectId: string,
    query: QueryProjectMaterialsDto,
  ): Promise<ProjectMaterialResponse[]> {
    const filter: Record<string, unknown> = {
      projectId: toObjectId(projectId, 'projectId'),
      status: 'active',
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
      .lean<ProjectMaterialLean[]>()
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
    const counts = await this.countActiveMaterialsByProject(
      items.map((item) => item._id),
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

  private async findActiveMaterialByProject(
    projectId: string,
    materialId: string,
  ): Promise<ProjectMaterialLean> {
    const material = await this.materialModel
      .findOne({
        _id: toObjectId(materialId, 'materialId'),
        projectId: toObjectId(projectId, 'projectId'),
        status: 'active',
      })
      .lean<ProjectMaterialLean | null>()
      .exec();

    if (!material) {
      throw new NotFoundException('Project material not found');
    }

    return material;
  }

  private async findMaterialByProject(
    projectId: string,
    materialId: string,
  ): Promise<ProjectMaterialLean> {
    const material = await this.materialModel
      .findOne({
        _id: toObjectId(materialId, 'materialId'),
        projectId: toObjectId(projectId, 'projectId'),
      })
      .lean<ProjectMaterialLean | null>()
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

  private async countActiveMaterials(
    projectId: Types.ObjectId,
  ): Promise<number> {
    return this.materialModel
      .countDocuments({ projectId, status: 'active' })
      .exec();
  }

  private async countActiveMaterialsByProject(
    projectIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    await Promise.all(
      projectIds.map(async (projectId) => {
        counts.set(
          projectId.toString(),
          await this.countActiveMaterials(projectId),
        );
      }),
    );

    return counts;
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
    material: ProjectMaterialLean,
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

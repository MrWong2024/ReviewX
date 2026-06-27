import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { TimestampFields, toObjectId } from '../../../common/utils/mongo-query';
import { normalizeUploadedFilename } from '../../../common/utils/uploaded-filename.util';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ConsensusReview } from '../../consensus-reviews/schemas/consensus-review.schema';
import { REVIEW_LEVEL_DICT_TYPE } from '../../consensus-reviews/constants/consensus-review.constants';
import { Dictionary } from '../../dictionaries/schemas/dictionary.schema';
import {
  ALLOWED_PROJECT_MATERIAL_EXTENSIONS,
  BLOCKED_PROJECT_MATERIAL_EXTENSIONS,
  PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES,
  PROJECT_MATERIAL_MAX_FILES,
} from '../../project-materials/constants/project-material.constants';
import { Project } from '../../projects/schemas/project.schema';
import {
  DEFAULT_SIGNED_URL_EXPIRES_SECONDS,
  STORAGE_SERVICE,
} from '../../storage/storage.constants';
import { StorageConfigService } from '../../storage/storage-config.service';
import type { StorageService } from '../../storage/storage.interface';
import { User } from '../../users/schemas/user.schema';
import {
  buildAppealObjectKey,
  getLowercaseExtension,
  sanitizeFilename,
} from '../../storage/utils/object-key.util';
import {
  PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED_CODE,
  PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED_MESSAGE,
  PROJECT_APPEAL_MAX_COUNT,
  PROJECT_APPEAL_PENDING_STATUSES,
  ProjectAppealAttachmentStatus,
  ProjectAppealStatus,
  ProjectLevelChangeSource,
} from '../constants/project-appeal.constants';
import { CreateProjectAppealDto } from '../dto/create-project-appeal.dto';
import { HandleProjectAppealDto } from '../dto/handle-project-appeal.dto';
import { UploadProjectAppealAttachmentsDto } from '../dto/upload-project-appeal-attachments.dto';
import { ProjectAppealAttachment } from '../schemas/project-appeal-attachment.schema';
import { ProjectAppeal } from '../schemas/project-appeal.schema';
import { ProjectLevelChangeLog } from '../schemas/project-level-change-log.schema';

export type UploadedProjectAppealFile = {
  originalname: string;
  size: number;
  buffer: Buffer;
  mimetype?: string;
};

export type ProjectOwnerConsensusResponse = {
  id: string;
  projectId: string;
  finalOpinion?: string;
  finalScore?: number | null;
  finalLevel?: string;
  confirmedByUserId?: string | null;
  confirmedByUser?: ProjectAppealUserSummary | null;
  confirmedAt?: Date | null;
  expertReviewStats: {
    expertCount: number;
    submittedCount: number;
    averageScore?: number | null;
    minScore?: number | null;
    maxScore?: number | null;
  };
};

export type ProjectAppealUserSummary = {
  id: string;
  name: string;
  phone?: string | null;
};

export type ProjectAppealResponse = {
  id: string;
  projectId: string;
  appealNo: number;
  submittedByUserId: string;
  reason: string;
  reasonSummary: string;
  status: ProjectAppealStatus;
  relatedConsensusReviewId?: string | null;
  levelBeforeAppeal: string;
  levelAfterHandling?: string;
  handledByUserId?: string | null;
  handlingOpinion?: string;
  handledAt?: Date | null;
  causedLevelChange: boolean;
  attachmentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectAppealDetailResponse = ProjectAppealResponse & {
  consensus?: ProjectOwnerConsensusResponse | null;
};

export type ProjectAppealAttachmentResponse = {
  id: string;
  appealId: string;
  projectId: string;
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
  status: ProjectAppealAttachmentStatus;
  deletedAt?: Date | null;
  deletedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectAppealAttachmentUploadResult = {
  attachments: ProjectAppealAttachmentResponse[];
  successCount: number;
  failedCount: number;
  failures: {
    originalFilename: string;
    message: string;
  }[];
};

export type DeleteProjectAppealAttachmentResult = {
  deleted: boolean;
  alreadyDeleted: boolean;
};

export type ProjectLevelChangeLogResponse = {
  id: string;
  projectId: string;
  appealId?: string | null;
  consensusReviewId?: string | null;
  fromLevel: string;
  toLevel: string;
  reason?: string;
  changedByUserId: string;
  changedByUser?: ProjectAppealUserSummary | null;
  changedAt: Date;
  source: ProjectLevelChangeSource;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectLean = TimestampFields & {
  _id: Types.ObjectId;
  ownerUserId?: Types.ObjectId | null;
  reviewManagerId?: Types.ObjectId | null;
  finalLevel?: string;
  originalLevel?: string;
  isActive: boolean;
};

type ConsensusReviewLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  finalOpinion?: string;
  finalScore?: number | null;
  finalLevel?: string;
  confirmedByUserId?: Types.ObjectId | string | null;
  confirmedAt?: Date | null;
  status: string;
  expertReviewStats: {
    expertCount: number;
    submittedCount: number;
    averageScore?: number | null;
    minScore?: number | null;
    maxScore?: number | null;
  };
};

type UserSummaryLean = {
  _id: Types.ObjectId;
  name: string;
  phone?: string | null;
};

type ProjectAppealLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  appealNo: number;
  submittedByUserId: Types.ObjectId;
  reason: string;
  status: ProjectAppealStatus;
  relatedConsensusReviewId?: Types.ObjectId | null;
  levelBeforeAppeal: string;
  levelAfterHandling?: string;
  handledByUserId?: Types.ObjectId | null;
  handlingOpinion?: string;
  handledAt?: Date | null;
  causedLevelChange: boolean;
};

type ProjectAppealAttachmentLean = TimestampFields & {
  _id: Types.ObjectId;
  appealId: Types.ObjectId;
  projectId: Types.ObjectId;
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
  status: ProjectAppealAttachmentStatus;
  deletedAt?: Date | null;
  deletedByUserId?: Types.ObjectId | null;
};

type ProjectLevelChangeLogLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  appealId?: Types.ObjectId | null;
  consensusReviewId?: Types.ObjectId | null;
  fromLevel: string;
  toLevel: string;
  reason?: string;
  changedByUserId: Types.ObjectId;
  changedAt: Date;
  source: ProjectLevelChangeSource;
};

type DictionaryLean = {
  code: string;
  name: string;
};

type ValidatedFile = {
  file: UploadedProjectAppealFile;
  originalFilename: string;
  safeFilename: string;
  extension: string;
  mimeType: string;
  sha256: string;
};

@Injectable()
export class ProjectAppealsService {
  constructor(
    @InjectModel(ProjectAppeal.name)
    private readonly appealModel: Model<ProjectAppeal>,
    @InjectModel(ProjectAppealAttachment.name)
    private readonly attachmentModel: Model<ProjectAppealAttachment>,
    @InjectModel(ProjectLevelChangeLog.name)
    private readonly levelChangeLogModel: Model<ProjectLevelChangeLog>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(ConsensusReview.name)
    private readonly consensusReviewModel: Model<ConsensusReview>,
    @InjectModel(Dictionary.name)
    private readonly dictionaryModel: Model<Dictionary>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    private readonly storageConfigService: StorageConfigService,
  ) {}

  async getOwnerConfirmedConsensus(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectOwnerConsensusResponse> {
    const project = await this.assertProjectOwnerAccess(
      projectId,
      currentUser.user.id,
    );
    const consensus = await this.findConfirmedConsensus(project._id);

    if (!consensus) {
      throw new NotFoundException('Confirmed consensus review not found');
    }

    return this.toConsensusResponse(consensus);
  }

  async listOwnerLevelHistory(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectLevelChangeLogResponse[]> {
    const project = await this.assertProjectOwnerAccess(
      projectId,
      currentUser.user.id,
    );
    return this.listLevelHistoryByProject(project._id);
  }

  async listAdminLevelHistory(
    projectId: string,
  ): Promise<ProjectLevelChangeLogResponse[]> {
    const project = await this.findActiveProject(projectId);
    return this.listLevelHistoryByProject(project._id);
  }

  async listOwnerAppeals(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealResponse[]> {
    const project = await this.assertProjectOwnerAccess(
      projectId,
      currentUser.user.id,
    );
    const appeals = await this.appealModel
      .find({
        projectId: project._id,
        submittedByUserId: toObjectId(currentUser.user.id, 'userId'),
      })
      .sort({ appealNo: 1, createdAt: 1 })
      .lean<ProjectAppealLean[]>()
      .exec();
    const counts = await this.countActiveAttachmentsByAppeal(
      appeals.map((appeal) => appeal._id),
    );

    return appeals.map((appeal) =>
      this.toAppealResponse(appeal, counts.get(appeal._id.toString()) ?? 0),
    );
  }

  async getOwnerAppeal(
    projectId: string,
    appealId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealDetailResponse> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    const appeal = await this.findOwnerAppeal(
      projectId,
      appealId,
      currentUser.user.id,
    );
    const attachmentCount = await this.countActiveAttachments(appeal._id);

    return this.toAppealResponse(appeal, attachmentCount);
  }

  async createOwnerAppeal(input: {
    projectId: string;
    dto: CreateProjectAppealDto;
    files: UploadedProjectAppealFile[] | undefined;
    currentUser: AuthenticatedUser;
  }): Promise<ProjectAppealResponse> {
    const project = await this.assertProjectOwnerAccess(
      input.projectId,
      input.currentUser.user.id,
    );
    const confirmedConsensus = await this.findConfirmedConsensus(project._id);

    if (!confirmedConsensus) {
      throw new ConflictException('Confirmed consensus review is required');
    }

    const effectiveFinalLevel = this.getEffectiveFinalLevel(
      project,
      confirmedConsensus,
    );

    if (!effectiveFinalLevel) {
      throw new ConflictException('Project finalLevel is required');
    }

    const existingAppealCount = await this.appealModel
      .countDocuments({ projectId: project._id })
      .exec();

    if (existingAppealCount >= PROJECT_APPEAL_MAX_COUNT) {
      throw new ConflictException('Project appeal limit exceeded');
    }

    const pendingAppeal = await this.appealModel
      .exists({
        projectId: project._id,
        status: { $in: PROJECT_APPEAL_PENDING_STATUSES },
      })
      .exec();

    if (pendingAppeal) {
      throw new ConflictException('Project has an unhandled appeal');
    }

    const files = input.files ?? [];
    this.assertFileCount(files);
    const validatedFiles = files.map((file) => this.validateFile(file));
    await this.ensureProjectFinalLevel(project, effectiveFinalLevel);
    const appeal = await this.appealModel
      .create({
        projectId: project._id,
        appealNo: existingAppealCount + 1,
        submittedByUserId: toObjectId(input.currentUser.user.id, 'userId'),
        reason: input.dto.reason,
        status: 'submitted',
        relatedConsensusReviewId: confirmedConsensus._id,
        levelBeforeAppeal: effectiveFinalLevel,
        causedLevelChange: false,
      })
      .then((created) => created.toObject<ProjectAppealLean>());

    for (const validatedFile of validatedFiles) {
      await this.uploadAndPersistAttachment({
        project,
        appeal,
        uploadedByUserId: input.currentUser.user.id,
        remark: '',
        validatedFile,
      });
    }

    return this.toAppealResponse(appeal, validatedFiles.length);
  }

  async uploadOwnerAppealAttachments(input: {
    projectId: string;
    appealId: string;
    dto: UploadProjectAppealAttachmentsDto;
    files: UploadedProjectAppealFile[] | undefined;
    currentUser: AuthenticatedUser;
  }): Promise<ProjectAppealAttachmentUploadResult> {
    const project = await this.assertProjectOwnerAccess(
      input.projectId,
      input.currentUser.user.id,
    );
    const appeal = await this.findOwnerAppeal(
      input.projectId,
      input.appealId,
      input.currentUser.user.id,
    );
    this.assertAppealCanMutateAttachments(appeal);
    return this.uploadAttachments({
      project,
      appeal,
      uploadedByUserId: input.currentUser.user.id,
      remark: input.dto.remark ?? '',
      files: input.files,
    });
  }

  async listOwnerAppealAttachments(
    projectId: string,
    appealId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealAttachmentResponse[]> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    const appeal = await this.findOwnerAppeal(
      projectId,
      appealId,
      currentUser.user.id,
    );
    return this.listActiveAttachments(appeal.projectId, appeal._id);
  }

  async getOwnerAppealAttachmentDownloadUrl(
    projectId: string,
    appealId: string,
    attachmentId: string,
    currentUser: AuthenticatedUser,
  ) {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    const appeal = await this.findOwnerAppeal(
      projectId,
      appealId,
      currentUser.user.id,
    );
    return this.getAttachmentSignedUrl(
      appeal.projectId.toString(),
      appeal._id.toString(),
      attachmentId,
    );
  }

  async softDeleteOwnerAppealAttachment(
    projectId: string,
    appealId: string,
    attachmentId: string,
    currentUser: AuthenticatedUser,
  ): Promise<DeleteProjectAppealAttachmentResult> {
    await this.assertProjectOwnerAccess(projectId, currentUser.user.id);
    await this.findOwnerAppeal(projectId, appealId, currentUser.user.id);
    void attachmentId;

    throw new ConflictException({
      message: PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED_MESSAGE,
      code: PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED_CODE,
    });
  }

  async listReviewManagerAppeals(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealResponse[]> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    return this.listAppealsByProject(project._id);
  }

  async getReviewManagerAppeal(
    projectId: string,
    appealId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealDetailResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    const appeal = await this.findAppealByProject(project._id, appealId);
    return this.toAppealDetailResponse(appeal);
  }

  async listReviewManagerAppealAttachments(
    projectId: string,
    appealId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealAttachmentResponse[]> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    const appeal = await this.findAppealByProject(project._id, appealId);
    return this.listActiveAttachments(appeal.projectId, appeal._id);
  }

  async getReviewManagerAppealAttachmentDownloadUrl(
    projectId: string,
    appealId: string,
    attachmentId: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    const appeal = await this.findAppealByProject(project._id, appealId);
    return this.getAttachmentSignedUrl(
      appeal.projectId.toString(),
      appeal._id.toString(),
      attachmentId,
    );
  }

  async handleReviewManagerAppeal(
    projectId: string,
    appealId: string,
    dto: HandleProjectAppealDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealDetailResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    return this.handleAppeal(project, appealId, dto, currentUser);
  }

  async listAdminAppeals(projectId: string): Promise<ProjectAppealResponse[]> {
    const project = await this.findActiveProject(projectId);
    return this.listAppealsByProject(project._id);
  }

  async getAdminAppeal(
    projectId: string,
    appealId: string,
  ): Promise<ProjectAppealDetailResponse> {
    const project = await this.findActiveProject(projectId);
    const appeal = await this.findAppealByProject(project._id, appealId);
    return this.toAppealDetailResponse(appeal);
  }

  async listAdminAppealAttachments(
    projectId: string,
    appealId: string,
  ): Promise<ProjectAppealAttachmentResponse[]> {
    const project = await this.findActiveProject(projectId);
    const appeal = await this.findAppealByProject(project._id, appealId);
    return this.listActiveAttachments(appeal.projectId, appeal._id);
  }

  async getAdminAppealAttachmentDownloadUrl(
    projectId: string,
    appealId: string,
    attachmentId: string,
  ) {
    const project = await this.findActiveProject(projectId);
    const appeal = await this.findAppealByProject(project._id, appealId);
    return this.getAttachmentSignedUrl(
      appeal.projectId.toString(),
      appeal._id.toString(),
      attachmentId,
    );
  }

  async handleAdminAppeal(
    projectId: string,
    appealId: string,
    dto: HandleProjectAppealDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealDetailResponse> {
    const project = await this.findActiveProject(projectId);
    return this.handleAppeal(project, appealId, dto, currentUser);
  }

  private async handleAppeal(
    project: ProjectLean,
    appealId: string,
    dto: HandleProjectAppealDto,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectAppealDetailResponse> {
    const appeal = await this.findAppealByProject(project._id, appealId);

    if (!PROJECT_APPEAL_PENDING_STATUSES.includes(appeal.status)) {
      throw new ConflictException('Appeal has already been handled');
    }

    const currentLevel = await this.resolveCurrentFinalLevel(project, appeal);

    if (!currentLevel) {
      throw new ConflictException('Project finalLevel is required');
    }

    await this.ensureProjectFinalLevel(project, currentLevel);

    const handledAt = new Date();
    let levelAfterHandling = currentLevel;
    let causedLevelChange = false;

    if (dto.decision === 'accepted' && dto.newFinalLevel) {
      const nextLevel = await this.normalizeFinalLevel(dto.newFinalLevel);
      levelAfterHandling = nextLevel;
      causedLevelChange = nextLevel !== currentLevel;

      if (causedLevelChange) {
        const projectUpdate: Record<string, unknown> = {
          finalLevel: nextLevel,
        };

        if (!project.originalLevel) {
          projectUpdate.originalLevel = currentLevel;
        }

        await this.projectModel
          .updateOne({ _id: project._id }, { $set: projectUpdate })
          .exec();
        await this.levelChangeLogModel.create({
          projectId: project._id,
          appealId: appeal._id,
          consensusReviewId: appeal.relatedConsensusReviewId ?? null,
          fromLevel: currentLevel,
          toLevel: nextLevel,
          reason: dto.handlingOpinion,
          changedByUserId: toObjectId(currentUser.user.id, 'userId'),
          changedAt: handledAt,
          source: 'appeal_handling',
        });
      }
    }

    const updated = await this.appealModel
      .findByIdAndUpdate(
        appeal._id,
        {
          $set: {
            status: dto.decision,
            handledByUserId: toObjectId(currentUser.user.id, 'userId'),
            handlingOpinion: dto.handlingOpinion,
            handledAt,
            levelAfterHandling,
            causedLevelChange,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<ProjectAppealLean | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException('Appeal not found');
    }

    return this.toAppealDetailResponse(updated);
  }

  private async uploadAttachments(input: {
    project: ProjectLean;
    appeal: ProjectAppealLean;
    uploadedByUserId: string;
    remark: string;
    files: UploadedProjectAppealFile[] | undefined;
  }): Promise<ProjectAppealAttachmentUploadResult> {
    const files = input.files ?? [];

    if (files.length === 0) {
      throw new BadRequestException('files are required');
    }

    this.assertFileCount(files);

    const failures: ProjectAppealAttachmentUploadResult['failures'] = [];
    const attachments: ProjectAppealAttachmentResponse[] = [];
    const isSingleFile = files.length === 1;

    for (const file of files) {
      try {
        const validatedFile = this.validateFile(file);
        const attachment = await this.uploadAndPersistAttachment({
          project: input.project,
          appeal: input.appeal,
          uploadedByUserId: input.uploadedByUserId,
          remark: input.remark,
          validatedFile,
        });
        attachments.push(attachment);
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

    if (attachments.length === 0 && failures.length > 0) {
      throw new BadRequestException({
        message: 'No files were uploaded',
        failures,
      });
    }

    return {
      attachments,
      successCount: attachments.length,
      failedCount: failures.length,
      failures,
    };
  }

  private async uploadAndPersistAttachment(input: {
    project: ProjectLean;
    appeal: ProjectAppealLean;
    uploadedByUserId: string;
    remark: string;
    validatedFile: ValidatedFile;
  }): Promise<ProjectAppealAttachmentResponse> {
    const objectKey = buildAppealObjectKey({
      objectPrefix: this.storageConfigService.getObjectPrefix(),
      projectId: input.project._id.toString(),
      appealId: input.appeal._id.toString(),
      safeFilename: input.validatedFile.safeFilename,
    });

    const uploaded = await this.storageService
      .uploadFile({
        objectKey,
        buffer: input.validatedFile.file.buffer,
        sizeBytes: input.validatedFile.file.size,
        mimeType: input.validatedFile.mimeType,
      })
      .catch((error: unknown) => {
        if (error instanceof HttpException) {
          throw error;
        }

        throw new ServiceUnavailableException('Storage upload failed');
      });

    try {
      const attachment = await this.attachmentModel.create({
        appealId: input.appeal._id,
        projectId: input.project._id,
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

      return this.toAttachmentResponse(
        attachment.toObject<ProjectAppealAttachmentLean>(),
      );
    } catch (error) {
      await this.storageService.deleteObject(uploaded.objectKey);
      throw error;
    }
  }

  private assertFileCount(files: UploadedProjectAppealFile[]): void {
    if (files.length > PROJECT_MATERIAL_MAX_FILES) {
      throw new BadRequestException(
        `At most ${PROJECT_MATERIAL_MAX_FILES} files can be uploaded at once`,
      );
    }
  }

  private validateFile(file: UploadedProjectAppealFile): ValidatedFile {
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

  private async normalizeFinalLevel(finalLevel: string): Promise<string> {
    const levels = await this.dictionaryModel
      .find({ dictType: REVIEW_LEVEL_DICT_TYPE, isActive: true })
      .select({ code: 1, name: 1 })
      .lean<DictionaryLean[]>()
      .exec();

    if (levels.length === 0) {
      if (!['A', 'B', 'C', 'D'].includes(finalLevel)) {
        throw new BadRequestException('finalLevel must be A, B, C, or D');
      }

      return finalLevel;
    }

    const matched = levels.find(
      (level) => level.code === finalLevel || level.name === finalLevel,
    );

    if (!matched) {
      throw new BadRequestException('finalLevel is not a valid review_level');
    }

    return finalLevel;
  }

  private getEffectiveFinalLevel(
    project: ProjectLean,
    confirmedConsensus: ConsensusReviewLean | null,
  ): string | null {
    return (
      normalizeNonEmptyString(project.finalLevel) ??
      normalizeNonEmptyString(confirmedConsensus?.finalLevel) ??
      null
    );
  }

  private async resolveCurrentFinalLevel(
    project: ProjectLean,
    appeal: ProjectAppealLean,
  ): Promise<string | null> {
    const projectLevel = normalizeNonEmptyString(project.finalLevel);

    if (projectLevel) {
      return projectLevel;
    }

    const consensus = await this.findConfirmedConsensusForAppeal(
      project._id,
      appeal.relatedConsensusReviewId,
    );
    const consensusLevel = normalizeNonEmptyString(consensus?.finalLevel);

    if (consensusLevel) {
      return consensusLevel;
    }

    return normalizeNonEmptyString(appeal.levelBeforeAppeal);
  }

  private async ensureProjectFinalLevel(
    project: ProjectLean,
    finalLevel: string,
  ): Promise<void> {
    if (normalizeNonEmptyString(project.finalLevel)) {
      return;
    }

    const normalizedFinalLevel = normalizeNonEmptyString(finalLevel);

    if (!normalizedFinalLevel) {
      return;
    }

    const projectUpdate: Record<string, unknown> = {
      finalLevel: normalizedFinalLevel,
    };

    if (!normalizeNonEmptyString(project.originalLevel)) {
      projectUpdate.originalLevel = normalizedFinalLevel;
      project.originalLevel = normalizedFinalLevel;
    }

    await this.projectModel
      .updateOne({ _id: project._id }, { $set: projectUpdate })
      .exec();

    project.finalLevel = normalizedFinalLevel;
  }

  private async listAppealsByProject(
    projectId: Types.ObjectId,
  ): Promise<ProjectAppealResponse[]> {
    const appeals = await this.appealModel
      .find({ projectId })
      .sort({ appealNo: 1, createdAt: 1 })
      .lean<ProjectAppealLean[]>()
      .exec();
    const counts = await this.countActiveAttachmentsByAppeal(
      appeals.map((appeal) => appeal._id),
    );

    return appeals.map((appeal) =>
      this.toAppealResponse(appeal, counts.get(appeal._id.toString()) ?? 0),
    );
  }

  private async listLevelHistoryByProject(
    projectId: Types.ObjectId,
  ): Promise<ProjectLevelChangeLogResponse[]> {
    const logs = await this.levelChangeLogModel
      .find({ projectId })
      .sort({ changedAt: 1, createdAt: 1 })
      .lean<ProjectLevelChangeLogLean[]>()
      .exec();
    const changedByUserMap = await this.getUserSummaryMap(
      logs.map((log) => log.changedByUserId),
    );

    return logs.map((log) =>
      this.toLevelChangeLogResponse(
        log,
        changedByUserMap.get(log.changedByUserId.toString()) ?? null,
      ),
    );
  }

  private async listActiveAttachments(
    projectId: Types.ObjectId,
    appealId: Types.ObjectId,
  ): Promise<ProjectAppealAttachmentResponse[]> {
    const attachments = await this.attachmentModel
      .find({ projectId, appealId, status: 'active' })
      .sort({ createdAt: -1 })
      .lean<ProjectAppealAttachmentLean[]>()
      .exec();

    return attachments.map((attachment) =>
      this.toAttachmentResponse(attachment),
    );
  }

  private async getAttachmentSignedUrl(
    projectId: string,
    appealId: string,
    attachmentId: string,
  ) {
    const attachment = await this.findActiveAttachmentByAppeal(
      projectId,
      appealId,
      attachmentId,
    );

    return this.storageService.getSignedUrl(attachment.objectKey, {
      expiresInSeconds: DEFAULT_SIGNED_URL_EXPIRES_SECONDS,
    });
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

    if (
      !currentUser.user.roles.includes('review_manager') ||
      project.reviewManagerId?.toString() !== currentUser.user.id
    ) {
      throw new ForbiddenException();
    }

    return project;
  }

  private async findActiveProject(projectId: string): Promise<ProjectLean> {
    const project = await this.projectModel
      .findOne({ _id: toObjectId(projectId, 'projectId'), isActive: true })
      .lean<ProjectLean | null>()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async findConfirmedConsensus(
    projectId: Types.ObjectId,
  ): Promise<ConsensusReviewLean | null> {
    return this.consensusReviewModel
      .findOne({ projectId, status: 'confirmed' })
      .lean<ConsensusReviewLean | null>()
      .exec();
  }

  private async findConfirmedConsensusForAppeal(
    projectId: Types.ObjectId,
    consensusReviewId?: Types.ObjectId | null,
  ): Promise<ConsensusReviewLean | null> {
    if (consensusReviewId) {
      const relatedConsensus = await this.consensusReviewModel
        .findOne({
          _id: consensusReviewId,
          projectId,
          status: 'confirmed',
        })
        .lean<ConsensusReviewLean | null>()
        .exec();

      if (relatedConsensus) {
        return relatedConsensus;
      }
    }

    return this.findConfirmedConsensus(projectId);
  }

  private async findOwnerAppeal(
    projectId: string,
    appealId: string,
    userId: string,
  ): Promise<ProjectAppealLean> {
    const appeal = await this.appealModel
      .findOne({
        _id: toObjectId(appealId, 'appealId'),
        projectId: toObjectId(projectId, 'projectId'),
        submittedByUserId: toObjectId(userId, 'userId'),
      })
      .lean<ProjectAppealLean | null>()
      .exec();

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    return appeal;
  }

  private async findAppealByProject(
    projectId: Types.ObjectId,
    appealId: string,
  ): Promise<ProjectAppealLean> {
    const appeal = await this.appealModel
      .findOne({ _id: toObjectId(appealId, 'appealId'), projectId })
      .lean<ProjectAppealLean | null>()
      .exec();

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    return appeal;
  }

  private async findActiveAttachmentByAppeal(
    projectId: string,
    appealId: string,
    attachmentId: string,
  ): Promise<ProjectAppealAttachmentLean> {
    const attachment = await this.attachmentModel
      .findOne({
        _id: toObjectId(attachmentId, 'attachmentId'),
        appealId: toObjectId(appealId, 'appealId'),
        projectId: toObjectId(projectId, 'projectId'),
        status: 'active',
      })
      .lean<ProjectAppealAttachmentLean | null>()
      .exec();

    if (!attachment) {
      throw new NotFoundException('Appeal attachment not found');
    }

    return attachment;
  }

  private assertAppealCanMutateAttachments(appeal: ProjectAppealLean): void {
    if (appeal.status !== 'submitted') {
      throw new ConflictException(
        'Appeal attachments can no longer be changed',
      );
    }
  }

  private async countActiveAttachments(
    appealId: Types.ObjectId,
  ): Promise<number> {
    return this.attachmentModel
      .countDocuments({ appealId, status: 'active' })
      .exec();
  }

  private async countActiveAttachmentsByAppeal(
    appealIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    await Promise.all(
      appealIds.map(async (appealId) => {
        counts.set(
          appealId.toString(),
          await this.countActiveAttachments(appealId),
        );
      }),
    );

    return counts;
  }

  private async toAppealDetailResponse(
    appeal: ProjectAppealLean,
  ): Promise<ProjectAppealDetailResponse> {
    const attachmentCount = await this.countActiveAttachments(appeal._id);
    const response = this.toAppealResponse(appeal, attachmentCount);
    const consensus = appeal.relatedConsensusReviewId
      ? await this.consensusReviewModel
          .findById(appeal.relatedConsensusReviewId)
          .lean<ConsensusReviewLean | null>()
          .exec()
      : null;

    return {
      ...response,
      consensus:
        consensus && consensus.status === 'confirmed'
          ? await this.toConsensusResponse(consensus)
          : null,
    };
  }

  private async toConsensusResponse(
    consensus: ConsensusReviewLean,
  ): Promise<ProjectOwnerConsensusResponse> {
    const confirmedByUser = await this.getConfirmedByUserSummary(
      consensus.confirmedByUserId,
    );

    return {
      id: consensus._id.toString(),
      projectId: consensus.projectId.toString(),
      finalOpinion: consensus.finalOpinion,
      finalScore: consensus.finalScore ?? null,
      finalLevel: consensus.finalLevel,
      confirmedByUserId: consensus.confirmedByUserId?.toString() ?? null,
      confirmedByUser,
      confirmedAt: consensus.confirmedAt ?? null,
      expertReviewStats: consensus.expertReviewStats,
    };
  }

  private async getConfirmedByUserSummary(
    confirmedByUserId?: Types.ObjectId | string | null,
  ): Promise<ProjectAppealUserSummary | null> {
    if (!confirmedByUserId) {
      return null;
    }

    const userId = confirmedByUserId.toString();

    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const user = await this.userModel
      .findById(userId)
      .select({ name: 1, phone: 1 })
      .lean<UserSummaryLean | null>()
      .exec();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone ?? null,
    };
  }

  private async getUserSummaryMap(
    userIds: (Types.ObjectId | string)[],
  ): Promise<Map<string, ProjectAppealUserSummary>> {
    const uniqueIds = [
      ...new Set(
        userIds
          .map((userId) => userId.toString())
          .filter((userId) => Types.ObjectId.isValid(userId)),
      ),
    ].map((userId) => toObjectId(userId, 'userId'));

    if (uniqueIds.length === 0) {
      return new Map();
    }

    const users = await this.userModel
      .find({ _id: { $in: uniqueIds } })
      .select({ name: 1, phone: 1 })
      .lean<UserSummaryLean[]>()
      .exec();

    return new Map(
      users.map((user) => [
        user._id.toString(),
        {
          id: user._id.toString(),
          name: user.name,
          phone: user.phone ?? null,
        },
      ]),
    );
  }

  private toAppealResponse(
    appeal: ProjectAppealLean,
    attachmentCount: number,
  ): ProjectAppealResponse {
    return {
      id: appeal._id.toString(),
      projectId: appeal.projectId.toString(),
      appealNo: appeal.appealNo,
      submittedByUserId: appeal.submittedByUserId.toString(),
      reason: appeal.reason,
      reasonSummary: summarize(appeal.reason, 100),
      status: appeal.status,
      relatedConsensusReviewId:
        appeal.relatedConsensusReviewId?.toString() ?? null,
      levelBeforeAppeal: appeal.levelBeforeAppeal,
      levelAfterHandling: appeal.levelAfterHandling,
      handledByUserId: appeal.handledByUserId?.toString() ?? null,
      handlingOpinion: appeal.handlingOpinion,
      handledAt: appeal.handledAt ?? null,
      causedLevelChange: appeal.causedLevelChange,
      attachmentCount,
      createdAt: appeal.createdAt,
      updatedAt: appeal.updatedAt,
    };
  }

  private toAttachmentResponse(
    attachment: ProjectAppealAttachmentLean,
  ): ProjectAppealAttachmentResponse {
    return {
      id: attachment._id.toString(),
      appealId: attachment.appealId.toString(),
      projectId: attachment.projectId.toString(),
      uploadedByUserId: attachment.uploadedByUserId.toString(),
      originalFilename: attachment.originalFilename,
      safeFilename: attachment.safeFilename,
      objectKey: attachment.objectKey,
      bucket: attachment.bucket,
      storageDriver: attachment.storageDriver,
      mimeType: attachment.mimeType,
      extension: attachment.extension,
      sizeBytes: attachment.sizeBytes,
      sha256: attachment.sha256,
      remark: attachment.remark,
      status: attachment.status,
      deletedAt: attachment.deletedAt,
      deletedByUserId: attachment.deletedByUserId?.toString() ?? null,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }

  private toLevelChangeLogResponse(
    log: ProjectLevelChangeLogLean,
    changedByUser: ProjectAppealUserSummary | null,
  ): ProjectLevelChangeLogResponse {
    return {
      id: log._id.toString(),
      projectId: log.projectId.toString(),
      appealId: log.appealId?.toString() ?? null,
      consensusReviewId: log.consensusReviewId?.toString() ?? null,
      fromLevel: log.fromLevel,
      toLevel: log.toLevel,
      reason: log.reason,
      changedByUserId: log.changedByUserId.toString(),
      changedByUser,
      changedAt: log.changedAt,
      source: log.source,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }
}

function summarize(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function normalizeNonEmptyString(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

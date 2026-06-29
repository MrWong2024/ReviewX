import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponse } from '../../../common/dto/pagination-query.dto';
import {
  escapeRegExp,
  TimestampFields,
  toObjectId,
} from '../../../common/utils/mongo-query';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ConsensusReview } from '../../consensus-reviews/schemas/consensus-review.schema';
import { ProjectExpertAssignment } from '../../project-expert-assignments/schemas/project-expert-assignment.schema';
import { ProjectMaterial } from '../../project-materials/schemas/project-material.schema';
import { Project } from '../../projects/schemas/project.schema';
import { User } from '../../users/schemas/user.schema';
import {
  DEFAULT_SUGGESTION_REQUIRED_THRESHOLD_RATIO,
  EXPERT_REVIEW_DRAFT_NOT_DELETABLE,
  ExpertReviewStatus,
  ExpertReviewViewStatus,
  PROJECT_REVIEW_SCHEME_INVALID,
  PROJECT_REVIEW_SCHEME_MISSING,
} from '../constants/expert-review.constants';
import { QueryExpertReviewTasksDto } from '../dto/query-expert-review-tasks.dto';
import { ReturnExpertReviewDto } from '../dto/return-expert-review.dto';
import {
  ExpertReviewItemInputDto,
  SaveExpertReviewDto,
} from '../dto/save-expert-review.dto';
import { ExpertReview } from '../schemas/expert-review.schema';

export type ReviewSchemeSnapshotItem = {
  name: string;
  maxScore: number;
  scoringGuide?: string;
  sortOrder: number;
  suggestionRequiredThresholdRatio: number;
};

export type ReviewSchemeSnapshot = {
  id?: string;
  name?: string;
  totalScore: number;
  items: ReviewSchemeSnapshotItem[];
};

export type ExpertReviewItemResponse = {
  itemSnapshot: ReviewSchemeSnapshotItem;
  score?: number | null;
  evaluationDescription: string;
  improvementSuggestion: string;
  hasMajorIssue: boolean;
};

export type ExpertReviewResponse = {
  id: string;
  projectId: string;
  expertUserId: string;
  assignmentId?: string | null;
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  items: ExpertReviewItemResponse[];
  totalScore: number;
  status: ExpertReviewStatus;
  submittedAt?: Date | null;
  returnedAt?: Date | null;
  returnedByUserId?: string | null;
  returnReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ExpertReviewTaskResponse = {
  project: ProjectTaskSummary;
  assignmentId: string;
  materialCount: number;
  status: ExpertReviewViewStatus;
  totalScore?: number | null;
  submittedAt?: Date | null;
  returnedAt?: Date | null;
};

export type ExpertReviewTaskDetailResponse = {
  project: ProjectTaskSummary;
  materialCount: number;
  materials: MaterialSummary[];
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  review: ExpertReviewResponse | ExpertReviewNotStartedResponse;
};

export type ExpertReviewNotStartedResponse = {
  status: 'not_started';
  projectId: string;
  expertUserId: string;
  assignmentId: string;
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  items: ExpertReviewItemResponse[];
  totalScore: number;
};

export type ReviewManagerExpertReviewListItem = {
  expert: ExpertBasicSummary;
  assignmentId?: string | null;
  status: ExpertReviewViewStatus;
  totalScore?: number | null;
  submittedAt?: Date | null;
  returnedAt?: Date | null;
};

export type ReviewSummaryResponse = {
  assignedExpertCount: number;
  submittedExpertCount: number;
  draftExpertCount: number;
  returnedExpertCount: number;
  notStartedExpertCount: number;
  averageScore: number | null;
  minScore: number | null;
  maxScore: number | null;
  perItemAverageScores: PerItemAverageScore[] | null;
};

export type PerItemAverageScore = {
  name: string;
  sortOrder: number;
  maxScore: number;
  averageScore: number | null;
};

export type SubmittedExpertReviewForConsensus = ExpertReviewResponse & {
  expert?: ExpertBasicSummary;
};

type ProjectTaskSummary = {
  id: string;
  batchId: string;
  projectNo: string;
  name: string;
  statusId?: string | null;
  reviewManagerId?: string | null;
  reviewManager?: ReviewManagerSummary | null;
  reviewSchemeId?: string | null;
  reviewTime?: Date | null;
  reviewLocation?: string;
  meetingUrl?: string;
  followUpNeeds?: string;
};

type MaterialSummary = {
  id: string;
  materialTypeId: string;
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  remark?: string;
  createdAt: Date;
};

type ExpertBasicSummary = {
  id: string;
  phone: string;
  name: string;
  organizationIds: string[];
  disciplineIds: string[];
};

type ReviewManagerSummary = {
  id: string;
  name: string;
  phone?: string;
};

type ProjectLean = TimestampFields & {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  projectNo: string;
  name: string;
  statusId?: Types.ObjectId | null;
  reviewManagerId?: Types.ObjectId | null;
  reviewSchemeId?: Types.ObjectId | null;
  reviewTime?: Date | null;
  reviewLocation?: string;
  meetingUrl?: string;
  followUpNeeds?: string;
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  isActive: boolean;
};

type AssignmentLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  expertUserId: Types.ObjectId;
  status: string;
};

type ExpertReviewLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  expertUserId: Types.ObjectId;
  assignmentId?: Types.ObjectId | null;
  reviewSchemeSnapshot: Record<string, unknown>;
  items: ExpertReviewItemResponse[];
  totalScore: number;
  status: ExpertReviewStatus;
  submittedAt?: Date | null;
  returnedAt?: Date | null;
  returnedByUserId?: Types.ObjectId | null;
  returnReason?: string;
};

type MaterialLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  materialTypeId: Types.ObjectId;
  originalFilename: string;
  safeFilename: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  remark?: string;
  status: string;
};

type UserLean = {
  _id: Types.ObjectId;
  phone: string;
  name: string;
  organizationIds?: Types.ObjectId[];
  disciplineIds?: Types.ObjectId[];
};

type ReviewManagerLean = {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
};

@Injectable()
export class ExpertReviewsService {
  constructor(
    @InjectModel(ExpertReview.name)
    private readonly expertReviewModel: Model<ExpertReview>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(ProjectExpertAssignment.name)
    private readonly assignmentModel: Model<ProjectExpertAssignment>,
    @InjectModel(ConsensusReview.name)
    private readonly consensusReviewModel: Model<ConsensusReview>,
    @InjectModel(ProjectMaterial.name)
    private readonly materialModel: Model<ProjectMaterial>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async listExpertTasks(
    query: QueryExpertReviewTasksDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaginatedResponse<ExpertReviewTaskResponse>> {
    const assignments = await this.assignmentModel
      .find({
        expertUserId: toObjectId(currentUser.user.id, 'expertUserId'),
        status: 'assigned',
      })
      .sort({ createdAt: -1 })
      .lean<AssignmentLean[]>()
      .exec();
    const assignmentByProjectId = new Map(
      assignments.map((assignment) => [
        assignment.projectId.toString(),
        assignment,
      ]),
    );
    let projectIds = assignments.map((assignment) => assignment.projectId);

    if (query.status) {
      projectIds = await this.filterProjectIdsByReviewStatus(
        projectIds,
        currentUser.user.id,
        query.status,
      );
    }

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
    const [projects, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ProjectLean[]>()
        .exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);
    const pageProjectIds = projects.map((project) => project._id);
    const reviewManagerIds = projects
      .map((project) => project.reviewManagerId)
      .filter((id): id is Types.ObjectId => Boolean(id));
    const [reviewMap, materialCountMap, reviewManagerMap] = await Promise.all([
      this.getReviewMap(pageProjectIds, currentUser.user.id),
      this.countActiveMaterialsByProject(pageProjectIds),
      this.getReviewManagerMap(reviewManagerIds),
    ]);

    return {
      items: projects.map((project) => {
        const review = reviewMap.get(project._id.toString());

        return {
          project: this.toProjectSummary(
            project,
            project.reviewManagerId
              ? (reviewManagerMap.get(project.reviewManagerId.toString()) ??
                  null)
              : null,
          ),
          assignmentId:
            assignmentByProjectId.get(project._id.toString())?._id.toString() ??
            '',
          materialCount: materialCountMap.get(project._id.toString()) ?? 0,
          status: review?.status ?? 'not_started',
          totalScore: review?.totalScore ?? null,
          submittedAt: review?.submittedAt ?? null,
          returnedAt: review?.returnedAt ?? null,
        };
      }),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async getExpertTask(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ExpertReviewTaskDetailResponse> {
    const { project, assignment } = await this.assertExpertAssignedAccess(
      projectId,
      currentUser.user.id,
    );
    const snapshot = this.getProjectSnapshot(project);
    const [review, materials, reviewManager] = await Promise.all([
      this.findExpertReview(project._id, currentUser.user.id),
      this.listMaterialSummaries(project._id),
      this.getReviewManagerSummary(project.reviewManagerId),
    ]);

    return {
      project: this.toProjectSummary(project, reviewManager),
      materialCount: materials.length,
      materials,
      reviewSchemeSnapshot: snapshot,
      review: review
        ? this.toReviewResponse(review)
        : {
            status: 'not_started',
            projectId: project._id.toString(),
            expertUserId: currentUser.user.id,
            assignmentId: assignment._id.toString(),
            reviewSchemeSnapshot: snapshot,
            items: this.initializeItems(snapshot),
            totalScore: 0,
          },
    };
  }

  async saveDraft(
    projectId: string,
    dto: SaveExpertReviewDto,
    currentUser: AuthenticatedUser,
  ): Promise<ExpertReviewResponse> {
    const { project, assignment } = await this.assertExpertAssignedAccess(
      projectId,
      currentUser.user.id,
    );
    const snapshot = this.getProjectSnapshot(project);
    const existing = await this.findExpertReview(
      project._id,
      currentUser.user.id,
    );

    if (existing?.status === 'submitted') {
      throw new ConflictException('Submitted expert review cannot be modified');
    }

    const items = this.mergeItems(
      existing
        ? this.normalizeSnapshot(existing.reviewSchemeSnapshot)
        : snapshot,
      existing?.items ?? this.initializeItems(snapshot),
      dto.items ?? [],
      false,
    );
    const saved = await this.upsertReview({
      existing,
      projectId: project._id,
      expertUserId: currentUser.user.id,
      assignmentId: assignment._id,
      reviewSchemeSnapshot: existing?.reviewSchemeSnapshot ?? snapshot,
      items,
      status: 'draft',
      submittedAt: null,
    });

    return this.toReviewResponse(saved);
  }

  async submitReview(
    projectId: string,
    dto: SaveExpertReviewDto,
    currentUser: AuthenticatedUser,
  ): Promise<ExpertReviewResponse> {
    const { project, assignment } = await this.assertExpertAssignedAccess(
      projectId,
      currentUser.user.id,
    );
    const snapshot = this.getProjectSnapshot(project);
    const existing = await this.findExpertReview(
      project._id,
      currentUser.user.id,
    );

    if (existing?.status === 'submitted') {
      throw new ConflictException('Expert review has already been submitted');
    }

    this.assertReviewSubmissionStarted(project.reviewTime);

    const reviewSnapshot = existing
      ? this.normalizeSnapshot(existing.reviewSchemeSnapshot)
      : snapshot;
    const items = this.mergeItems(
      reviewSnapshot,
      existing?.items ?? this.initializeItems(reviewSnapshot),
      dto.items ?? [],
      true,
    );
    this.validateSubmitItems(items);
    const saved = await this.upsertReview({
      existing,
      projectId: project._id,
      expertUserId: currentUser.user.id,
      assignmentId: assignment._id,
      reviewSchemeSnapshot: existing?.reviewSchemeSnapshot ?? snapshot,
      items,
      status: 'submitted',
      submittedAt: new Date(),
    });

    return this.toReviewResponse(saved);
  }

  async deleteDraftReviewForExpert(
    projectId: string,
    expertUserId: string,
  ): Promise<void> {
    const { project } = await this.assertExpertAssignedAccess(
      projectId,
      expertUserId,
    );
    const existing = await this.findExpertReview(project._id, expertUserId);

    if (!existing) {
      throw new NotFoundException('未找到可删除的评分草稿。');
    }

    if (existing.status !== 'draft') {
      throw new ConflictException({
        message: '只有未提交的评分草稿可以删除。',
        code: EXPERT_REVIEW_DRAFT_NOT_DELETABLE,
      });
    }

    const deleteResult = await this.expertReviewModel
      .deleteOne({ _id: existing._id, status: 'draft' })
      .exec();

    if (deleteResult.deletedCount === 0) {
      throw new NotFoundException('未找到可删除的评分草稿。');
    }
  }

  async listProjectExpertReviews(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ReviewManagerExpertReviewListItem[]> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    return this.listProjectExpertReviewStatuses(project._id);
  }

  async listProjectExpertReviewsForAdmin(
    projectId: string,
  ): Promise<ReviewManagerExpertReviewListItem[]> {
    const project = await this.findActiveProject(projectId);
    return this.listProjectExpertReviewStatuses(project._id);
  }

  async getProjectExpertReview(
    projectId: string,
    expertUserId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ExpertReviewResponse | ExpertReviewNotStartedResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    return this.getExpertReviewForProject(project, expertUserId);
  }

  async getProjectExpertReviewForAdmin(
    projectId: string,
    expertUserId: string,
  ): Promise<ExpertReviewResponse | ExpertReviewNotStartedResponse> {
    const project = await this.findActiveProject(projectId);
    return this.getExpertReviewForProject(project, expertUserId);
  }

  async returnExpertReview(
    projectId: string,
    expertUserId: string,
    dto: ReturnExpertReviewDto,
    currentUser: AuthenticatedUser,
  ): Promise<ExpertReviewResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    await this.assertExpertKnownForProject(project._id, expertUserId);
    const review = await this.findExpertReview(project._id, expertUserId);

    if (!review) {
      throw new NotFoundException('Expert review not found');
    }

    if (review.status !== 'submitted') {
      throw new ConflictException(
        'Only submitted expert review can be returned',
      );
    }

    await this.assertConsensusNotConfirmed(project._id);

    const updated = await this.expertReviewModel
      .findByIdAndUpdate(
        review._id,
        {
          $set: {
            status: 'returned',
            returnedAt: new Date(),
            returnedByUserId: toObjectId(currentUser.user.id, 'userId'),
            returnReason: dto.returnReason,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<ExpertReviewLean | null>()
      .exec();

    if (!updated) {
      throw new NotFoundException('Expert review not found');
    }

    return this.toReviewResponse(updated);
  }

  private async assertConsensusNotConfirmed(
    projectId: Types.ObjectId,
  ): Promise<void> {
    const confirmedConsensus = await this.consensusReviewModel
      .exists({ projectId, status: 'confirmed' })
      .exec();

    if (confirmedConsensus) {
      throw new ConflictException(
        'Expert review cannot be returned after consensus is confirmed',
      );
    }
  }

  async getReviewSummary(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ReviewSummaryResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    return this.calculateReviewSummary(project._id);
  }

  async getReviewSummaryForAdmin(
    projectId: string,
  ): Promise<ReviewSummaryResponse> {
    const project = await this.findActiveProject(projectId);
    return this.calculateReviewSummary(project._id);
  }

  async getSubmittedReviewsForConsensus(
    projectId: string,
  ): Promise<SubmittedExpertReviewForConsensus[]> {
    const project = await this.findActiveProject(projectId);
    const reviews = await this.expertReviewModel
      .find({ projectId: project._id, status: 'submitted' })
      .sort({ submittedAt: 1 })
      .lean<ExpertReviewLean[]>()
      .exec();
    const expertMap = await this.getExpertMap(
      reviews.map((review) => review.expertUserId),
    );

    return reviews.map((review) => ({
      ...this.toReviewResponse(review),
      expert: expertMap.get(review.expertUserId.toString()),
    }));
  }

  async calculateReviewSummaryByObjectId(
    projectId: Types.ObjectId,
  ): Promise<ReviewSummaryResponse> {
    return this.calculateReviewSummary(projectId);
  }

  private async filterProjectIdsByReviewStatus(
    projectIds: Types.ObjectId[],
    expertUserId: string,
    status: ExpertReviewViewStatus,
  ): Promise<Types.ObjectId[]> {
    const reviews = await this.expertReviewModel
      .find({
        projectId: { $in: projectIds },
        expertUserId: toObjectId(expertUserId, 'expertUserId'),
      })
      .select({ projectId: 1, status: 1 })
      .lean<Pick<ExpertReviewLean, 'projectId' | 'status'>[]>()
      .exec();
    const reviewedProjectIds = new Set(
      reviews.map((review) => review.projectId.toString()),
    );

    if (status === 'not_started') {
      return projectIds.filter((id) => !reviewedProjectIds.has(id.toString()));
    }

    return reviews
      .filter((review) => review.status === status)
      .map((review) => review.projectId);
  }

  private buildProjectFilter(
    query: {
      batchId?: string;
      keyword?: string;
      reviewManagerId?: string;
      reviewSchemeId?: string;
    },
    baseFilter: Record<string, unknown>,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = { ...baseFilter };

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

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [{ projectNo: keyword }, { name: keyword }];
    }

    return filter;
  }

  private async assertExpertAssignedAccess(
    projectId: string,
    expertUserId: string,
  ): Promise<{ project: ProjectLean; assignment: AssignmentLean }> {
    const project = await this.findActiveProject(projectId);
    const assignment = await this.assignmentModel
      .findOne({
        projectId: project._id,
        expertUserId: toObjectId(expertUserId, 'expertUserId'),
        status: 'assigned',
      })
      .lean<AssignmentLean | null>()
      .exec();

    if (!assignment) {
      throw new ForbiddenException();
    }

    return { project, assignment };
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

  private getProjectSnapshot(project: ProjectLean): ReviewSchemeSnapshot {
    if (!project.reviewSchemeSnapshot) {
      throw new ConflictException({
        message: '项目尚未分配评审方案，暂不能评分。',
        code: PROJECT_REVIEW_SCHEME_MISSING,
      });
    }

    return this.normalizeSnapshot(project.reviewSchemeSnapshot);
  }

  private assertReviewSubmissionStarted(reviewTime?: Date | null): void {
    if (!reviewTime) {
      return;
    }

    if (new Date().getTime() >= reviewTime.getTime()) {
      return;
    }

    throw new ConflictException({
      message: '评审尚未开始，暂不能提交评分。',
      code: 'REVIEW_NOT_STARTED',
      reviewTime,
    });
  }

  private normalizeSnapshot(
    value: Record<string, unknown>,
  ): ReviewSchemeSnapshot {
    const totalScore = value.totalScore;
    const items = value.items;

    if (typeof totalScore !== 'number' || !Array.isArray(items)) {
      throw new ConflictException({
        message: '项目评审方案配置异常，暂不能评分。请联系管理员处理。',
        code: PROJECT_REVIEW_SCHEME_INVALID,
      });
    }

    const snapshotItems = items
      .map((item) => this.normalizeSnapshotItem(item))
      .sort((left, right) => left.sortOrder - right.sortOrder);

    if (snapshotItems.length === 0) {
      throw new ConflictException({
        message: '项目评审方案配置异常，暂不能评分。请联系管理员处理。',
        code: PROJECT_REVIEW_SCHEME_INVALID,
      });
    }

    return {
      id: typeof value.id === 'string' ? value.id : undefined,
      name: typeof value.name === 'string' ? value.name : undefined,
      totalScore,
      items: snapshotItems,
    };
  }

  private normalizeSnapshotItem(value: unknown): ReviewSchemeSnapshotItem {
    if (typeof value !== 'object' || value === null) {
      throw new ConflictException({
        message: '项目评审方案配置异常，暂不能评分。请联系管理员处理。',
        code: PROJECT_REVIEW_SCHEME_INVALID,
      });
    }

    const record = value as Record<string, unknown>;
    const name = record.name;
    const maxScore = record.maxScore;

    if (typeof name !== 'string' || typeof maxScore !== 'number') {
      throw new ConflictException({
        message: '项目评审方案配置异常，暂不能评分。请联系管理员处理。',
        code: PROJECT_REVIEW_SCHEME_INVALID,
      });
    }

    return {
      name,
      maxScore,
      scoringGuide:
        typeof record.scoringGuide === 'string' ? record.scoringGuide : '',
      sortOrder: typeof record.sortOrder === 'number' ? record.sortOrder : 0,
      suggestionRequiredThresholdRatio:
        typeof record.suggestionRequiredThresholdRatio === 'number'
          ? record.suggestionRequiredThresholdRatio
          : DEFAULT_SUGGESTION_REQUIRED_THRESHOLD_RATIO,
    };
  }

  private initializeItems(
    snapshot: ReviewSchemeSnapshot,
  ): ExpertReviewItemResponse[] {
    return snapshot.items.map((item) => ({
      itemSnapshot: { ...item },
      score: null,
      evaluationDescription: '',
      improvementSuggestion: '',
      hasMajorIssue: false,
    }));
  }

  private mergeItems(
    snapshot: ReviewSchemeSnapshot,
    baseItems: ExpertReviewItemResponse[],
    inputItems: ExpertReviewItemInputDto[],
    requireAllInputItems: boolean,
  ): ExpertReviewItemResponse[] {
    const nextItems = this.alignItemsToSnapshot(snapshot, baseItems);
    const usedNames = new Set<string>();

    inputItems.forEach((inputItem, index) => {
      const targetIndex = inputItem.name
        ? nextItems.findIndex(
            (item) => item.itemSnapshot.name === inputItem.name,
          )
        : index;

      if (targetIndex < 0 || targetIndex >= nextItems.length) {
        throw new BadRequestException(
          `Review item ${inputItem.name ?? index} is not in project snapshot`,
        );
      }

      const target = nextItems[targetIndex];
      const itemName = target.itemSnapshot.name;

      if (usedNames.has(itemName)) {
        throw new BadRequestException('Duplicate review item in request');
      }

      usedNames.add(itemName);

      if (inputItem.score !== undefined) {
        this.assertScoreRange(inputItem.score, target.itemSnapshot);
        target.score = inputItem.score;
      }

      if (inputItem.evaluationDescription !== undefined) {
        target.evaluationDescription = inputItem.evaluationDescription;
      }

      if (inputItem.improvementSuggestion !== undefined) {
        target.improvementSuggestion = inputItem.improvementSuggestion;
      }

      if (inputItem.hasMajorIssue !== undefined) {
        target.hasMajorIssue = inputItem.hasMajorIssue;
      }
    });

    if (requireAllInputItems && inputItems.length > snapshot.items.length) {
      throw new BadRequestException('Too many review items');
    }

    return nextItems;
  }

  private alignItemsToSnapshot(
    snapshot: ReviewSchemeSnapshot,
    items: ExpertReviewItemResponse[],
  ): ExpertReviewItemResponse[] {
    const itemByName = new Map(
      items.map((item) => [item.itemSnapshot.name, item]),
    );

    return snapshot.items.map((snapshotItem) => {
      const existing = itemByName.get(snapshotItem.name);

      return {
        itemSnapshot: { ...snapshotItem },
        score: existing?.score ?? null,
        evaluationDescription: existing?.evaluationDescription ?? '',
        improvementSuggestion: existing?.improvementSuggestion ?? '',
        hasMajorIssue: existing?.hasMajorIssue ?? false,
      };
    });
  }

  private assertScoreRange(
    score: number,
    item: ReviewSchemeSnapshotItem,
  ): void {
    if (score < 0 || score > item.maxScore) {
      throw new BadRequestException(
        `${item.name} score must be between 0 and ${item.maxScore}`,
      );
    }
  }

  private validateSubmitItems(items: ExpertReviewItemResponse[]): void {
    for (const item of items) {
      const score = item.score;

      if (score === undefined || score === null) {
        throw new BadRequestException(
          `${item.itemSnapshot.name} score is required`,
        );
      }

      this.assertScoreRange(score, item.itemSnapshot);

      if (!item.evaluationDescription.trim()) {
        throw new BadRequestException(
          `${item.itemSnapshot.name} evaluationDescription is required`,
        );
      }

      const thresholdRatio =
        item.itemSnapshot.suggestionRequiredThresholdRatio ??
        DEFAULT_SUGGESTION_REQUIRED_THRESHOLD_RATIO;
      const belowThreshold =
        score < item.itemSnapshot.maxScore * thresholdRatio;

      if (
        (belowThreshold || item.hasMajorIssue) &&
        !item.improvementSuggestion.trim()
      ) {
        throw new BadRequestException(
          `${item.itemSnapshot.name} improvementSuggestion is required`,
        );
      }
    }
  }

  private async upsertReview(input: {
    existing: ExpertReviewLean | null;
    projectId: Types.ObjectId;
    expertUserId: string;
    assignmentId: Types.ObjectId;
    reviewSchemeSnapshot: Record<string, unknown>;
    items: ExpertReviewItemResponse[];
    status: ExpertReviewStatus;
    submittedAt: Date | null;
  }): Promise<ExpertReviewLean> {
    const totalScore = this.calculateTotalScore(input.items);
    const update = {
      projectId: input.projectId,
      expertUserId: toObjectId(input.expertUserId, 'expertUserId'),
      assignmentId: input.assignmentId,
      reviewSchemeSnapshot: input.reviewSchemeSnapshot,
      items: input.items,
      totalScore,
      status: input.status,
      submittedAt: input.submittedAt,
    };

    const saved = input.existing
      ? await this.expertReviewModel
          .findByIdAndUpdate(
            input.existing._id,
            {
              $set: update,
              $unset: {
                returnedAt: '',
                returnedByUserId: '',
                returnReason: '',
              },
            },
            { returnDocument: 'after' },
          )
          .lean<ExpertReviewLean | null>()
          .exec()
      : await this.expertReviewModel
          .create(update)
          .then((created) => created.toObject<ExpertReviewLean>());

    if (!saved) {
      throw new NotFoundException('Expert review not found');
    }

    return saved;
  }

  private calculateTotalScore(items: ExpertReviewItemResponse[]): number {
    return Number(
      items
        .reduce(
          (sum, item) =>
            sum + (typeof item.score === 'number' ? item.score : 0),
          0,
        )
        .toFixed(2),
    );
  }

  private async findExpertReview(
    projectId: Types.ObjectId,
    expertUserId: string,
  ): Promise<ExpertReviewLean | null> {
    return this.expertReviewModel
      .findOne({
        projectId,
        expertUserId: toObjectId(expertUserId, 'expertUserId'),
      })
      .lean<ExpertReviewLean | null>()
      .exec();
  }

  private async getReviewMap(
    projectIds: Types.ObjectId[],
    expertUserId: string,
  ): Promise<Map<string, ExpertReviewLean>> {
    const reviews = await this.expertReviewModel
      .find({
        projectId: { $in: projectIds },
        expertUserId: toObjectId(expertUserId, 'expertUserId'),
      })
      .lean<ExpertReviewLean[]>()
      .exec();

    return new Map(
      reviews.map((review) => [review.projectId.toString(), review]),
    );
  }

  private async listProjectExpertReviewStatuses(
    projectId: Types.ObjectId,
  ): Promise<ReviewManagerExpertReviewListItem[]> {
    const assignments = await this.assignmentModel
      .find({ projectId, status: 'assigned' })
      .sort({ createdAt: 1 })
      .lean<AssignmentLean[]>()
      .exec();
    const reviews = await this.expertReviewModel
      .find({ projectId })
      .lean<ExpertReviewLean[]>()
      .exec();
    const reviewByExpertId = new Map(
      reviews.map((review) => [review.expertUserId.toString(), review]),
    );
    const expertMap = await this.getExpertMap(
      assignments.map((assignment) => assignment.expertUserId),
    );

    return assignments.map((assignment) => {
      const expertId = assignment.expertUserId.toString();
      const review = reviewByExpertId.get(expertId);

      return {
        expert: expertMap.get(expertId) ?? {
          id: expertId,
          phone: '',
          name: '',
          organizationIds: [],
          disciplineIds: [],
        },
        assignmentId: assignment._id.toString(),
        status: review?.status ?? 'not_started',
        totalScore: review?.totalScore ?? null,
        submittedAt: review?.submittedAt ?? null,
        returnedAt: review?.returnedAt ?? null,
      };
    });
  }

  private async getExpertReviewForProject(
    project: ProjectLean,
    expertUserId: string,
  ): Promise<ExpertReviewResponse | ExpertReviewNotStartedResponse> {
    const assignment = await this.assertExpertKnownForProject(
      project._id,
      expertUserId,
    );
    const review = await this.findExpertReview(project._id, expertUserId);

    if (review) {
      return this.toReviewResponse(review);
    }

    const snapshot = this.getProjectSnapshot(project);

    return {
      status: 'not_started',
      projectId: project._id.toString(),
      expertUserId,
      assignmentId: assignment?._id.toString() ?? '',
      reviewSchemeSnapshot: snapshot,
      items: this.initializeItems(snapshot),
      totalScore: 0,
    };
  }

  private async assertExpertKnownForProject(
    projectId: Types.ObjectId,
    expertUserId: string,
  ): Promise<AssignmentLean | null> {
    const expertObjectId = toObjectId(expertUserId, 'expertUserId');
    const [assignment, review] = await Promise.all([
      this.assignmentModel
        .findOne({ projectId, expertUserId: expertObjectId })
        .lean<AssignmentLean | null>()
        .exec(),
      this.expertReviewModel
        .exists({ projectId, expertUserId: expertObjectId })
        .exec(),
    ]);

    if (!assignment && !review) {
      throw new ForbiddenException();
    }

    return assignment;
  }

  private async calculateReviewSummary(
    projectId: Types.ObjectId,
  ): Promise<ReviewSummaryResponse> {
    const [assignedExpertCount, reviews] = await Promise.all([
      this.assignmentModel
        .countDocuments({ projectId, status: 'assigned' })
        .exec(),
      this.expertReviewModel
        .find({ projectId })
        .lean<ExpertReviewLean[]>()
        .exec(),
    ]);
    const submittedReviews = reviews.filter(
      (review) => review.status === 'submitted',
    );
    const submittedExpertCount = submittedReviews.length;
    const draftExpertCount = reviews.filter(
      (review) => review.status === 'draft',
    ).length;
    const returnedExpertCount = reviews.filter(
      (review) => review.status === 'returned',
    ).length;
    const notStartedExpertCount = Math.max(
      assignedExpertCount - reviews.length,
      0,
    );

    if (submittedReviews.length === 0) {
      return {
        assignedExpertCount,
        submittedExpertCount,
        draftExpertCount,
        returnedExpertCount,
        notStartedExpertCount,
        averageScore: null,
        minScore: null,
        maxScore: null,
        perItemAverageScores: null,
      };
    }

    const scores = submittedReviews.map((review) => review.totalScore);

    return {
      assignedExpertCount,
      submittedExpertCount,
      draftExpertCount,
      returnedExpertCount,
      notStartedExpertCount,
      averageScore: this.round2(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      ),
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      perItemAverageScores: this.calculatePerItemAverages(submittedReviews),
    };
  }

  private calculatePerItemAverages(
    reviews: ExpertReviewLean[],
  ): PerItemAverageScore[] {
    const firstReview = reviews[0];

    if (!firstReview) {
      return [];
    }

    return firstReview.items.map((item, index) => {
      const scores = reviews
        .map((review) => review.items[index]?.score)
        .filter((score): score is number => typeof score === 'number');

      return {
        name: item.itemSnapshot.name,
        sortOrder: item.itemSnapshot.sortOrder,
        maxScore: item.itemSnapshot.maxScore,
        averageScore:
          scores.length > 0
            ? this.round2(
                scores.reduce((sum, score) => sum + score, 0) / scores.length,
              )
            : null,
      };
    });
  }

  private round2(value: number): number {
    return Number(value.toFixed(2));
  }

  private async countActiveMaterialsByProject(
    projectIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    await Promise.all(
      projectIds.map(async (projectId) => {
        counts.set(
          projectId.toString(),
          await this.materialModel
            .countDocuments({ projectId, status: 'active' })
            .exec(),
        );
      }),
    );

    return counts;
  }

  private async listMaterialSummaries(
    projectId: Types.ObjectId,
  ): Promise<MaterialSummary[]> {
    const materials = await this.materialModel
      .find({ projectId, status: 'active' })
      .sort({ createdAt: -1 })
      .lean<MaterialLean[]>()
      .exec();

    return materials.map((material) => ({
      id: material._id.toString(),
      materialTypeId: material.materialTypeId.toString(),
      originalFilename: material.originalFilename,
      safeFilename: material.safeFilename,
      mimeType: material.mimeType,
      extension: material.extension,
      sizeBytes: material.sizeBytes,
      remark: material.remark,
      createdAt: material.createdAt,
    }));
  }

  private async getExpertMap(
    expertIds: Types.ObjectId[],
  ): Promise<Map<string, ExpertBasicSummary>> {
    if (expertIds.length === 0) {
      return new Map();
    }

    const uniqueIds = [...new Set(expertIds.map((id) => id.toString()))].map(
      (id) => toObjectId(id, 'expertUserId'),
    );
    const experts = await this.userModel
      .find({ _id: { $in: uniqueIds } })
      .select({ phone: 1, name: 1, organizationIds: 1, disciplineIds: 1 })
      .lean<UserLean[]>()
      .exec();

    return new Map(
      experts.map((expert) => [
        expert._id.toString(),
        {
          id: expert._id.toString(),
          phone: expert.phone,
          name: expert.name,
          organizationIds: (expert.organizationIds ?? []).map((id) =>
            id.toString(),
          ),
          disciplineIds: (expert.disciplineIds ?? []).map((id) =>
            id.toString(),
          ),
        },
      ]),
    );
  }

  private async getReviewManagerMap(
    reviewManagerIds: Types.ObjectId[],
  ): Promise<Map<string, ReviewManagerSummary>> {
    if (reviewManagerIds.length === 0) {
      return new Map();
    }

    const uniqueIds = [
      ...new Set(reviewManagerIds.map((id) => id.toString())),
    ].map((id) => toObjectId(id, 'reviewManagerId'));
    const reviewManagers = await this.userModel
      .find({ _id: { $in: uniqueIds } })
      .select({ name: 1, phone: 1 })
      .lean<ReviewManagerLean[]>()
      .exec();

    return new Map(
      reviewManagers.map((reviewManager) => [
        reviewManager._id.toString(),
        {
          id: reviewManager._id.toString(),
          name: reviewManager.name,
          phone: reviewManager.phone,
        },
      ]),
    );
  }

  private async getReviewManagerSummary(
    reviewManagerId?: Types.ObjectId | null,
  ): Promise<ReviewManagerSummary | null> {
    if (!reviewManagerId) {
      return null;
    }

    return (
      (await this.getReviewManagerMap([reviewManagerId])).get(
        reviewManagerId.toString(),
      ) ?? null
    );
  }

  private toProjectSummary(
    project: ProjectLean,
    reviewManager: ReviewManagerSummary | null = null,
  ): ProjectTaskSummary {
    return {
      id: project._id.toString(),
      batchId: project.batchId.toString(),
      projectNo: project.projectNo,
      name: project.name,
      statusId: project.statusId?.toString() ?? null,
      reviewManagerId: project.reviewManagerId?.toString() ?? null,
      reviewManager,
      reviewSchemeId: project.reviewSchemeId?.toString() ?? null,
      reviewTime: project.reviewTime,
      reviewLocation: project.reviewLocation,
      meetingUrl: project.meetingUrl,
      followUpNeeds: project.followUpNeeds,
    };
  }

  private toReviewResponse(review: ExpertReviewLean): ExpertReviewResponse {
    return {
      id: review._id.toString(),
      projectId: review.projectId.toString(),
      expertUserId: review.expertUserId.toString(),
      assignmentId: review.assignmentId?.toString() ?? null,
      reviewSchemeSnapshot: this.normalizeSnapshot(review.reviewSchemeSnapshot),
      items: review.items,
      totalScore: review.totalScore,
      status: review.status,
      submittedAt: review.submittedAt ?? null,
      returnedAt: review.returnedAt ?? null,
      returnedByUserId: review.returnedByUserId?.toString() ?? null,
      returnReason: review.returnReason,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponse } from '../../../common/dto/pagination-query.dto';
import { escapeRegExp, toObjectId } from '../../../common/utils/mongo-query';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ExpertReviewStatus } from '../../expert-reviews/constants/expert-review.constants';
import { ExpertReview } from '../../expert-reviews/schemas/expert-review.schema';
import {
  ProjectForReviewAssignment,
  ProjectsService,
} from '../../projects/services/projects.service';
import { User } from '../../users/schemas/user.schema';
import { UserRole } from '../../users/types/user-role.type';
import { UserStatus } from '../../users/types/user-status.type';
import { AppendProjectExpertsDto } from '../dto/append-project-experts.dto';
import { BatchProjectExpertsDto } from '../dto/batch-project-experts.dto';
import { QueryExpertCandidatesDto } from '../dto/query-expert-candidates.dto';
import { UpdateProjectExpertsDto } from '../dto/update-project-experts.dto';
import {
  ProjectExpertAssignment,
  ProjectExpertAssignmentSource,
} from '../schemas/project-expert-assignment.schema';
import {
  ExpertEligibilityResult,
  ExpertEligibilityService,
} from './expert-eligibility.service';

export type ExpertBasicResponse = {
  id: string;
  phone: string;
  name: string;
  organizationIds: string[];
  disciplineIds: string[];
  assigned?: boolean;
  hasReviewRecord?: boolean;
  reviewStatus?: ExpertReviewStatus | null;
};

export type ExpertCandidatePage = PaginatedResponse<ExpertBasicResponse> & {
  reason?: string;
};

export type AppendExpertsResult = {
  assignedExperts: ExpertBasicResponse[];
  successCount: number;
  failedCount: number;
  failures: {
    expertUserId: string;
    reasons: string[];
    detail: ExpertEligibilityResult['detail'];
  }[];
};

export type ReplaceExpertsResult = {
  assignedExperts: ExpertBasicResponse[];
  addedOrRestoredCount: number;
  removedCount: number;
};

export type RemoveExpertResult = {
  removed: boolean;
  alreadyRemoved: boolean;
};

type AssignmentReviewFailure = {
  expertUserId: string;
  reviewStatus: ExpertReviewStatus;
};

export type BatchProjectExpertsResult = {
  successCount: number;
  failedCount: number;
  results: {
    projectId: string;
    success: boolean;
    assignedCount?: number;
    removedCount?: number;
    failures?: {
      expertUserId: string;
      reasons: string[];
      detail: ExpertEligibilityResult['detail'];
    }[];
    message?: string;
  }[];
};

type AssignmentLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  expertUserId: Types.ObjectId;
  assignedByUserId: Types.ObjectId;
  source: ProjectExpertAssignmentSource;
  status: string;
  removedAt?: Date | null;
  removedByUserId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

type ExpertUserLean = {
  _id: Types.ObjectId;
  phone: string;
  name: string;
  roles: UserRole[];
  organizationIds?: Types.ObjectId[];
  disciplineIds?: Types.ObjectId[];
  isActive?: boolean;
  status: UserStatus;
};

type ExpertReviewStatusLean = {
  expertUserId: Types.ObjectId;
  status: ExpertReviewStatus;
};

const EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD =
  'EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD';

@Injectable()
export class ProjectExpertAssignmentsService {
  constructor(
    @InjectModel(ProjectExpertAssignment.name)
    private readonly assignmentModel: Model<ProjectExpertAssignment>,
    @InjectModel(ExpertReview.name)
    private readonly expertReviewModel: Model<ExpertReview>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly projectsService: ProjectsService,
    private readonly expertEligibilityService: ExpertEligibilityService,
  ) {}

  async listCandidates(
    projectId: string,
    query: QueryExpertCandidatesDto,
    currentUser: AuthenticatedUser,
  ): Promise<ExpertCandidatePage> {
    const project = await this.getManageableProject(projectId, currentUser);

    if (project.disciplineIds.length === 0) {
      return {
        items: [],
        page: query.page,
        pageSize: query.pageSize,
        total: 0,
        reason: 'project_discipline_missing',
      };
    }

    const filter = this.buildCandidateFilter(project, query.keyword);

    const [experts, total, assignedIds] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ name: 1, createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .select({
          phone: 1,
          name: 1,
          roles: 1,
          organizationIds: 1,
          disciplineIds: 1,
          isActive: 1,
          status: 1,
        })
        .lean<ExpertUserLean[]>()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
      this.findAssignedExpertIds(project._id),
    ]);

    return {
      items: experts.map((expert) => ({
        ...this.toExpertResponse(expert),
        assigned: assignedIds.has(expert._id.toString()),
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async listAssignedExperts(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ExpertBasicResponse[]> {
    const project = await this.getManageableProject(projectId, currentUser);
    return this.getAssignedExperts(project._id);
  }

  async appendExperts(
    projectId: string,
    dto: AppendProjectExpertsDto,
    currentUser: AuthenticatedUser,
    source: ProjectExpertAssignmentSource = 'manual',
  ): Promise<AppendExpertsResult> {
    const project = await this.getManageableProject(projectId, currentUser);
    const failures: AppendExpertsResult['failures'] = [];
    let successCount = 0;

    for (const expertUserId of dto.expertUserIds) {
      const eligibility =
        await this.expertEligibilityService.checkExpertForProject(
          projectId,
          expertUserId,
          project,
        );

      if (!eligibility.allowed) {
        failures.push({
          expertUserId,
          reasons: eligibility.reasons,
          detail: eligibility.detail,
        });
        continue;
      }

      await this.assignExpert(project._id, expertUserId, currentUser, source);
      successCount += 1;
    }

    return {
      assignedExperts: await this.getAssignedExperts(project._id),
      successCount,
      failedCount: failures.length,
      failures,
    };
  }

  async replaceExperts(
    projectId: string,
    dto: UpdateProjectExpertsDto,
    currentUser: AuthenticatedUser,
    source: ProjectExpertAssignmentSource = 'manual',
  ): Promise<ReplaceExpertsResult> {
    const project = await this.getManageableProject(projectId, currentUser);
    await this.assertAllExpertsEligible(projectId, dto.expertUserIds, project);

    const currentAssignedIds = await this.findAssignedExpertIds(project._id);
    const nextAssignedIds = new Set(dto.expertUserIds);
    const toRemove = [...currentAssignedIds].filter(
      (expertUserId) => !nextAssignedIds.has(expertUserId),
    );
    const blockedRemovals = await this.findReviewRecordFailures(
      project._id,
      toRemove,
    );

    if (blockedRemovals.length > 0) {
      throw new ConflictException({
        message: '部分专家已产生评分记录，不能移除。',
        code: EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD,
        failures: blockedRemovals,
      });
    }

    let removedCount = 0;

    if (toRemove.length > 0) {
      const deleteResult = await this.assignmentModel
        .deleteMany({
          projectId: project._id,
          expertUserId: {
            $in: toRemove.map((expertUserId) =>
              toObjectId(expertUserId, 'expertUserId'),
            ),
          },
          status: 'assigned',
        })
        .exec();
      removedCount = deleteResult.deletedCount ?? 0;
    }

    for (const expertUserId of dto.expertUserIds) {
      await this.assignExpert(project._id, expertUserId, currentUser, source);
    }

    return {
      assignedExperts: await this.getAssignedExperts(project._id),
      addedOrRestoredCount: dto.expertUserIds.filter(
        (expertUserId) => !currentAssignedIds.has(expertUserId),
      ).length,
      removedCount,
    };
  }

  async removeExpert(
    projectId: string,
    expertUserId: string,
    currentUser: AuthenticatedUser,
  ): Promise<RemoveExpertResult> {
    const project = await this.getManageableProject(projectId, currentUser);
    const expertObjectId = toObjectId(expertUserId, 'expertUserId');
    const existing = await this.assignmentModel
      .findOne({ projectId: project._id, expertUserId: expertObjectId })
      .lean<AssignmentLean | null>()
      .exec();

    if (!existing) {
      return { removed: false, alreadyRemoved: false };
    }

    if (existing.status === 'removed') {
      return { removed: false, alreadyRemoved: true };
    }

    const reviewStatusByExpertId = await this.findReviewStatusesByExpertIds(
      project._id,
      [expertObjectId],
    );
    const reviewStatus = reviewStatusByExpertId.get(expertObjectId.toString());

    if (reviewStatus) {
      throw new ConflictException({
        message: '该专家已产生评分记录，不能移除。',
        code: EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD,
        expertUserId,
        reviewStatus,
      });
    }

    const deleteResult = await this.assignmentModel
      .deleteOne({ _id: existing._id, status: 'assigned' })
      .exec();

    return {
      removed: deleteResult.deletedCount === 1,
      alreadyRemoved: false,
    };
  }

  async batchUpdateExperts(
    dto: BatchProjectExpertsDto,
    currentUser: AuthenticatedUser,
  ): Promise<BatchProjectExpertsResult> {
    if (dto.mode === 'append' && dto.expertUserIds.length === 0) {
      throw new BadRequestException('expertUserIds must not be empty');
    }

    const results: BatchProjectExpertsResult['results'] = [];

    for (const projectId of dto.projectIds) {
      try {
        const project = await this.getManageableProject(projectId, currentUser);
        const failures = await this.findExpertEligibilityFailures(
          projectId,
          dto.expertUserIds,
          project,
        );

        if (failures.length > 0) {
          results.push({ projectId, success: false, failures });
          continue;
        }

        if (dto.mode === 'replace') {
          const result = await this.replaceExperts(
            projectId,
            { expertUserIds: dto.expertUserIds },
            currentUser,
            'batch',
          );
          results.push({
            projectId,
            success: true,
            assignedCount: result.assignedExperts.length,
            removedCount: result.removedCount,
          });
          continue;
        }

        const result = await this.appendExperts(
          projectId,
          { expertUserIds: dto.expertUserIds },
          currentUser,
          'batch',
        );
        results.push({
          projectId,
          success: true,
          assignedCount: result.assignedExperts.length,
          removedCount: 0,
        });
      } catch (error) {
        results.push({
          projectId,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((result) => result.success).length;

    return {
      successCount,
      failedCount: results.length - successCount,
      results,
    };
  }

  private async getManageableProject(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectForReviewAssignment> {
    const project =
      await this.projectsService.findActiveForReviewAssignment(projectId);
    this.projectsService.assertCanManageProject(project, currentUser);
    return project;
  }

  private buildCandidateFilter(
    project: ProjectForReviewAssignment,
    keyword?: string,
  ): Record<string, unknown> {
    const avoidedOrganizationIds = [
      ...(project.leadOrganizationId ? [project.leadOrganizationId] : []),
      ...project.cooperationOrganizationIds,
    ];
    const filter: Record<string, unknown> = {
      roles: 'expert',
      isActive: true,
      status: 'active',
      disciplineIds: { $in: project.disciplineIds },
    };

    if (avoidedOrganizationIds.length > 0) {
      filter.organizationIds = { $nin: avoidedOrganizationIds };
    }

    if (keyword) {
      const keywordRegExp = new RegExp(escapeRegExp(keyword), 'i');
      filter.$or = [{ name: keywordRegExp }, { phone: keywordRegExp }];
    }

    return filter;
  }

  private async assertAllExpertsEligible(
    projectId: string,
    expertUserIds: string[],
    project: ProjectForReviewAssignment,
  ): Promise<void> {
    const failures = await this.findExpertEligibilityFailures(
      projectId,
      expertUserIds,
      project,
    );

    if (failures.length > 0) {
      throw new ConflictException({
        message: 'Some experts are not eligible for this project',
        failures,
      });
    }
  }

  private async findExpertEligibilityFailures(
    projectId: string,
    expertUserIds: string[],
    project: ProjectForReviewAssignment,
  ): Promise<AppendExpertsResult['failures']> {
    const failures: AppendExpertsResult['failures'] = [];

    for (const expertUserId of expertUserIds) {
      const eligibility =
        await this.expertEligibilityService.checkExpertForProject(
          projectId,
          expertUserId,
          project,
        );

      if (!eligibility.allowed) {
        failures.push({
          expertUserId,
          reasons: eligibility.reasons,
          detail: eligibility.detail,
        });
      }
    }

    return failures;
  }

  private async assignExpert(
    projectId: Types.ObjectId,
    expertUserId: string,
    currentUser: AuthenticatedUser,
    source: ProjectExpertAssignmentSource,
  ): Promise<void> {
    await this.assignmentModel
      .findOneAndUpdate(
        {
          projectId,
          expertUserId: toObjectId(expertUserId, 'expertUserId'),
        },
        {
          $set: {
            assignedByUserId: toObjectId(currentUser.user.id, 'userId'),
            source,
            status: 'assigned',
          },
          $unset: {
            removedAt: '',
            removedByUserId: '',
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      )
      .exec();
  }

  private async findAssignedExpertIds(
    projectId: Types.ObjectId,
  ): Promise<Set<string>> {
    const assignments = await this.assignmentModel
      .find({ projectId, status: 'assigned' })
      .select({ expertUserId: 1 })
      .lean<Pick<AssignmentLean, 'expertUserId'>[]>()
      .exec();

    return new Set(
      assignments.map((assignment) => assignment.expertUserId.toString()),
    );
  }

  private async findReviewRecordFailures(
    projectId: Types.ObjectId,
    expertUserIds: string[],
  ): Promise<AssignmentReviewFailure[]> {
    if (expertUserIds.length === 0) {
      return [];
    }

    const reviewStatusByExpertId = await this.findReviewStatusesByExpertIds(
      projectId,
      expertUserIds.map((expertUserId) =>
        toObjectId(expertUserId, 'expertUserId'),
      ),
    );

    return expertUserIds
      .map((expertUserId) => {
        const reviewStatus = reviewStatusByExpertId.get(expertUserId);

        return reviewStatus ? { expertUserId, reviewStatus } : null;
      })
      .filter(
        (failure): failure is AssignmentReviewFailure => failure !== null,
      );
  }

  private async findReviewStatusesByExpertIds(
    projectId: Types.ObjectId,
    expertIds: Types.ObjectId[],
  ): Promise<Map<string, ExpertReviewStatus>> {
    if (expertIds.length === 0) {
      return new Map();
    }

    const reviews = await this.expertReviewModel
      .find({ projectId, expertUserId: { $in: expertIds } })
      .select({ expertUserId: 1, status: 1 })
      .lean<ExpertReviewStatusLean[]>()
      .exec();

    return new Map(
      reviews.map((review) => [review.expertUserId.toString(), review.status]),
    );
  }

  private async getAssignedExperts(
    projectId: Types.ObjectId,
  ): Promise<ExpertBasicResponse[]> {
    const assignments = await this.assignmentModel
      .find({ projectId, status: 'assigned' })
      .sort({ createdAt: 1 })
      .select({ expertUserId: 1 })
      .lean<Pick<AssignmentLean, 'expertUserId'>[]>()
      .exec();
    const expertIds = assignments.map((assignment) => assignment.expertUserId);

    if (expertIds.length === 0) {
      return [];
    }

    const experts = await this.userModel
      .find({ _id: { $in: expertIds } })
      .select({
        phone: 1,
        name: 1,
        roles: 1,
        organizationIds: 1,
        disciplineIds: 1,
        isActive: 1,
        status: 1,
      })
      .lean<ExpertUserLean[]>()
      .exec();
    const expertById = new Map(
      experts.map((expert) => [expert._id.toString(), expert]),
    );
    const reviewStatusByExpertId = await this.findReviewStatusesByExpertIds(
      projectId,
      expertIds,
    );

    return assignments
      .map((assignment): ExpertBasicResponse | null => {
        const expertId = assignment.expertUserId.toString();
        const expert = expertById.get(expertId);

        if (!expert) {
          return null;
        }

        const reviewStatus = reviewStatusByExpertId.get(expertId) ?? null;

        return {
          ...this.toExpertResponse(expert),
          hasReviewRecord: reviewStatus !== null,
          reviewStatus,
        };
      })
      .filter((expert): expert is ExpertBasicResponse => expert !== null);
  }

  private toExpertResponse(expert: ExpertUserLean): ExpertBasicResponse {
    return {
      id: expert._id.toString(),
      phone: expert.phone,
      name: expert.name,
      organizationIds: (expert.organizationIds ?? []).map((id) =>
        id.toString(),
      ),
      disciplineIds: (expert.disciplineIds ?? []).map((id) => id.toString()),
    };
  }
}

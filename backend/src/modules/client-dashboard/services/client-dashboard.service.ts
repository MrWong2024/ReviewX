import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { escapeRegExp, toObjectId } from '../../../common/utils/mongo-query';
import {
  CONSENSUS_REVIEW_STATUSES,
  ConsensusReviewStatus,
} from '../../consensus-reviews/constants/consensus-review.constants';
import { ConsensusReview } from '../../consensus-reviews/schemas/consensus-review.schema';
import { ExpertReview } from '../../expert-reviews/schemas/expert-review.schema';
import { PROJECT_APPEAL_PENDING_STATUSES } from '../../project-appeals/constants/project-appeal.constants';
import type { ProjectAppealStatus } from '../../project-appeals/constants/project-appeal.constants';
import { ProjectAppeal } from '../../project-appeals/schemas/project-appeal.schema';
import { ProjectExpertAssignment } from '../../project-expert-assignments/schemas/project-expert-assignment.schema';
import { ProjectMaterial } from '../../project-materials/schemas/project-material.schema';
import { Project } from '../../projects/schemas/project.schema';
import {
  CLIENT_DASHBOARD_PRIMARY_STAGE_PRIORITY,
  CLIENT_DASHBOARD_PROGRESS_STAGES,
  ClientDashboardProgressStage,
  EffectiveFinalLevelSource,
} from '../constants/client-dashboard.constants';
import { QueryClientDashboardOverviewDto } from '../dto/query-client-dashboard-overview.dto';
import { QueryClientDashboardProjectsDto } from '../dto/query-client-dashboard-projects.dto';
import {
  ClientDashboardFilters,
  ClientDashboardOverviewResponse,
  ClientDashboardProjectItem,
  ClientDashboardProjectsResponse,
} from '../types/client-dashboard.types';

type ProjectLean = {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  projectNo: string;
  name: string;
  projectTypeId?: Types.ObjectId | null;
  statusId?: Types.ObjectId | null;
  ownerUserId?: Types.ObjectId | null;
  leadOrganizationId?: Types.ObjectId | null;
  cooperationOrganizationIds?: Types.ObjectId[];
  totalFunding?: number | null;
  allocatedFunding?: number | null;
  disciplineIds?: Types.ObjectId[];
  departmentId?: Types.ObjectId | null;
  reviewManagerId?: Types.ObjectId | null;
  reviewSchemeId?: Types.ObjectId | null;
  reviewTime?: Date | null;
  reviewLocation?: string;
  meetingUrl?: string;
  finalLevel?: string;
  originalLevel?: string;
  createdAt: Date;
  updatedAt: Date;
};

type AssignmentLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  status: string;
};

type ExpertReviewLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  status: string;
};

type ConsensusReviewLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  status: ConsensusReviewStatus;
  finalScore?: number | null;
  finalLevel?: string;
  confirmedAt?: Date | null;
};

type ProjectMaterialLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  status: string;
  deletedAt?: Date | null;
};

type ProjectAppealLean = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  appealNo: number;
  status: ProjectAppealStatus;
  causedLevelChange: boolean;
  createdAt: Date;
  handledAt?: Date | null;
};

type ProjectBaseFilter = {
  isActive: true;
  batchId?: Types.ObjectId;
  projectTypeId?: Types.ObjectId;
  statusId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  disciplineIds?: Types.ObjectId;
  reviewManagerId?: Types.ObjectId;
  reviewSchemeId?: Types.ObjectId;
  $or?: Array<{ projectNo: RegExp } | { name: RegExp }>;
};

type ProjectDerivedMetrics = {
  assignedExpertCount: number;
  submittedExpertReviewCount: number;
  submittedMaterialCount: number;
  appealTotalCount: number;
  pendingAppealCount: number;
};

type BuildItemsResult = {
  filters: ClientDashboardFilters;
  items: DashboardProjectItemWithAppealStats[];
};

type DashboardProjectItemWithAppealStats = ClientDashboardProjectItem & {
  appealStatusCounts: Record<ProjectAppealStatus, number>;
  levelChangedAppealCount: number;
};

@Injectable()
export class ClientDashboardService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(ProjectExpertAssignment.name)
    private readonly assignmentModel: Model<ProjectExpertAssignment>,
    @InjectModel(ExpertReview.name)
    private readonly expertReviewModel: Model<ExpertReview>,
    @InjectModel(ConsensusReview.name)
    private readonly consensusReviewModel: Model<ConsensusReview>,
    @InjectModel(ProjectMaterial.name)
    private readonly projectMaterialModel: Model<ProjectMaterial>,
    @InjectModel(ProjectAppeal.name)
    private readonly projectAppealModel: Model<ProjectAppeal>,
  ) {}

  async getOverview(
    query: QueryClientDashboardOverviewDto,
  ): Promise<ClientDashboardOverviewResponse> {
    const { filters, items } = await this.buildDashboardItems(query);

    return {
      generatedAt: new Date(),
      filters,
      projectTotals: this.buildProjectTotals(items),
      funding: this.buildFundingTotals(items),
      expertReviewTotals: this.buildExpertReviewTotals(items),
      appealTotals: this.buildAppealTotals(items),
      breakdowns: this.buildBreakdowns(items),
    };
  }

  async listProjects(
    query: QueryClientDashboardProjectsDto,
  ): Promise<ClientDashboardProjectsResponse> {
    const { items } = await this.buildDashboardItems(query);
    const sortedItems = [...items].sort(compareProjectItems);
    const page = query.page;
    const pageSize = query.pageSize;
    const start = (page - 1) * pageSize;

    return {
      items: sortedItems.slice(start, start + pageSize).map(stripAppealStats),
      page,
      pageSize,
      total: sortedItems.length,
    };
  }

  private async buildDashboardItems(
    query: QueryClientDashboardOverviewDto,
  ): Promise<BuildItemsResult> {
    const filters = normalizeFilters(query);
    const projects = await this.findBaseProjects(query);
    const projectIds = projects.map((project) => project._id);

    if (projectIds.length === 0) {
      return { filters, items: [] };
    }

    const [assignments, expertReviews, consensusReviews, materials, appeals] =
      await Promise.all([
        this.assignmentModel
          .find({ projectId: { $in: projectIds }, status: 'assigned' })
          .lean<AssignmentLean[]>()
          .exec(),
        this.expertReviewModel
          .find({ projectId: { $in: projectIds }, status: 'submitted' })
          .lean<ExpertReviewLean[]>()
          .exec(),
        this.consensusReviewModel
          .find({ projectId: { $in: projectIds } })
          .lean<ConsensusReviewLean[]>()
          .exec(),
        this.projectMaterialModel
          .find({
            projectId: { $in: projectIds },
            status: 'submitted',
            $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
          })
          .lean<ProjectMaterialLean[]>()
          .exec(),
        this.projectAppealModel
          .find({ projectId: { $in: projectIds } })
          .lean<ProjectAppealLean[]>()
          .exec(),
      ]);

    const assignedCountByProjectId = countByProjectId(assignments);
    const submittedReviewCountByProjectId = countByProjectId(expertReviews);
    const submittedMaterialCountByProjectId = countByProjectId(materials);
    const consensusByProjectId = mapConsensusByProjectId(consensusReviews);
    const appealsByProjectId = groupAppealsByProjectId(appeals);

    return {
      filters,
      items: projects
        .map((project) =>
          this.buildProjectItem({
            project,
            assignedExpertCount:
              assignedCountByProjectId.get(project._id.toString()) ?? 0,
            submittedExpertReviewCount:
              submittedReviewCountByProjectId.get(project._id.toString()) ?? 0,
            submittedMaterialCount:
              submittedMaterialCountByProjectId.get(project._id.toString()) ??
              0,
            consensus: consensusByProjectId.get(project._id.toString()) ?? null,
            appeals: appealsByProjectId.get(project._id.toString()) ?? [],
          }),
        )
        .filter((item) => matchesDerivedFilters(item, filters)),
    };
  }

  private async findBaseProjects(
    query: QueryClientDashboardOverviewDto,
  ): Promise<ProjectLean[]> {
    const filter: ProjectBaseFilter = { isActive: true };
    const keyword = normalizeOptionalString(query.keyword);

    if (query.batchId) {
      filter.batchId = toObjectId(query.batchId, 'batchId');
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

    if (keyword) {
      const keywordRegExp = new RegExp(escapeRegExp(keyword), 'i');
      filter.$or = [{ projectNo: keywordRegExp }, { name: keywordRegExp }];
    }

    return this.projectModel.find(filter).lean<ProjectLean[]>().exec();
  }

  private buildProjectItem(input: {
    project: ProjectLean;
    assignedExpertCount: number;
    submittedExpertReviewCount: number;
    submittedMaterialCount: number;
    consensus: ConsensusReviewLean | null;
    appeals: ProjectAppealLean[];
  }): DashboardProjectItemWithAppealStats {
    const pendingAppealCount = input.appeals.filter((appeal) =>
      PROJECT_APPEAL_PENDING_STATUSES.includes(appeal.status),
    ).length;
    const metrics: ProjectDerivedMetrics = {
      assignedExpertCount: input.assignedExpertCount,
      submittedExpertReviewCount: input.submittedExpertReviewCount,
      submittedMaterialCount: input.submittedMaterialCount,
      appealTotalCount: input.appeals.length,
      pendingAppealCount,
    };
    const effectiveFinalLevel = resolveEffectiveFinalLevel(
      input.project,
      input.consensus,
    );
    const stages = resolveStages({
      project: input.project,
      metrics,
      consensus: input.consensus,
      effectiveFinalLevel: effectiveFinalLevel.value,
    });

    return {
      id: input.project._id.toString(),
      batchId: input.project.batchId.toString(),
      projectNo: input.project.projectNo,
      name: input.project.name,
      projectTypeId: objectIdToString(input.project.projectTypeId),
      statusId: objectIdToString(input.project.statusId),
      ownerUserId: objectIdToString(input.project.ownerUserId),
      leadOrganizationId: objectIdToString(input.project.leadOrganizationId),
      cooperationOrganizationIds: objectIdArrayToStrings(
        input.project.cooperationOrganizationIds,
      ),
      totalFunding: normalizeNumber(input.project.totalFunding),
      allocatedFunding: normalizeNumber(input.project.allocatedFunding),
      disciplineIds: objectIdArrayToStrings(input.project.disciplineIds),
      departmentId: objectIdToString(input.project.departmentId),
      reviewManagerId: objectIdToString(input.project.reviewManagerId),
      reviewSchemeId: objectIdToString(input.project.reviewSchemeId),
      reviewTime: input.project.reviewTime ?? null,
      reviewLocation: normalizeString(input.project.reviewLocation),
      meetingUrl: normalizeString(input.project.meetingUrl),
      finalLevel: normalizeString(input.project.finalLevel),
      originalLevel: normalizeString(input.project.originalLevel),
      effectiveFinalLevel: effectiveFinalLevel.value,
      effectiveFinalLevelSource: effectiveFinalLevel.source,
      primaryStage: resolvePrimaryStage(stages),
      stages,
      metrics,
      consensus: {
        status: input.consensus?.status ?? null,
        finalScore: normalizeNumber(input.consensus?.finalScore),
        finalLevel: normalizeString(input.consensus?.finalLevel),
        confirmedAt: input.consensus?.confirmedAt ?? null,
      },
      latestAppeal: resolveLatestAppeal(input.appeals),
      createdAt: input.project.createdAt,
      updatedAt: input.project.updatedAt,
      appealStatusCounts: countAppealStatuses(input.appeals),
      levelChangedAppealCount: input.appeals.filter(
        (appeal) => appeal.causedLevelChange,
      ).length,
    };
  }

  private buildProjectTotals(items: DashboardProjectItemWithAppealStats[]) {
    return {
      totalProjects: items.length,
      withReviewManager: items.filter((item) => item.reviewManagerId).length,
      withReviewScheme: items.filter((item) => item.reviewSchemeId).length,
      scheduled: items.filter(isScheduled).length,
      withMeetingUrl: items.filter(hasMeetingUrl).length,
      withAssignedExperts: items.filter(
        (item) => item.metrics.assignedExpertCount > 0,
      ).length,
      withSubmittedMaterials: items.filter(
        (item) => item.metrics.submittedMaterialCount > 0,
      ).length,
      expertReviewsStarted: items.filter((item) =>
        item.stages.includes('expert_reviews_started'),
      ).length,
      expertReviewsCompleted: items.filter((item) =>
        item.stages.includes('expert_reviews_completed'),
      ).length,
      consensusDraft: items.filter((item) =>
        item.stages.includes('consensus_draft'),
      ).length,
      consensusConfirmed: items.filter((item) =>
        item.stages.includes('consensus_confirmed'),
      ).length,
      withFinalLevel: items.filter((item) => item.effectiveFinalLevel).length,
      withPendingAppeal: items.filter(
        (item) => item.metrics.pendingAppealCount > 0,
      ).length,
    };
  }

  private buildFundingTotals(items: DashboardProjectItemWithAppealStats[]) {
    const totalFunding = sumNumbers(items.map((item) => item.totalFunding));
    const allocatedFunding = sumNumbers(
      items.map((item) => item.allocatedFunding),
    );

    return {
      totalFunding,
      allocatedFunding,
      allocationRate: totalFunding > 0 ? allocatedFunding / totalFunding : 0,
    };
  }

  private buildExpertReviewTotals(
    items: DashboardProjectItemWithAppealStats[],
  ) {
    const assignedExpertCount = sumNumbers(
      items.map((item) => item.metrics.assignedExpertCount),
    );
    const submittedExpertReviewCount = sumNumbers(
      items.map((item) => item.metrics.submittedExpertReviewCount),
    );

    return {
      assignedExpertCount,
      submittedExpertReviewCount,
      submissionRate:
        assignedExpertCount > 0
          ? submittedExpertReviewCount / assignedExpertCount
          : 0,
    };
  }

  private buildAppealTotals(items: DashboardProjectItemWithAppealStats[]) {
    const totalAppeals = sumNumbers(
      items.map((item) => item.metrics.appealTotalCount),
    );
    const pendingAppeals = sumNumbers(
      items.map((item) => item.metrics.pendingAppealCount),
    );

    return {
      totalAppeals,
      pendingAppeals,
      acceptedAppeals: countAppealsByStatus(items, 'accepted'),
      rejectedAppeals: countAppealsByStatus(items, 'rejected'),
      canceledAppeals: countAppealsByStatus(items, 'canceled'),
      levelChangedAppeals: sumNumbers(
        items.map((item) => item.levelChangedAppealCount),
      ),
    };
  }

  private buildBreakdowns(items: DashboardProjectItemWithAppealStats[]) {
    return {
      byBatch: countNullableId(items, 'batchId', 'batchId'),
      byProjectType: countNullableId(items, 'projectTypeId', 'projectTypeId'),
      byStatus: countNullableId(items, 'statusId', 'statusId'),
      byDepartment: countNullableId(items, 'departmentId', 'departmentId'),
      byFinalLevel: countFinalLevels(items),
      byProgressStage: CLIENT_DASHBOARD_PROGRESS_STAGES.map((stage) => ({
        stage,
        count: items.filter((item) => item.stages.includes(stage)).length,
      })),
    };
  }
}

function normalizeFilters(
  query: QueryClientDashboardOverviewDto,
): ClientDashboardFilters {
  return {
    batchId: normalizeOptionalString(query.batchId),
    projectTypeId: normalizeOptionalString(query.projectTypeId),
    statusId: normalizeOptionalString(query.statusId),
    departmentId: normalizeOptionalString(query.departmentId),
    disciplineId: normalizeOptionalString(query.disciplineId),
    reviewManagerId: normalizeOptionalString(query.reviewManagerId),
    reviewSchemeId: normalizeOptionalString(query.reviewSchemeId),
    finalLevel: normalizeOptionalString(query.finalLevel),
    progressStage: query.progressStage ?? null,
    hasMeetingUrl: query.hasMeetingUrl ?? null,
    hasPendingAppeal: query.hasPendingAppeal ?? null,
    keyword: normalizeOptionalString(query.keyword),
  };
}

function matchesDerivedFilters(
  item: ClientDashboardProjectItem,
  filters: ClientDashboardFilters,
): boolean {
  if (filters.finalLevel && item.effectiveFinalLevel !== filters.finalLevel) {
    return false;
  }

  if (filters.progressStage && !item.stages.includes(filters.progressStage)) {
    return false;
  }

  if (
    filters.hasMeetingUrl !== null &&
    hasMeetingUrl(item) !== filters.hasMeetingUrl
  ) {
    return false;
  }

  if (
    filters.hasPendingAppeal !== null &&
    item.metrics.pendingAppealCount > 0 !== filters.hasPendingAppeal
  ) {
    return false;
  }

  return true;
}

function resolveEffectiveFinalLevel(
  project: ProjectLean,
  consensus: ConsensusReviewLean | null,
): { value: string; source: EffectiveFinalLevelSource | null } {
  const projectFinalLevel = normalizeString(project.finalLevel);

  if (projectFinalLevel) {
    return { value: projectFinalLevel, source: 'project_final_level' };
  }

  if (consensus?.status === 'confirmed') {
    const consensusFinalLevel = normalizeString(consensus.finalLevel);

    if (consensusFinalLevel) {
      return { value: consensusFinalLevel, source: 'confirmed_consensus' };
    }
  }

  return { value: '', source: null };
}

function resolveStages(input: {
  project: ProjectLean;
  metrics: ProjectDerivedMetrics;
  consensus: ConsensusReviewLean | null;
  effectiveFinalLevel: string;
}): ClientDashboardProgressStage[] {
  const stages: ClientDashboardProgressStage[] = ['imported'];
  const expertReviewsCompleted =
    input.metrics.assignedExpertCount > 0 &&
    input.metrics.submittedExpertReviewCount >=
      input.metrics.assignedExpertCount;

  if (input.project.reviewManagerId || input.project.reviewSchemeId) {
    stages.push('review_assigned');
  }

  if (isScheduled(input.project)) {
    stages.push('scheduled');
  }

  if (input.metrics.assignedExpertCount > 0) {
    stages.push('experts_assigned');
  }

  if (input.metrics.submittedMaterialCount > 0) {
    stages.push('materials_submitted');
  }

  if (input.metrics.submittedExpertReviewCount > 0 && !expertReviewsCompleted) {
    stages.push('expert_reviews_started');
  }

  if (expertReviewsCompleted) {
    stages.push('expert_reviews_completed');
  }

  if (
    input.consensus?.status === 'draft' ||
    input.consensus?.status === 'reopened'
  ) {
    stages.push('consensus_draft');
  }

  if (input.consensus?.status === 'confirmed') {
    stages.push('consensus_confirmed');
  }

  if (input.effectiveFinalLevel) {
    stages.push('final_level_set');
  }

  if (input.metrics.pendingAppealCount > 0) {
    stages.push('appeal_pending');
  }

  return stages;
}

function resolvePrimaryStage(
  stages: ClientDashboardProgressStage[],
): ClientDashboardProgressStage {
  for (const stage of CLIENT_DASHBOARD_PRIMARY_STAGE_PRIORITY) {
    if (stages.includes(stage)) {
      return stage;
    }
  }

  return 'imported';
}

function resolveLatestAppeal(
  appeals: ProjectAppealLean[],
): ClientDashboardProjectItem['latestAppeal'] {
  const latestAppeal = [...appeals].sort(compareAppealsDesc)[0];

  if (!latestAppeal) {
    return null;
  }

  return {
    appealNo: latestAppeal.appealNo,
    status: latestAppeal.status,
    createdAt: latestAppeal.createdAt,
    handledAt: latestAppeal.handledAt ?? null,
  };
}

function mapConsensusByProjectId(
  consensusReviews: ConsensusReviewLean[],
): Map<string, ConsensusReviewLean> {
  const result = new Map<string, ConsensusReviewLean>();

  for (const status of CONSENSUS_REVIEW_STATUSES) {
    for (const consensus of consensusReviews) {
      const projectId = consensus.projectId.toString();

      if (!result.has(projectId) && consensus.status === status) {
        result.set(projectId, consensus);
      }
    }
  }

  return result;
}

function groupAppealsByProjectId(
  appeals: ProjectAppealLean[],
): Map<string, ProjectAppealLean[]> {
  const result = new Map<string, ProjectAppealLean[]>();

  for (const appeal of appeals) {
    const projectId = appeal.projectId.toString();
    const items = result.get(projectId) ?? [];
    items.push(appeal);
    result.set(projectId, items);
  }

  return result;
}

function countByProjectId(
  items: Array<{ projectId: Types.ObjectId }>,
): Map<string, number> {
  const result = new Map<string, number>();

  for (const item of items) {
    const projectId = item.projectId.toString();
    result.set(projectId, (result.get(projectId) ?? 0) + 1);
  }

  return result;
}

function countNullableId<
  TKey extends 'batchId' | 'projectTypeId' | 'statusId' | 'departmentId',
>(
  items: ClientDashboardProjectItem[],
  itemKey: TKey,
  responseKey: TKey,
): Array<Record<TKey, string | null> & { count: number }> {
  const counts = new Map<string, { value: string | null; count: number }>();

  for (const item of items) {
    const value = item[itemKey];
    const key = value ?? '';
    const current = counts.get(key);
    counts.set(key, {
      value,
      count: (current?.count ?? 0) + 1,
    });
  }

  return [...counts.values()].map((item) => ({
    [responseKey]: item.value,
    count: item.count,
  })) as Array<Record<TKey, string | null> & { count: number }>;
}

function countFinalLevels(
  items: DashboardProjectItemWithAppealStats[],
): Array<{ finalLevel: string; count: number }> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const finalLevel = item.effectiveFinalLevel || '其他';
    counts.set(finalLevel, (counts.get(finalLevel) ?? 0) + 1);
  }

  return [...counts.entries()].map(([finalLevel, count]) => ({
    finalLevel,
    count,
  }));
}

function countAppealsByStatus(
  items: DashboardProjectItemWithAppealStats[],
  status: ProjectAppealStatus,
): number {
  return sumNumbers(items.map((item) => item.appealStatusCounts[status]));
}

function countAppealStatuses(
  appeals: ProjectAppealLean[],
): Record<ProjectAppealStatus, number> {
  const counts: Record<ProjectAppealStatus, number> = {
    submitted: 0,
    processing: 0,
    accepted: 0,
    rejected: 0,
    canceled: 0,
  };

  for (const appeal of appeals) {
    counts[appeal.status] += 1;
  }

  return counts;
}

function stripAppealStats(
  item: DashboardProjectItemWithAppealStats,
): ClientDashboardProjectItem {
  return {
    id: item.id,
    batchId: item.batchId,
    projectNo: item.projectNo,
    name: item.name,
    projectTypeId: item.projectTypeId,
    statusId: item.statusId,
    ownerUserId: item.ownerUserId,
    leadOrganizationId: item.leadOrganizationId,
    cooperationOrganizationIds: item.cooperationOrganizationIds,
    totalFunding: item.totalFunding,
    allocatedFunding: item.allocatedFunding,
    disciplineIds: item.disciplineIds,
    departmentId: item.departmentId,
    reviewManagerId: item.reviewManagerId,
    reviewSchemeId: item.reviewSchemeId,
    reviewTime: item.reviewTime,
    reviewLocation: item.reviewLocation,
    meetingUrl: item.meetingUrl,
    finalLevel: item.finalLevel,
    originalLevel: item.originalLevel,
    effectiveFinalLevel: item.effectiveFinalLevel,
    effectiveFinalLevelSource: item.effectiveFinalLevelSource,
    primaryStage: item.primaryStage,
    stages: item.stages,
    metrics: item.metrics,
    consensus: item.consensus,
    latestAppeal: item.latestAppeal,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function isScheduled(value: ProjectLean | ClientDashboardProjectItem): boolean {
  return Boolean(
    value.reviewTime ||
    normalizeString(value.reviewLocation) ||
    normalizeString(value.meetingUrl),
  );
}

function hasMeetingUrl(
  value: ProjectLean | ClientDashboardProjectItem,
): boolean {
  return Boolean(normalizeString(value.meetingUrl));
}

function compareProjectItems(
  left: ClientDashboardProjectItem,
  right: ClientDashboardProjectItem,
): number {
  const leftReviewTime = left.reviewTime?.getTime() ?? null;
  const rightReviewTime = right.reviewTime?.getTime() ?? null;

  if (leftReviewTime !== null && rightReviewTime !== null) {
    if (leftReviewTime !== rightReviewTime) {
      return leftReviewTime - rightReviewTime;
    }
  } else if (leftReviewTime !== null) {
    return -1;
  } else if (rightReviewTime !== null) {
    return 1;
  }

  return right.createdAt.getTime() - left.createdAt.getTime();
}

function compareAppealsDesc(
  left: ProjectAppealLean,
  right: ProjectAppealLean,
): number {
  const createdAtDiff = right.createdAt.getTime() - left.createdAt.getTime();

  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return right.appealNo - left.appealNo;
}

function objectIdToString(value?: Types.ObjectId | null): string | null {
  return value ? value.toString() : null;
}

function objectIdArrayToStrings(values?: Types.ObjectId[]): string[] {
  return (values ?? []).map((value) => value.toString());
}

function normalizeOptionalString(value?: string): string | null {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeString(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sumNumbers(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

import { PaginatedResponse } from '../../../common/dto/pagination-query.dto';
import {
  ClientDashboardProgressStage,
  EffectiveFinalLevelSource,
} from '../constants/client-dashboard.constants';

export type ClientDashboardFilters = {
  batchId: string | null;
  projectTypeId: string | null;
  statusId: string | null;
  departmentId: string | null;
  disciplineId: string | null;
  reviewManagerId: string | null;
  reviewSchemeId: string | null;
  finalLevel: string | null;
  progressStage: ClientDashboardProgressStage | null;
  hasMeetingUrl: boolean | null;
  hasPendingAppeal: boolean | null;
  keyword: string | null;
};

export type ClientDashboardProjectMetrics = {
  assignedExpertCount: number;
  submittedExpertReviewCount: number;
  submittedMaterialCount: number;
  appealTotalCount: number;
  pendingAppealCount: number;
};

export type ClientDashboardProjectConsensus = {
  status: 'draft' | 'confirmed' | 'reopened' | null;
  finalScore: number;
  finalLevel: string;
  confirmedAt: Date | null;
};

export type ClientDashboardLatestAppeal = {
  appealNo: number;
  status: 'submitted' | 'processing' | 'accepted' | 'rejected' | 'canceled';
  createdAt: Date;
  handledAt: Date | null;
};

export type ClientDashboardProjectItem = {
  id: string;
  batchId: string;
  projectNo: string;
  name: string;
  projectTypeId: string | null;
  statusId: string | null;
  ownerUserId: string | null;
  leadOrganizationId: string | null;
  cooperationOrganizationIds: string[];
  totalFunding: number;
  allocatedFunding: number;
  disciplineIds: string[];
  departmentId: string | null;
  reviewManagerId: string | null;
  reviewSchemeId: string | null;
  reviewTime: Date | null;
  reviewLocation: string;
  meetingUrl: string;
  finalLevel: string;
  originalLevel: string;
  effectiveFinalLevel: string;
  effectiveFinalLevelSource: EffectiveFinalLevelSource | null;
  primaryStage: ClientDashboardProgressStage;
  stages: ClientDashboardProgressStage[];
  metrics: ClientDashboardProjectMetrics;
  consensus: ClientDashboardProjectConsensus;
  latestAppeal: ClientDashboardLatestAppeal | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientDashboardOverviewResponse = {
  generatedAt: Date;
  filters: ClientDashboardFilters;
  projectTotals: {
    totalProjects: number;
    withReviewManager: number;
    withReviewScheme: number;
    scheduled: number;
    withMeetingUrl: number;
    withAssignedExperts: number;
    withSubmittedMaterials: number;
    expertReviewsStarted: number;
    expertReviewsCompleted: number;
    consensusDraft: number;
    consensusConfirmed: number;
    withFinalLevel: number;
    withPendingAppeal: number;
  };
  funding: {
    totalFunding: number;
    allocatedFunding: number;
    allocationRate: number;
  };
  expertReviewTotals: {
    assignedExpertCount: number;
    submittedExpertReviewCount: number;
    submissionRate: number;
  };
  appealTotals: {
    totalAppeals: number;
    pendingAppeals: number;
    acceptedAppeals: number;
    rejectedAppeals: number;
    canceledAppeals: number;
    levelChangedAppeals: number;
  };
  breakdowns: {
    byBatch: Array<{ batchId: string | null; count: number }>;
    byProjectType: Array<{ projectTypeId: string | null; count: number }>;
    byStatus: Array<{ statusId: string | null; count: number }>;
    byDepartment: Array<{ departmentId: string | null; count: number }>;
    byFinalLevel: Array<{ finalLevel: string; count: number }>;
    byProgressStage: Array<{
      stage: ClientDashboardProgressStage;
      count: number;
    }>;
  };
};

export type ClientDashboardProjectsResponse =
  PaginatedResponse<ClientDashboardProjectItem>;

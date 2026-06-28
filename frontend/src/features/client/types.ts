import type { PaginatedResponse, QueryParams } from '@/src/lib/api/types';

export type ClientDashboardProgressStage =
  | 'imported'
  | 'review_assigned'
  | 'scheduled'
  | 'experts_assigned'
  | 'materials_submitted'
  | 'expert_reviews_started'
  | 'expert_reviews_completed'
  | 'consensus_draft'
  | 'consensus_confirmed'
  | 'final_level_set'
  | 'appeal_pending';

export type EffectiveFinalLevelSource =
  | 'confirmed_consensus'
  | 'project_final_level';

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
  status: 'confirmed' | 'draft' | 'reopened' | null;
  finalScore: number | null;
  finalLevel: string | null;
  confirmedAt: string | null;
};

export type ClientDashboardLatestAppeal = {
  appealNo: number;
  status: 'accepted' | 'canceled' | 'processing' | 'rejected' | 'submitted';
  createdAt: string | null;
  handledAt: string | null;
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
  totalFunding: number | null;
  allocatedFunding: number | null;
  disciplineIds: string[];
  departmentId: string | null;
  reviewManagerId: string | null;
  reviewSchemeId: string | null;
  reviewTime: string | null;
  reviewLocation: string | null;
  meetingUrl: string | null;
  finalLevel: string | null;
  originalLevel: string | null;
  effectiveFinalLevel: string | null;
  effectiveFinalLevelSource: EffectiveFinalLevelSource | null;
  primaryStage: ClientDashboardProgressStage;
  stages: ClientDashboardProgressStage[];
  metrics: ClientDashboardProjectMetrics;
  consensus: ClientDashboardProjectConsensus;
  latestAppeal: ClientDashboardLatestAppeal | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ClientDashboardOverviewResponse = {
  generatedAt: string | null;
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
    byFinalLevel: Array<{ finalLevel: string | null; count: number }>;
    byProgressStage: Array<{
      stage: ClientDashboardProgressStage;
      count: number;
    }>;
  };
};

export type ClientDashboardProjectsResponse =
  PaginatedResponse<ClientDashboardProjectItem>;

export type QueryClientDashboardParams = QueryParams & {
  batchId?: string;
  projectTypeId?: string;
  statusId?: string;
  departmentId?: string;
  disciplineId?: string;
  reviewManagerId?: string;
  reviewSchemeId?: string;
  finalLevel?: string;
  progressStage?: ClientDashboardProgressStage;
  hasMeetingUrl?: boolean;
  hasPendingAppeal?: boolean;
  keyword?: string;
};

export type QueryClientDashboardProjectsParams = QueryClientDashboardParams & {
  page?: number;
  pageSize?: number;
};

export type PortalListResponse<T> = {
  items: T[];
};

export type PortalDictionarySummary = {
  id: string;
  dictType: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type PortalTreeDictionarySummary = {
  id: string;
  treeType: string;
  parentId?: string | null;
  code: string;
  name: string;
  fullName?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type PortalBatchSummary = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PortalOrganizationSummary = {
  id: string;
  name: string;
  regionId?: string | null;
  isActive: boolean;
};

export type PortalReviewSchemeSummary = {
  id: string;
  name: string;
  totalScore?: number | null;
  isActive: boolean;
};

export type PortalUserSummary = {
  id: string;
  name: string;
  phone?: string | null;
  roles: string[];
  organizationIds: string[];
  disciplineIds: string[];
  isActive: boolean;
};

export type ClientReferenceData = {
  batches: PortalBatchSummary[];
  dictionaries: PortalDictionarySummary[];
  organizations: PortalOrganizationSummary[];
  projectOwners: PortalUserSummary[];
  projectStatuses: PortalDictionarySummary[];
  reviewLevels: PortalDictionarySummary[];
  reviewManagers: PortalUserSummary[];
  reviewSchemes: PortalReviewSchemeSummary[];
  treeDictionaries: PortalTreeDictionarySummary[];
};

export type ClientLookupMaps = {
  batchNameById: Map<string, string>;
  dictionaryNameById: Map<string, string>;
  organizationNameById: Map<string, string>;
  reviewLevelLabelByValue: Map<string, string>;
  reviewSchemeNameById: Map<string, string>;
  treeNameById: Map<string, string>;
  userNameById: Map<string, string>;
};

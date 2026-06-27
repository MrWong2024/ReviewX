import type { QueryParams } from '@/src/lib/api/types';
import type {
  HandleProjectAppealInput,
  ProjectAppeal,
  ProjectAppealAttachment,
  ProjectAppealAttachmentDownloadUrlResponse,
  ProjectAppealDetail,
} from '@/src/lib/project-appeals/types';

export type {
  HandleProjectAppealInput,
  ProjectAppeal,
  ProjectAppealAttachment,
  ProjectAppealAttachmentDownloadUrlResponse,
  ProjectAppealDetail,
};

export type HandleReviewManagerAppealInput = HandleProjectAppealInput;

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
  sortOrder: number;
  isActive: boolean;
};

export type PortalBatchSummary = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  totalScore?: number;
  isActive: boolean;
};

export type PortalUserSummary = {
  id: string;
  name: string;
  phone?: string;
  roles: string[];
  organizationIds: string[];
  disciplineIds: string[];
  isActive: boolean;
};

export type ReviewManagerReferenceData = {
  batches: PortalBatchSummary[];
  dictionaries: PortalDictionarySummary[];
  organizations: PortalOrganizationSummary[];
  projectOwners: PortalUserSummary[];
  reviewManagers: PortalUserSummary[];
  projectStatuses: PortalDictionarySummary[];
  reviewLevels: PortalDictionarySummary[];
  reviewSchemes: PortalReviewSchemeSummary[];
  treeDictionaries: PortalTreeDictionarySummary[];
};

export type ReviewManagerLookupMaps = {
  batchNameById: Map<string, string>;
  dictionaryNameById: Map<string, string>;
  organizationNameById: Map<string, string>;
  reviewLevelLabelByValue: Map<string, string>;
  reviewSchemeNameById: Map<string, string>;
  treeNameById: Map<string, string>;
  userNameById: Map<string, string>;
};

export type ReviewSchemeSnapshotItem = {
  name: string;
  maxScore: number;
  scoringGuide?: string;
  sortOrder: number;
  suggestionRequiredThresholdRatio?: number;
};

export type ReviewSchemeSnapshot = {
  id?: string;
  name?: string;
  totalScore: number;
  items: ReviewSchemeSnapshotItem[];
};

export type ReviewManagerProjectListItem = {
  allocatedFunding?: number | null;
  batchId: string;
  cooperationOrganizationIds: string[];
  createdAt: string;
  departmentId?: string | null;
  disciplineIds: string[];
  finalLevel?: string;
  followUpNeeds?: string;
  id: string;
  importedFromJobId?: string;
  isActive: boolean;
  leadOrganizationId?: string | null;
  meetingUrl?: string;
  name: string;
  originalLevel?: string;
  ownerUserId?: string | null;
  projectNo: string;
  projectTypeId?: string | null;
  reviewLocation?: string;
  reviewManagerId?: string | null;
  reviewSchemeId?: string | null;
  reviewSchemeSnapshot?: ReviewSchemeSnapshot | Record<string, unknown> | null;
  reviewTime?: string | null;
  statusId?: string | null;
  totalFunding?: number | null;
  updatedAt: string;
};

export type ReviewManagerProjectsResponse = {
  items: ReviewManagerProjectListItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type QueryReviewManagerProjectsParams = QueryParams & {
  batchId?: string;
  isActive?: boolean;
  keyword?: string;
  page?: number;
  pageSize?: number;
  reviewSchemeId?: string;
  statusId?: string;
};

export type ExpertReviewViewStatus =
  | 'draft'
  | 'not_started'
  | 'returned'
  | 'submitted';

export type ExpertBasicSummary = {
  id: string;
  phone: string;
  name: string;
  organizationIds: string[];
  organizationNames?: string[];
  disciplineIds: string[];
};

export type ReviewManagerAssignmentReviewStatus =
  | 'draft'
  | 'returned'
  | 'submitted';

export type ReviewManagerExpertCandidate = {
  id: string;
  phone: string;
  name: string;
  organizationIds: string[];
  disciplineIds: string[];
  assigned?: boolean;
  hasReviewRecord?: boolean;
  reviewStatus?: ReviewManagerAssignmentReviewStatus | null;
};

export type ReviewManagerExpertCandidatePage = {
  items: ReviewManagerExpertCandidate[];
  page: number;
  pageSize: number;
  total: number;
  reason?: string;
};

export type ReviewManagerAssignedExpert = {
  id: string;
  phone: string;
  name: string;
  organizationIds: string[];
  disciplineIds: string[];
  assigned?: boolean;
  hasReviewRecord?: boolean;
  reviewStatus?: ReviewManagerAssignmentReviewStatus | null;
};

export type AppendReviewManagerProjectExpertsInput = {
  expertUserIds: string[];
};

export type UpdateReviewManagerProjectExpertsInput = {
  expertUserIds: string[];
};

export type ReviewManagerProjectExpertFailure = {
  expertUserId: string;
  reasons: string[];
  detail?: Record<string, unknown>;
};

export type AppendReviewManagerProjectExpertsResult = {
  assignedExperts: ReviewManagerAssignedExpert[];
  successCount: number;
  failedCount: number;
  failures: ReviewManagerProjectExpertFailure[];
};

export type ReplaceReviewManagerProjectExpertsResult = {
  assignedExperts: ReviewManagerAssignedExpert[];
  addedOrRestoredCount: number;
  removedCount: number;
};

export type RemoveReviewManagerProjectExpertResult = {
  removed: boolean;
  alreadyRemoved: boolean;
};

export type ListReviewManagerExpertCandidatesParams = QueryParams & {
  keyword?: string;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
};

export type ExpertReviewListItem = {
  expert: ExpertBasicSummary;
  assignmentId?: string | null;
  status: ExpertReviewViewStatus;
  totalScore?: number | null;
  submittedAt?: string | null;
  returnedAt?: string | null;
};

export type ExpertReviewItem = {
  itemSnapshot: ReviewSchemeSnapshotItem;
  score?: number | null;
  evaluationDescription: string;
  improvementSuggestion: string;
  hasMajorIssue: boolean;
};

export type ExpertReviewDetail = {
  id?: string;
  projectId: string;
  expertUserId: string;
  assignmentId?: string | null;
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  items: ExpertReviewItem[];
  totalScore: number;
  status: ExpertReviewViewStatus;
  submittedAt?: string | null;
  returnedAt?: string | null;
  returnedByUserId?: string | null;
  returnReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PerItemAverageScore = {
  name: string;
  sortOrder: number;
  maxScore: number;
  averageScore: number | null;
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

export type ConsensusReviewStatus = 'confirmed' | 'draft' | 'reopened';

export type ConsensusDraftSource = 'ai' | 'manual' | 'rule_based';

export type ConsensusUserSummary = {
  id: string;
  name: string;
  phone?: string | null;
};

export type ConsensusReviewResponse = {
  id: string;
  projectId: string;
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  draftGeneratedAt?: string | null;
  draftGeneratedByUserId?: string | null;
  draftSource: ConsensusDraftSource;
  draftOpinion?: string;
  draftScore?: number | null;
  finalOpinion?: string;
  finalScore?: number | null;
  finalLevel?: string;
  originalLevel?: string;
  confirmedByUserId?: string | null;
  confirmedAt?: string | null;
  confirmedByUser?: ConsensusUserSummary | null;
  status: ConsensusReviewStatus;
  expertReviewStats: {
    expertCount: number;
    submittedCount: number;
    averageScore?: number | null;
    minScore?: number | null;
    maxScore?: number | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type GenerateConsensusDraftOptions = {
  force?: boolean;
};

export type ConfirmConsensusReviewPayload = {
  finalOpinion: string;
  finalScore: number;
  finalLevel: string;
};

export type ReviewManagerProjectSchedulePayload = {
  meetingUrl?: string;
  reviewLocation?: string;
  reviewTime?: string;
};

export type ReviewManagerProjectMaterialStatus =
  | 'active'
  | 'deleted'
  | 'draft'
  | 'submitted';

export type ReviewManagerProjectMaterialTypeSummary = {
  code?: string;
  id: string;
  name: string;
  sortOrder?: number;
};

export type ReviewManagerProjectMaterialUploadedBy = {
  id: string;
  name: string;
  phone?: string;
};

export type ReviewManagerProjectMaterialListItem = {
  createdAt: string;
  extension?: string;
  id: string;
  materialType?: ReviewManagerProjectMaterialTypeSummary | null;
  materialTypeId: string;
  mimeType?: string;
  originalFilename?: string;
  projectId: string;
  remark?: string | null;
  safeFilename?: string;
  sizeBytes: number;
  status: ReviewManagerProjectMaterialStatus;
  submittedAt?: string | null;
  submittedByUserId?: string | null;
  updatedAt?: string;
  uploadedByUser?: ReviewManagerProjectMaterialUploadedBy | null;
  uploadedByUserId?: string | null;
};

export type ReviewManagerProjectMaterialDownloadUrlResult =
  | string
  | {
      downloadUrl?: string;
      expiresAt?: string;
      filename?: string;
      url?: string;
    };

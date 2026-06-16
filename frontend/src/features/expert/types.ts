import type { QueryParams } from '@/src/lib/api/types';

export type ExpertReviewStatus = 'draft' | 'submitted' | 'returned';
export type ExpertReviewViewStatus = 'not_started' | ExpertReviewStatus;

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

export type ExpertReviewItem = {
  itemSnapshot: ReviewSchemeSnapshotItem;
  score?: number | null;
  evaluationDescription: string;
  improvementSuggestion: string;
  hasMajorIssue: boolean;
};

export type ExpertReview = {
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

export type ExpertReviewProjectSummary = {
  id: string;
  batchId: string;
  projectNo: string;
  name: string;
  statusId?: string | null;
  reviewManagerId?: string | null;
  reviewSchemeId?: string | null;
  reviewTime?: string | null;
  reviewLocation?: string;
  meetingUrl?: string;
  followUpNeeds?: string;
};

export type ExpertReviewTask = {
  project: ExpertReviewProjectSummary;
  assignmentId: string;
  materialCount: number;
  status: ExpertReviewViewStatus;
  totalScore?: number | null;
  submittedAt?: string | null;
  returnedAt?: string | null;
};

export type ExpertReviewTaskDetail = {
  project: ExpertReviewProjectSummary;
  materialCount: number;
  materials?: ExpertMaterialSummary[];
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  review: ExpertReview;
};

export type ExpertMaterialTypeSummary = {
  id: string;
  name: string;
  code?: string;
  sortOrder?: number;
};

export type ExpertMaterial = {
  id: string;
  materialTypeId: string;
  materialType?: ExpertMaterialTypeSummary | null;
  originalFilename: string;
  safeFilename?: string;
  mimeType?: string;
  extension?: string;
  sizeBytes: number;
  remark?: string | null;
  createdAt: string;
};

export type ExpertMaterialSummary = ExpertMaterial;

export type ExpertMaterialDownloadUrlResponse =
  | string
  | {
      downloadUrl?: string;
      expiresAt?: string;
      expiresInSeconds?: number;
      url?: string;
    };

export type ExpertReviewItemInput = {
  name?: string;
  score?: number;
  evaluationDescription?: string;
  improvementSuggestion?: string;
  hasMajorIssue?: boolean;
};

export type SaveExpertReviewInput = {
  items?: ExpertReviewItemInput[];
};

export type QueryExpertReviewTasksParams = QueryParams & {
  page?: number;
  pageSize?: number;
  batchId?: string;
  status?: ExpertReviewViewStatus;
  reviewManagerId?: string;
  reviewSchemeId?: string;
};

export type QueryExpertProjectMaterialsParams = QueryParams & {
  materialTypeId?: string;
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

export type ExpertReferenceData = {
  batches: PortalBatchSummary[];
  dictionaries: PortalDictionarySummary[];
  materialTypes: PortalDictionarySummary[];
  organizations: PortalOrganizationSummary[];
  projectStatuses: PortalDictionarySummary[];
  reviewManagers: PortalUserSummary[];
  reviewSchemes: PortalReviewSchemeSummary[];
  treeDictionaries: PortalTreeDictionarySummary[];
};

export type ExpertLookupMaps = {
  batchNameById: Map<string, string>;
  dictionaryNameById: Map<string, string>;
  materialTypeNameById: Map<string, string>;
  organizationNameById: Map<string, string>;
  reviewSchemeNameById: Map<string, string>;
  treeNameById: Map<string, string>;
  userNameById: Map<string, string>;
};

import type { QueryParams } from '@/src/lib/api/types';
import type {
  CreateProjectAppealInput,
  DeleteProjectAppealAttachmentResult,
  ProjectAppeal,
  ProjectAppealAttachment,
  ProjectAppealAttachmentDownloadUrlResponse,
  ProjectAppealAttachmentUploadResult,
  ProjectAppealDetail,
  ProjectLevelChangeLog,
  ProjectOwnerConsensus,
  ReviewLevelOption,
  UploadProjectAppealAttachmentsInput,
} from '@/src/lib/project-appeals/types';

export type {
  CreateProjectAppealInput,
  DeleteProjectAppealAttachmentResult,
  ProjectAppeal,
  ProjectAppealAttachment,
  ProjectAppealAttachmentDownloadUrlResponse,
  ProjectAppealAttachmentUploadResult,
  ProjectAppealDetail,
  ProjectLevelChangeLog,
  ProjectOwnerConsensus,
  ReviewLevelOption,
  UploadProjectAppealAttachmentsInput,
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

export type ProjectOwnerReferenceData = {
  batches: PortalBatchSummary[];
  dictionaries: PortalDictionarySummary[];
  materialTypes: PortalDictionarySummary[];
  organizations: PortalOrganizationSummary[];
  projectStatuses: PortalDictionarySummary[];
  reviewLevels: PortalDictionarySummary[];
  reviewManagers: PortalUserSummary[];
  reviewSchemes: PortalReviewSchemeSummary[];
  treeDictionaries: PortalTreeDictionarySummary[];
};

export type ProjectOwnerProject = {
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
  finalLevel?: string;
  reviewManagerId?: string | null;
  reviewSchemeId?: string | null;
  reviewTime?: string | null;
  reviewLocation?: string;
  meetingUrl?: string;
  originalLevel?: string;
  followUpNeeds?: string;
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  isActive: boolean;
  materialCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateFollowUpNeedsInput = {
  followUpNeeds: string;
};

export type MaterialTypeSummary = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
};

export type ProjectMaterialStatus =
  | 'draft'
  | 'submitted'
  | 'active'
  | 'deleted';

export type MaterialStatusView = {
  description: string;
  label: string;
  tone: 'primary' | 'warning' | 'success' | 'muted' | 'danger';
};

export type ProjectMaterial = {
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
  submittedAt?: string | null;
  submittedByUserId?: string | null;
  deletedAt?: string | null;
  deletedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadProjectMaterialsInput = {
  projectId: string;
  materialTypeId: string;
  files: File[];
  remark?: string;
};

export type UploadProjectMaterialsResult = {
  materials: ProjectMaterial[];
  successCount: number;
  failedCount: number;
  failures: Array<{
    originalFilename: string;
    message: string;
  }>;
};

export type SubmitProjectMaterialsInput = {
  materialIds?: string[];
};

export type SubmitProjectMaterialsResult = {
  submittedCount: number;
  alreadySubmittedCount: number;
  skippedCount: number;
  submittedMaterialIds: string[];
  skipped: Array<{
    materialId: string;
    reason: string;
  }>;
};

export type DeleteProjectMaterialResult = {
  deleted: boolean;
  alreadyDeleted?: boolean;
  deletionLogId?: string;
};

export type ProjectMaterialDownloadUrlResponse =
  | string
  | {
      url?: string;
      downloadUrl?: string;
      expiresAt?: string;
      expiresInSeconds?: number;
    };

export type QueryProjectOwnerProjectsParams = QueryParams & {
  batchId?: string;
  page?: number;
  pageSize?: number;
  projectTypeId?: string;
  reviewManagerId?: string;
  reviewSchemeId?: string;
  statusId?: string;
};

export type QueryProjectMaterialsParams = QueryParams & {
  materialTypeId?: string;
};

export type ProjectOwnerLookupMaps = {
  batchNameById: Map<string, string>;
  dictionaryNameById: Map<string, string>;
  materialTypeNameById: Map<string, string>;
  organizationNameById: Map<string, string>;
  reviewLevelLabelByValue: Map<string, string>;
  reviewSchemeNameById: Map<string, string>;
  treeNameById: Map<string, string>;
  userNameById: Map<string, string>;
};

import type { QueryParams } from '@/src/lib/api/types';

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
  reviewManagerId?: string | null;
  reviewSchemeId?: string | null;
  reviewTime?: string | null;
  reviewLocation?: string;
  meetingUrl?: string;
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

export type ProjectMaterialStatus = 'active' | 'deleted';

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

export type DeleteProjectMaterialResult = {
  deleted: boolean;
  alreadyDeleted: boolean;
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
  organizationNameById: Map<string, string>;
  reviewSchemeNameById: Map<string, string>;
  treeNameById: Map<string, string>;
  userNameById: Map<string, string>;
};

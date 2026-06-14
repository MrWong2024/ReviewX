export type ProjectImportJobStatus =
  | 'parsing'
  | 'pending_confirmation'
  | 'completed'
  | 'failed'
  | 'canceled';

export type ProjectImportRowStatus =
  | 'importable'
  | 'pending_confirmation'
  | 'confirmed'
  | 'skipped'
  | 'failed';

export type ProjectImportJob = {
  id: string;
  originalFilename: string;
  uploadedByUserId: string;
  batchId: string;
  status: ProjectImportJobStatus;
  totalRows: number;
  importableRows: number;
  pendingRows: number;
  confirmedRows: number;
  skippedRows: number;
  failedRows: number;
  fieldMapping: Record<string, string | undefined>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectImportNormalizedRecord = {
  projectNo?: string;
  name?: string;
  projectTypeName?: string;
  ownerName?: string;
  ownerPhone?: string;
  leadOrganizationName?: string;
  totalFunding?: number | null;
  allocatedFunding?: number | null;
  disciplineNames?: string[];
  departmentName?: string;
  cooperationOrganizationNames?: string[];
  statusName?: string;
  organizationContactName?: string;
  organizationContactPhone?: string;
};

export type ProjectImportResolvedRecord = {
  projectId?: string;
  matchedExistingProject?: boolean;
  projectTypeId?: string;
  statusId?: string;
  ownerUserId?: string;
  leadOrganizationId?: string;
  cooperationOrganizationIds?: string[];
  disciplineIds?: string[];
  departmentId?: string;
};

export type ProjectImportIssueCandidate = {
  id: string;
  name: string;
  extra?: string;
};

export type ProjectImportIssue = {
  field: string;
  code: string;
  message: string;
  candidates?: ProjectImportIssueCandidate[];
};

export type ProjectImportRow = {
  id: string;
  jobId: string;
  rowNumber: number;
  raw: Record<string, unknown>;
  normalized: ProjectImportNormalizedRecord;
  resolved: ProjectImportResolvedRecord;
  issues: ProjectImportIssue[];
  status: ProjectImportRowStatus;
  projectId?: string | null;
  confirmedByUserId?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BulkConfirmProjectImportResponse = {
  successCount: number;
  failedCount: number;
  skippedCount: number;
};

export type DeleteProjectImportJobResponse = {
  success: boolean;
  deletedJobId: string;
  deletedRows: number;
};

export type ListProjectImportJobsParams = {
  batchId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  status?: ProjectImportJobStatus | '';
};

export type ListProjectImportRowsParams = {
  keyword?: string;
  page?: number;
  pageSize?: number;
  status?: ProjectImportRowStatus | '';
};

export type UploadProjectImportInput = {
  batchId: string;
  file: File;
};

export type UpdateProjectImportNormalizedInput = Partial<{
  projectNo: string;
  name: string;
  projectTypeName: string;
  ownerName: string;
  ownerPhone: string;
  leadOrganizationName: string;
  totalFunding: number;
  allocatedFunding: number;
  disciplineNames: string[];
  departmentName: string;
  cooperationOrganizationNames: string[];
  statusName: string;
  organizationContactName: string;
  organizationContactPhone: string;
}>;

export type UpdateProjectImportResolvedInput = Partial<{
  projectTypeId: string;
  statusId: string;
  ownerUserId: string;
  leadOrganizationId: string;
  cooperationOrganizationIds: string[];
  disciplineIds: string[];
  departmentId: string;
}>;

export type CreateProjectImportOrganizationInput = {
  contactName?: string;
  contactPhone?: string;
  name: string;
  regionId?: string;
};

export type CreateProjectImportOwnerUserInput = {
  disciplineIds?: string[];
  name: string;
  organizationIds?: string[];
  phone: string;
};

export type UpdateProjectImportRowInput = {
  createOrganization?: CreateProjectImportOrganizationInput;
  createOwnerUser?: CreateProjectImportOwnerUserInput;
  normalized?: UpdateProjectImportNormalizedInput;
  resolved?: UpdateProjectImportResolvedInput;
};

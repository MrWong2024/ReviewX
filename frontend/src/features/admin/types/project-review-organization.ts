export type Project = {
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
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  reviewTime?: string | null;
  statusId?: string | null;
  totalFunding?: number | null;
  updatedAt: string;
};

export type ListProjectsParams = {
  batchId?: string;
  departmentId?: string;
  disciplineId?: string;
  hasReviewManager?: boolean | '';
  hasReviewScheme?: boolean | '';
  isActive?: boolean | '';
  keyword?: string;
  page?: number;
  pageSize?: number;
  projectTypeId?: string;
  reviewManagerId?: string;
  reviewSchemeId?: string;
  statusId?: string;
};

export type UpdateReviewAssignmentInput = {
  reviewManagerId?: string;
  reviewSchemeId?: string;
};

export type BatchUpdateReviewAssignmentInput = UpdateReviewAssignmentInput & {
  projectIds: string[];
};

export type BatchReviewAssignmentResult = {
  successCount: number;
  failedCount: number;
  failures: Array<{
    projectId: string;
    statusCode: number;
    message: string;
  }>;
};

export type UpdateProjectScheduleInput = {
  reviewTime?: string;
  reviewLocation?: string;
  meetingUrl?: string;
};

export type ExpertBasic = {
  id: string;
  phone: string;
  name: string;
  organizationIds: string[];
  disciplineIds: string[];
  assigned?: boolean;
};

export type ExpertCandidatePage = {
  items: ExpertBasic[];
  page: number;
  pageSize: number;
  total: number;
  reason?: 'project_discipline_missing' | string;
};

export type ListProjectExpertCandidatesParams = {
  keyword?: string;
  page?: number;
  pageSize?: number;
};

export type AppendProjectExpertsInput = {
  expertUserIds: string[];
};

export type UpdateProjectExpertsInput = {
  expertUserIds: string[];
};

export type BatchProjectExpertsInput = {
  projectIds: string[];
  expertUserIds: string[];
  mode: 'replace' | 'append';
};

export type ExpertAssignmentFailure = {
  expertUserId: string;
  reasons: string[];
  detail: unknown;
};

export type AppendExpertsResult = {
  assignedExperts: ExpertBasic[];
  successCount: number;
  failedCount: number;
  failures: ExpertAssignmentFailure[];
};

export type ReplaceExpertsResult = {
  assignedExperts: ExpertBasic[];
  addedOrRestoredCount: number;
  removedCount: number;
};

export type RemoveExpertResult = {
  removed: boolean;
  alreadyRemoved: boolean;
};

export type BatchProjectExpertsResult = {
  successCount: number;
  failedCount: number;
  results: Array<{
    projectId: string;
    success: boolean;
    assignedCount?: number;
    removedCount?: number;
    failures?: ExpertAssignmentFailure[];
    message?: string;
  }>;
};

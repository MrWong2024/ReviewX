import { ProjectImportIssueCode } from '../constants/project-import-issue-codes';

export type ProjectImportRawRecord = Partial<Record<string, string>>;

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
  code: ProjectImportIssueCode;
  message: string;
  candidates?: ProjectImportIssueCandidate[];
};

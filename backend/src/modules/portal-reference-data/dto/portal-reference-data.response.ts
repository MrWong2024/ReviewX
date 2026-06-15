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

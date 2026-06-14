export type ProjectImportStandardField =
  | 'projectNo'
  | 'name'
  | 'projectTypeName'
  | 'ownerName'
  | 'ownerPhone'
  | 'leadOrganizationName'
  | 'totalFunding'
  | 'allocatedFunding'
  | 'disciplineName'
  | 'departmentName'
  | 'cooperationOrganizationNames'
  | 'statusName'
  | 'organizationContactName'
  | 'organizationContactPhone';

export type ProjectImportStandardFieldItem = {
  defaultAliases: string[];
  label: string;
  required: boolean;
  standardField: ProjectImportStandardField;
};

export type ProjectImportStandardFieldsResponse = {
  items: ProjectImportStandardFieldItem[];
};

export type ProjectImportFieldMappingView = {
  aliases: string[];
  createdAt?: string | null;
  createdByUserId?: string | null;
  defaultAliases: string[];
  description?: string;
  effectiveAliases: string[];
  id?: string | null;
  isActive: boolean;
  isConfigured: boolean;
  label: string;
  normalizedAliases: string[];
  required: boolean;
  standardField: ProjectImportStandardField;
  updatedAt?: string | null;
  updatedByUserId?: string | null;
};

export type ListProjectImportFieldMappingsParams = {
  isActive?: boolean | '';
  keyword?: string;
};

export type UpsertProjectImportFieldMappingInput = {
  aliases: string[];
  description?: string;
  isActive?: boolean;
};

export type UpdateProjectImportFieldMappingInput = {
  aliases?: string[];
  description?: string;
  isActive?: boolean;
};

export type DeleteProjectImportFieldMappingResponse = {
  success: boolean;
};

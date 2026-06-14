import { ProjectImportStandardField } from '../constants/project-import-field-map';

export type ProjectImportStandardFieldResponse = {
  standardField: ProjectImportStandardField;
  label: string;
  required: boolean;
  defaultAliases: string[];
};

export type ProjectImportStandardFieldsResponse = {
  items: ProjectImportStandardFieldResponse[];
};

export type ProjectImportFieldMappingResponse = {
  id?: string;
  standardField: ProjectImportStandardField;
  label: string;
  required: boolean;
  aliases: string[];
  normalizedAliases: string[];
  defaultAliases: string[];
  effectiveAliases: string[];
  isConfigured: boolean;
  isActive: boolean;
  description?: string;
  createdByUserId?: string;
  updatedByUserId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ProjectImportFieldMappingsResponse = {
  items: ProjectImportFieldMappingResponse[];
};

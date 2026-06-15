export type Batch = {
  createdAt: string;
  description?: string;
  id: string;
  isActive: boolean;
  name: string;
  updatedAt: string;
  year?: number | null;
};

export type Dictionary = {
  code: string;
  createdAt: string;
  description?: string;
  dictType: string;
  id: string;
  isActive: boolean;
  name: string;
  sortOrder: number;
  updatedAt: string;
};

export type TreeDictionary = {
  code?: string;
  createdAt: string;
  fullName?: string;
  id: string;
  isActive: boolean;
  level: number;
  name: string;
  parentId?: string | null;
  pathIds: string[];
  sortOrder: number;
  treeType: string;
  updatedAt: string;
};

export type Organization = {
  contactName?: string;
  contactPhone?: string;
  createdAt: string;
  id: string;
  isActive: boolean;
  name: string;
  regionId?: string | null;
  updatedAt: string;
};

export type ReviewSchemeItem = {
  maxScore: number;
  name: string;
  scoringGuide?: string;
  sortOrder: number;
  suggestionRequiredThresholdRatio: number;
};

export type ReviewScheme = {
  createdAt: string;
  description?: string;
  id: string;
  isActive: boolean;
  items: ReviewSchemeItem[];
  name: string;
  totalScore: number;
  updatedAt: string;
};

export type BatchFormInput = {
  description?: string;
  isActive?: boolean;
  name: string;
  year?: number | null;
};

export type DictionaryFormInput = {
  code: string;
  description?: string;
  dictType: string;
  isActive?: boolean;
  name: string;
  sortOrder?: number;
};

export type TreeDictionaryFormInput = {
  code?: string;
  fullName?: string;
  isActive?: boolean;
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  treeType: string;
};

export type OrganizationFormInput = {
  contactName?: string;
  contactPhone?: string;
  isActive?: boolean;
  name: string;
  regionId?: string | null;
};

export type ReviewSchemeFormInput = {
  description?: string;
  isActive?: boolean;
  items: ReviewSchemeItem[];
  name: string;
};

export * from './types/users';
export * from './types/project-review-organization';
export * from './types/project-imports';
export * from './types/project-import-field-mappings';

export const MATERIAL_TYPE_DICT_TYPE = 'material_type';

export const PROJECT_MATERIAL_STATUSES = [
  'draft',
  'submitted',
  'active',
] as const;
export type ProjectMaterialStatus = (typeof PROJECT_MATERIAL_STATUSES)[number];

export const PROJECT_MATERIAL_SCHEMA_STATUSES = [
  ...PROJECT_MATERIAL_STATUSES,
  'deleted',
] as const;
export type ProjectMaterialPersistedStatus =
  (typeof PROJECT_MATERIAL_SCHEMA_STATUSES)[number];

export const PROJECT_MATERIAL_MAX_FILES = 20;
export const PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
export const PROJECT_MATERIAL_REMARK_MAX_LENGTH = 1000;
export const PROJECT_FOLLOW_UP_NEEDS_MAX_LENGTH = 5000;
export const PROJECT_OWNER_CONTENT_LOCKED_CODE = 'PROJECT_OWNER_CONTENT_LOCKED';
export const PROJECT_OWNER_CONTENT_LOCKED_MESSAGE =
  '评审结果已确认，项目材料和后续推进需求已锁定。如需补充说明，请通过申诉提交补充材料。';

export const ALLOWED_PROJECT_MATERIAL_EXTENSIONS = [
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
  'zip',
  'rar',
  '7z',
  'txt',
  'csv',
] as const;

export const BLOCKED_PROJECT_MATERIAL_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'sh',
  'js',
  'mjs',
  'cjs',
  'php',
  'jsp',
  'asp',
  'aspx',
  'dll',
  'so',
  'ps1',
] as const;

export type ProjectMaterialExtension =
  (typeof ALLOWED_PROJECT_MATERIAL_EXTENSIONS)[number];

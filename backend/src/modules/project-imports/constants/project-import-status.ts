export const PROJECT_IMPORT_JOB_STATUSES = [
  'parsing',
  'pending_confirmation',
  'completed',
  'failed',
  'canceled',
] as const;

export type ProjectImportJobStatus =
  (typeof PROJECT_IMPORT_JOB_STATUSES)[number];

export const PROJECT_IMPORT_ROW_STATUSES = [
  'importable',
  'pending_confirmation',
  'confirmed',
  'skipped',
  'failed',
] as const;

export type ProjectImportRowStatus =
  (typeof PROJECT_IMPORT_ROW_STATUSES)[number];

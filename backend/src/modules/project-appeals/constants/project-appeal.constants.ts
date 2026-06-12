export const PROJECT_APPEAL_STATUSES = [
  'submitted',
  'processing',
  'accepted',
  'rejected',
  'canceled',
] as const;

export type ProjectAppealStatus = (typeof PROJECT_APPEAL_STATUSES)[number];

export const PROJECT_APPEAL_ATTACHMENT_STATUSES = [
  'active',
  'deleted',
] as const;

export type ProjectAppealAttachmentStatus =
  (typeof PROJECT_APPEAL_ATTACHMENT_STATUSES)[number];

export const PROJECT_LEVEL_CHANGE_SOURCES = [
  'consensus_confirm',
  'appeal_handling',
  'admin_correction',
] as const;

export type ProjectLevelChangeSource =
  (typeof PROJECT_LEVEL_CHANGE_SOURCES)[number];

export const PROJECT_APPEAL_MAX_COUNT = 3;
export const PROJECT_APPEAL_PENDING_STATUSES: ProjectAppealStatus[] = [
  'submitted',
  'processing',
];
export const PROJECT_APPEAL_REASON_MAX_LENGTH = 10000;
export const PROJECT_APPEAL_HANDLING_OPINION_MAX_LENGTH = 10000;
export const PROJECT_APPEAL_REMARK_MAX_LENGTH = 1000;

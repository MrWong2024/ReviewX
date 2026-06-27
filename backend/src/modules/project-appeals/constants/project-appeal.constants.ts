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
export const PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED_CODE =
  'PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED';
export const PROJECT_APPEAL_ATTACHMENT_DELETE_NOT_ALLOWED_MESSAGE =
  '申诉附件提交后将作为申诉材料留痕，不能删除。申诉处理前可继续补充上传材料。';

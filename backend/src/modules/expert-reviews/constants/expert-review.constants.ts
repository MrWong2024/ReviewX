export const EXPERT_REVIEW_STATUSES = [
  'draft',
  'submitted',
  'returned',
] as const;

export type ExpertReviewStatus = (typeof EXPERT_REVIEW_STATUSES)[number];

export const EXPERT_REVIEW_VIEW_STATUSES = [
  'not_started',
  ...EXPERT_REVIEW_STATUSES,
] as const;

export type ExpertReviewViewStatus =
  (typeof EXPERT_REVIEW_VIEW_STATUSES)[number];

export const DEFAULT_SUGGESTION_REQUIRED_THRESHOLD_RATIO = 0.8;
export const REVIEW_TEXT_MAX_LENGTH = 10000;
export const EXPERT_REVIEW_DRAFT_NOT_DELETABLE =
  'EXPERT_REVIEW_DRAFT_NOT_DELETABLE';
export const PROJECT_REVIEW_SCHEME_MISSING =
  'PROJECT_REVIEW_SCHEME_MISSING';
export const PROJECT_REVIEW_TIME_MISSING = 'PROJECT_REVIEW_TIME_MISSING';
export const PROJECT_REVIEW_SCHEME_INVALID =
  'PROJECT_REVIEW_SCHEME_INVALID';

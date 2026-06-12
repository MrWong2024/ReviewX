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

export const CONSENSUS_REVIEW_STATUSES = [
  'draft',
  'confirmed',
  'reopened',
] as const;

export type ConsensusReviewStatus = (typeof CONSENSUS_REVIEW_STATUSES)[number];

export const CONSENSUS_DRAFT_SOURCES = ['rule_based', 'manual', 'ai'] as const;

export type ConsensusDraftSource = (typeof CONSENSUS_DRAFT_SOURCES)[number];

export const REVIEW_LEVEL_DICT_TYPE = 'review_level';

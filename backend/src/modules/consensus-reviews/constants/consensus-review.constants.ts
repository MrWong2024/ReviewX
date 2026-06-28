export const CONSENSUS_REVIEW_STATUSES = [
  'draft',
  'confirmed',
  'reopened',
] as const;

export type ConsensusReviewStatus = (typeof CONSENSUS_REVIEW_STATUSES)[number];

export const CONSENSUS_DRAFT_SOURCES = ['rule_based', 'manual', 'ai'] as const;

export type ConsensusDraftSource = (typeof CONSENSUS_DRAFT_SOURCES)[number];

export const REVIEW_LEVEL_DICT_TYPE = 'review_level';

export const CONSENSUS_ALREADY_CONFIRMED_CODE = 'CONSENSUS_ALREADY_CONFIRMED';

export const CONSENSUS_ALREADY_CONFIRMED_MESSAGE =
  '最终合议结论已确认，不能在合议页重新覆盖。如需调整，请通过申诉处理或后续更正流程办理。';

export const CONSENSUS_DRAFT_COOLDOWN_CODE = 'CONSENSUS_DRAFT_COOLDOWN';

export const CONSENSUS_DRAFT_COOLDOWN_MESSAGE =
  '合议草稿刚刚生成，请稍后再试';

export const DEFAULT_CONSENSUS_DRAFT_COOLDOWN_SECONDS = 60;

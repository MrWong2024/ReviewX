export const CLIENT_DASHBOARD_PROGRESS_STAGES = [
  'imported',
  'review_assigned',
  'scheduled',
  'experts_assigned',
  'materials_submitted',
  'expert_reviews_started',
  'expert_reviews_completed',
  'consensus_draft',
  'consensus_confirmed',
  'final_level_set',
  'appeal_pending',
] as const;

export type ClientDashboardProgressStage =
  (typeof CLIENT_DASHBOARD_PROGRESS_STAGES)[number];

export const CLIENT_DASHBOARD_PRIMARY_STAGE_PRIORITY = [
  'appeal_pending',
  'final_level_set',
  'consensus_confirmed',
  'consensus_draft',
  'expert_reviews_completed',
  'expert_reviews_started',
  'materials_submitted',
  'experts_assigned',
  'scheduled',
  'review_assigned',
  'imported',
] as const satisfies readonly ClientDashboardProgressStage[];

export const EFFECTIVE_FINAL_LEVEL_SOURCES = [
  'project_final_level',
  'confirmed_consensus',
] as const;

export type EffectiveFinalLevelSource =
  (typeof EFFECTIVE_FINAL_LEVEL_SOURCES)[number];

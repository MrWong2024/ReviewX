import { isApiError } from '@/src/lib/api/errors';

export type ExpertAssignmentLockReason =
  | 'CONSENSUS_EXISTS'
  | 'EXPERT_REVIEW_EXISTS'
  | 'FINAL_LEVEL_EXISTS'
  | 'REVIEW_TIME_REACHED';

export type ExpertAssignmentLockInput = {
  finalLevel?: string | null;
  hasConsensus?: boolean;
  hasExpertReviewRecord?: boolean;
  originalLevel?: string | null;
  reviewTime?: string | null;
};

export const EXPERT_ASSIGNMENT_LOCKED_CODE = 'EXPERT_ASSIGNMENT_LOCKED';

export function getExpertAssignmentLockReasons(
  input: ExpertAssignmentLockInput,
): ExpertAssignmentLockReason[] {
  const reasons: ExpertAssignmentLockReason[] = [];

  if (isReviewTimeReached(input.reviewTime)) {
    reasons.push('REVIEW_TIME_REACHED');
  }

  if (input.hasExpertReviewRecord) {
    reasons.push('EXPERT_REVIEW_EXISTS');
  }

  if (input.hasConsensus) {
    reasons.push('CONSENSUS_EXISTS');
  }

  if (
    hasNonEmptyString(input.finalLevel) ||
    hasNonEmptyString(input.originalLevel)
  ) {
    reasons.push('FINAL_LEVEL_EXISTS');
  }

  return reasons;
}

export function mergeExpertAssignmentLockReasons(
  reasons: ExpertAssignmentLockReason[],
): ExpertAssignmentLockReason[] {
  return Array.from(new Set(reasons));
}

export function getExpertAssignmentLockMessage(
  reasons: ExpertAssignmentLockReason[],
): string {
  const uniqueReasons = mergeExpertAssignmentLockReasons(reasons);

  if (uniqueReasons.length === 0) {
    return '';
  }

  return uniqueReasons.map(formatExpertAssignmentLockReason).join(' ');
}

export function formatExpertAssignmentLockReason(
  reason: ExpertAssignmentLockReason,
): string {
  switch (reason) {
    case 'REVIEW_TIME_REACHED':
      return '评审已开始，专家名单已锁定。';
    case 'EXPERT_REVIEW_EXISTS':
      return '已产生评分记录，专家名单已锁定。';
    case 'CONSENSUS_EXISTS':
      return '已生成合议记录，专家名单已锁定。';
    case 'FINAL_LEVEL_EXISTS':
      return '已形成最终等级 / 最终结论，专家名单已锁定。';
  }
}

export function isExpertAssignmentLockedError(error: unknown): boolean {
  return (
    isApiError(error) &&
    error.status === 409 &&
    (error.code === EXPERT_ASSIGNMENT_LOCKED_CODE ||
      error.message.includes('专家名单已锁定'))
  );
}

function isReviewTimeReached(reviewTime?: string | null): boolean {
  if (!reviewTime) {
    return false;
  }

  const time = new Date(reviewTime).getTime();

  return Number.isFinite(time) && Date.now() >= time;
}

function hasNonEmptyString(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

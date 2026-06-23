'use client';

import { Badge } from '@/src/components/feedback/Badge';
import type { ExpertReviewViewStatus } from '../types';
import { getExpertReviewStatusView } from '../utils';

type ReviewManagerProjectStatusBadgeProps = {
  status: ExpertReviewViewStatus;
};

export function ReviewManagerProjectStatusBadge({
  status,
}: ReviewManagerProjectStatusBadgeProps) {
  const view = getExpertReviewStatusView(status);

  return <Badge tone={view.tone}>{view.label}</Badge>;
}

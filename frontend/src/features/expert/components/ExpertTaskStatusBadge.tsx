import { Badge } from '@/src/components/feedback/Badge';
import type { ExpertReviewViewStatus } from '../types';
import { getExpertReviewStatusView } from '../utils';

type ExpertTaskStatusBadgeProps = {
  status: ExpertReviewViewStatus;
};

export function ExpertTaskStatusBadge({ status }: ExpertTaskStatusBadgeProps) {
  const statusView = getExpertReviewStatusView(status);

  return (
    <span title={statusView.description}>
      <Badge tone={statusView.tone}>{statusView.label}</Badge>
    </span>
  );
}

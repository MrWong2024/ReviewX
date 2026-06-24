'use client';

import { Badge } from '@/src/components/feedback/Badge';
import { getAppealStatusView } from '@/src/lib/project-appeals/utils';
import type { ProjectAppealStatus } from '@/src/lib/project-appeals/types';

type AppealStatusBadgeProps = {
  status: ProjectAppealStatus | string;
};

export function AppealStatusBadge({ status }: AppealStatusBadgeProps) {
  const view = getAppealStatusView(status);

  return <Badge tone={view.tone}>{view.label}</Badge>;
}

import type { ReactNode } from 'react';

type BadgeTone = 'success' | 'muted' | 'warning' | 'primary';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, tone = 'muted' }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

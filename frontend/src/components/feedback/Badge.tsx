import type { ReactNode } from 'react';
import { cx } from '@/src/lib/styles';

type BadgeTone = 'danger' | 'success' | 'muted' | 'warning' | 'primary';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({ children, tone = 'muted' }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
        tone === 'primary' && 'bg-cyan-50 text-cyan-700 ring-cyan-200',
        tone === 'success' && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        tone === 'warning' && 'bg-amber-50 text-amber-700 ring-amber-200',
        tone === 'danger' && 'bg-red-50 text-red-700 ring-red-200',
        tone === 'muted' && 'bg-slate-100 text-slate-600 ring-slate-200',
      )}
    >
      {children}
    </span>
  );
}

'use client';

import { cx } from '@/src/lib/styles';

type SidebarCollapseButtonProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function SidebarCollapseButton({
  collapsed,
  onToggle,
}: SidebarCollapseButtonProps) {
  return (
    <button
      aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
      className={cx(
        'inline-flex min-h-8 shrink-0 items-center justify-center gap-1 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-xs font-semibold text-cyan-50 shadow-sm transition duration-200 hover:border-cyan-200/45 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70',
        collapsed && 'lg:w-full lg:px-1.5',
      )}
      onClick={onToggle}
      title={collapsed ? '展开侧边栏' : '收起侧边栏'}
      type="button"
    >
      <span aria-hidden="true" className="text-base leading-none">
        {collapsed ? '›' : '‹'}
      </span>
      <span>{collapsed ? '展开' : '收起'}</span>
    </button>
  );
}

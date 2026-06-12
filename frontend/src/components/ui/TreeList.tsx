import type { ReactNode } from 'react';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import type { TreeFlatNode, TreeLike } from '@/src/lib/tree/build-tree';

type TreeListProps<T extends TreeLike> = {
  emptyText?: string;
  renderActions?: (item: T) => ReactNode;
  renderMeta?: (item: T) => ReactNode;
  renderStatus?: (item: T) => ReactNode;
  rows: Array<TreeFlatNode<T>>;
  title: (item: T) => ReactNode;
};

export function TreeList<T extends TreeLike>({
  emptyText = '暂无树形节点',
  renderActions,
  renderMeta,
  renderStatus,
  rows,
  title,
}: TreeListProps<T>) {
  if (rows.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="divide-y divide-slate-100">
      {rows.map(({ depth, hasChildren, item }) => (
        <div
          className="grid items-start gap-3 px-4 py-3 transition hover:bg-cyan-50/[0.45] md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)_auto_auto]"
          key={item.id}
        >
          <div
            className="flex min-w-0 items-start gap-2"
            style={{ paddingLeft: depth * 22 }}
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
              {hasChildren ? '▾' : depth === 0 ? '•' : '└'}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">{title(item)}</div>
              <div className="mt-1 text-xs text-slate-500">层级 {depth + 1}</div>
            </div>
          </div>
          <div className="text-sm text-slate-500">{renderMeta?.(item)}</div>
          <div>{renderStatus?.(item)}</div>
          <div className="flex flex-wrap justify-start gap-1.5 md:justify-end">
            {renderActions?.(item)}
          </div>
        </div>
      ))}
    </div>
  );
}

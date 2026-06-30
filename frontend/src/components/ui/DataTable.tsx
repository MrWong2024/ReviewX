import type { ReactNode } from 'react';
import { EmptyState } from '../feedback/EmptyState';
import { cx } from '@/src/lib/styles';

export type DataColumn<T> = {
  cellClassName?: string;
  headerClassName?: string;
  key: string;
  render?: (item: T) => ReactNode;
  title: string;
};

type DataTableProps<T> = {
  columns: DataColumn<T>[];
  emptyText?: string;
  getRowKey: (item: T) => string;
  items: T[];
};

export function DataTable<T>({
  columns,
  emptyText = '暂无数据',
  getRowKey,
  items,
}: DataTableProps<T>) {
  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-slate-50/90">
            {columns.map((column) => (
              <th
                className={cx(
                  'border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 first:rounded-tl-xl last:rounded-tr-xl',
                  column.headerClassName,
                )}
                key={column.key}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              className="group transition hover:bg-cyan-50/40"
              key={getRowKey(item)}
            >
              {columns.map((column) => (
                <td
                  className={cx(
                    'border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0',
                    column.cellClassName,
                  )}
                  key={column.key}
                >
                  {column.render ? column.render(item) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

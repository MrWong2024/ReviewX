import type { ReactNode } from 'react';
import { EmptyState } from '../feedback/EmptyState';

export type DataColumn<T> = {
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
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getRowKey(item)}>
              {columns.map((column) => (
                <td key={column.key}>
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

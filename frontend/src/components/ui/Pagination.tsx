import { Button } from './Button';

type PaginationProps = {
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
  total: number;
};

export function Pagination({
  onPageChange,
  page,
  pageSize,
  total,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-4 py-3">
      <span className="text-sm text-slate-500">
        第 {page} / {pageCount} 页，共 {total} 条
      </span>
      <Button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        size="small"
        variant="secondary"
      >
        上一页
      </Button>
      <Button
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        size="small"
        variant="secondary"
      >
        下一页
      </Button>
    </div>
  );
}

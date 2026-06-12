type EmptyStateProps = {
  text?: string;
  title?: string;
};

export function EmptyState({
  text = '暂无数据',
  title = '暂无内容',
}: EmptyStateProps) {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
        ∅
      </div>
      <div className="text-sm font-bold text-slate-700">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{text}</div>
    </div>
  );
}

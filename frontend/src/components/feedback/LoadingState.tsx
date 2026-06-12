type LoadingStateProps = {
  text?: string;
};

export function LoadingState({ text = '加载中...' }: LoadingStateProps) {
  return (
    <div className="grid place-items-center gap-3 px-6 py-10 text-center text-sm text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-100 border-t-cyan-600" />
      <span>{text}</span>
    </div>
  );
}

type EmptyStateProps = {
  text?: string;
};

export function EmptyState({ text = '暂无数据' }: EmptyStateProps) {
  return <div className="empty-state">{text}</div>;
}

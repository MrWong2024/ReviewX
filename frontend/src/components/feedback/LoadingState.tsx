type LoadingStateProps = {
  text?: string;
};

export function LoadingState({ text = '加载中...' }: LoadingStateProps) {
  return <div className="loading-state">{text}</div>;
}

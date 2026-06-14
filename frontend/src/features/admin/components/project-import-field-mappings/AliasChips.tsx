import { cx } from '@/src/lib/styles';

type AliasChipsProps = {
  aliases: string[];
  emptyText?: string;
  maxVisible?: number;
  tone?: 'default' | 'effective' | 'muted';
};

export function AliasChips({
  aliases,
  emptyText = '-',
  maxVisible = 4,
  tone = 'default',
}: AliasChipsProps) {
  if (aliases.length === 0) {
    return <span className="text-sm text-slate-400">{emptyText}</span>;
  }

  const visibleAliases = aliases.slice(0, maxVisible);
  const hiddenCount = aliases.length - visibleAliases.length;

  return (
    <div className="flex max-w-72 flex-wrap gap-1.5">
      {visibleAliases.map((alias) => (
        <span
          className={cx(
            'inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset',
            tone === 'default' && 'bg-white text-slate-700 ring-slate-200',
            tone === 'effective' && 'bg-cyan-50 text-cyan-700 ring-cyan-200',
            tone === 'muted' && 'bg-slate-100 text-slate-500 ring-slate-200',
          )}
          key={alias}
          title={alias}
        >
          <span className="max-w-40 truncate">{alias}</span>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-inset ring-slate-200">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}

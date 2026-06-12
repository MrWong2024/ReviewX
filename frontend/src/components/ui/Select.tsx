import type { SelectHTMLAttributes } from 'react';
import { cx } from '@/src/lib/styles';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hint?: string;
  label?: string;
};

export function Select({
  children,
  className,
  hint,
  id,
  label,
  ...props
}: SelectProps) {
  return (
    <div className="grid gap-1.5">
      {label ? (
        <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select
        className={cx(
          'min-h-10 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100/70 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100',
          className,
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

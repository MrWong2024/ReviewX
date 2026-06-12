import type { InputHTMLAttributes } from 'react';
import { cx } from '@/src/lib/styles';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hint?: string;
  label?: string;
};

export function Input({ className, hint, id, label, ...props }: InputProps) {
  return (
    <div className="grid gap-1.5">
      {label ? (
        <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        className={cx(
          'min-h-10 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100/70 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100',
          className,
        )}
        id={id}
        {...props}
      />
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

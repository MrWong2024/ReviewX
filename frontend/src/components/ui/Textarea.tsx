import type { TextareaHTMLAttributes } from 'react';
import { cx } from '@/src/lib/styles';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hint?: string;
  label?: string;
};

export function Textarea({
  className,
  hint,
  id,
  label,
  ...props
}: TextareaProps) {
  return (
    <div className="grid gap-1.5">
      {label ? (
        <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        className={cx(
          'min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100/70 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100',
          className,
        )}
        id={id}
        {...props}
      />
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

import type { InputHTMLAttributes } from 'react';
import { cx } from '@/src/lib/styles';
import { FormField } from './FormField';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  description?: string;
  error?: string;
  hint?: string;
  label?: string;
  reserveDescription?: boolean;
};

export function Input({
  className,
  description,
  error,
  hint,
  id,
  label,
  reserveDescription,
  ...props
}: InputProps) {
  return (
    <FormField
      description={description ?? hint}
      error={error}
      id={id}
      label={label}
      reserveDescription={reserveDescription}
    >
      <input
        className={cx(
          'h-10 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-0 text-sm leading-5 text-slate-900 shadow-inner shadow-slate-100/70 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        id={id}
        {...props}
      />
    </FormField>
  );
}

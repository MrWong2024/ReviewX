import type { SelectHTMLAttributes } from 'react';
import { cx } from '@/src/lib/styles';
import { FormField } from './FormField';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  description?: string;
  error?: string;
  hint?: string;
  label?: string;
  reserveDescription?: boolean;
};

export function Select({
  children,
  className,
  description,
  error,
  hint,
  id,
  label,
  reserveDescription,
  ...props
}: SelectProps) {
  return (
    <FormField
      description={description ?? hint}
      error={error}
      id={id}
      label={label}
      reserveDescription={reserveDescription}
    >
      <select
        className={cx(
          'h-10 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-0 text-sm leading-5 text-slate-900 shadow-inner shadow-slate-100/70 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          className,
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
    </FormField>
  );
}

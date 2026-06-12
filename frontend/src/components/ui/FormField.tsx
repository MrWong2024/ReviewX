import type { ReactNode } from 'react';
import { cx } from '@/src/lib/styles';

type FormFieldProps = {
  children: ReactNode;
  description?: string;
  error?: string;
  id?: string;
  label?: string;
  reserveDescription?: boolean;
};

export function FormField({
  children,
  description,
  error,
  id,
  label,
  reserveDescription = false,
}: FormFieldProps) {
  const helperText = error ?? description;

  return (
    <div className="grid content-start gap-1.5">
      {label ? (
        <label className="text-sm font-semibold text-slate-700" htmlFor={id}>
          {label}
        </label>
      ) : null}
      {children}
      {helperText || reserveDescription ? (
        <p
          className={cx(
            'min-h-5 text-xs leading-5',
            error ? 'text-red-600' : 'text-slate-500',
          )}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/src/lib/styles';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: 'default' | 'small';
  variant?: ButtonVariant;
};

export function Button({
  children,
  className,
  size = 'default',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold shadow-sm transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-55',
        size === 'small'
          ? 'min-h-8 px-3 py-1.5 text-xs'
          : 'min-h-10 px-4 py-2 text-sm',
        variant === 'primary' &&
          'border-transparent bg-gradient-to-r from-[#1b255f] via-[#263a8a] to-[#0f8fa7] text-white shadow-[0_12px_24px_rgba(20,43,107,0.22)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(20,43,107,0.27)]',
        variant === 'secondary' &&
          'border-slate-200 bg-white/[0.85] text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-slate-500 shadow-none hover:bg-slate-100/80 hover:text-slate-900',
        variant === 'danger' &&
          'border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

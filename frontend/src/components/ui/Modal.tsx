'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

type ModalProps = {
  bodyClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  panelClassName?: string;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title: string;
};

const sizeClassBySize = {
  lg: 'max-w-3xl',
  md: 'max-w-2xl',
  sm: 'max-w-md',
  xl: 'max-w-5xl',
} satisfies Record<NonNullable<ModalProps['size']>, string>;

export function Modal({
  bodyClassName,
  children,
  footer,
  onClose,
  open,
  panelClassName,
  showCloseButton = true,
  size = 'lg',
  title,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-5"
      role="presentation"
    >
      <div className="fixed inset-0 bg-slate-950/[0.5] backdrop-blur-sm" />
      <section
        aria-modal="true"
        className={joinClassNames(
          'relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-[0_28px_80px_rgba(15,23,42,0.28)]',
          sizeClassBySize[size],
          panelClassName,
        )}
        role="dialog"
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4">
          <h2 className="m-0 text-lg font-bold text-slate-950">{title}</h2>
          {showCloseButton ? (
            <Button onClick={onClose} size="sm" variant="ghost">
              关闭
            </Button>
          ) : null}
        </header>
        <div
          className={joinClassNames(
            'min-h-0 flex-1 overflow-y-auto px-5 py-5',
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-200/80 bg-slate-50/75 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

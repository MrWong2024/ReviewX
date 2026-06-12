'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';

type ModalProps = {
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Modal({ children, footer, onClose, open, title }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/[0.45] p-5 backdrop-blur-sm"
      role="presentation"
    >
      <section
        aria-modal="true"
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-white/70 bg-white/95 shadow-[0_28px_80px_rgba(15,23,42,0.28)]"
        role="dialog"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-4">
          <h2 className="m-0 text-lg font-bold text-slate-950">{title}</h2>
          <Button onClick={onClose} size="sm" variant="ghost">
            关闭
          </Button>
        </header>
        <div className="px-5 py-5">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200/80 bg-slate-50/75 px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}

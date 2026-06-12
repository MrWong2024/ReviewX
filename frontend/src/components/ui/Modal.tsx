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
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="modal" role="dialog">
        <header className="modal-header">
          <h2>{title}</h2>
          <Button onClick={onClose} size="small" variant="ghost">
            关闭
          </Button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}

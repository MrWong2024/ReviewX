'use client';

import { Button } from './Button';
import { Modal } from './Modal';

type ConfirmDialogProps = {
  confirmLabel?: string;
  description: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title?: string;
};

export function ConfirmDialog({
  confirmLabel = '确认',
  description,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title = '确认操作',
}: ConfirmDialogProps) {
  return (
    <Modal
      footer={
        <>
          <Button disabled={loading} onClick={onCancel} variant="secondary">
            取消
          </Button>
          <Button disabled={loading} onClick={onConfirm} variant="danger">
            {loading ? '处理中...' : confirmLabel}
          </Button>
        </>
      }
      onClose={onCancel}
      open={open}
      title={title}
    >
      <p className="text-sm leading-6 text-slate-600">{description}</p>
    </Modal>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { Textarea } from '@/src/components/ui/Textarea';
import type { AdminProjectMaterial } from '../../types/project-review-organization';

const DELETE_REASON_MAX_LENGTH = 1000;

type AdminProjectMaterialDeleteModalProps = {
  error?: string | null;
  material: AdminProjectMaterial | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  open: boolean;
  submitting: boolean;
};

export function AdminProjectMaterialDeleteModal({
  error,
  material,
  onClose,
  onConfirm,
  open,
  submitting,
}: AdminProjectMaterialDeleteModalProps) {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setValidationError(null);
    }
  }, [material?.id, open]);

  async function handleConfirm() {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setValidationError('请填写删除原因。');
      return;
    }

    if (trimmedReason.length > DELETE_REASON_MAX_LENGTH) {
      setValidationError(`删除原因最多 ${DELETE_REASON_MAX_LENGTH} 字。`);
      return;
    }

    setValidationError(null);
    await onConfirm(trimmedReason);
  }

  function handleClose() {
    if (!submitting) {
      onClose();
    }
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={submitting} onClick={handleClose} variant="secondary">
            取消
          </Button>
          <Button disabled={submitting} onClick={handleConfirm} variant="danger">
            {submitting ? '删除中...' : '删除材料'}
          </Button>
        </>
      }
      onClose={handleClose}
      open={open}
      title="删除项目材料"
    >
      <div className="grid gap-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
          该操作会物理删除文件和材料记录，删除后不可恢复。系统会保留删除审计日志。请填写删除原因。
        </div>
        {material ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            <div className="font-bold text-slate-900">待删除材料</div>
            <div className="mt-1 break-all">
              {material.originalFilename || material.safeFilename || '未命名材料'}
            </div>
          </div>
        ) : null}
        <ErrorAlert message={validationError ?? error} />
        <Textarea
          disabled={submitting}
          error={validationError ?? undefined}
          id="admin-project-material-delete-reason"
          label="删除原因"
          maxLength={DELETE_REASON_MAX_LENGTH}
          onChange={(event) => {
            setReason(event.target.value);
            if (validationError) {
              setValidationError(null);
            }
          }}
          placeholder="请填写删除原因，系统会写入删除审计。"
          value={reason}
        />
        <div className="text-right text-xs font-medium text-slate-500">
          {reason.trim().length} / {DELETE_REASON_MAX_LENGTH}
        </div>
      </div>
    </Modal>
  );
}

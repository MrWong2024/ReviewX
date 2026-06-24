'use client';

import { useRef, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Modal } from '@/src/components/ui/Modal';
import type {
  CreateProjectAppealInput,
  ProjectAppeal,
} from '@/src/lib/project-appeals/types';
import {
  PROJECT_APPEAL_MAX_COUNT,
  PROJECT_APPEAL_REASON_MAX_LENGTH,
  validateAppealAttachmentFiles,
} from '@/src/lib/project-appeals/utils';

type ProjectOwnerCreateAppealDialogProps = {
  canCreate: boolean;
  disabledReason?: string | null;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateProjectAppealInput) => Promise<ProjectAppeal>;
  open: boolean;
  projectId: string;
  submitting?: boolean;
};

export function ProjectOwnerCreateAppealDialog({
  canCreate,
  disabledReason,
  error,
  onClose,
  onSubmit,
  open,
  projectId,
  submitting = false,
}: ProjectOwnerCreateAppealDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function validateForm(): boolean {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setValidationError('申诉说明为必填项。');
      return false;
    }

    if (trimmedReason.length > PROJECT_APPEAL_REASON_MAX_LENGTH) {
      setValidationError('申诉说明不能超过 10000 字。');
      return false;
    }

    if (files.length > 0) {
      const fileError = validateAppealAttachmentFiles(files);

      if (fileError) {
        setValidationError(fileError);
        return false;
      }
    }

    setValidationError(null);
    return true;
  }

  function handlePrepareSubmit() {
    if (validateForm()) {
      setConfirmOpen(true);
    }
  }

  async function handleConfirmSubmit() {
    if (!validateForm()) {
      setConfirmOpen(false);
      return;
    }

    try {
      await onSubmit({
        files,
        projectId,
        reason: reason.trim(),
      });
      setReason('');
      setFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setConfirmOpen(false);
    } catch {
      setConfirmOpen(false);
    }
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={submitting} onClick={onClose} variant="secondary">
            取消
          </Button>
          <Button
            disabled={!canCreate || submitting}
            onClick={handlePrepareSubmit}
            variant="primary"
          >
            {submitting ? '提交中...' : '提交申诉'}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="xl"
      title="发起项目申诉"
    >
      <div className="grid gap-4">
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
          <div className="font-black text-slate-950">发起规则</div>
          <p className="mt-2">
            请针对本项目最终评审结果填写申诉说明。项目评审结果确认且已有最终等级后，才能发起申诉。每个项目最多可提交{' '}
            {PROJECT_APPEAL_MAX_COUNT}{' '}
            次申诉；如已有申诉正在处理，请等待处理完成后再提交。申诉说明为必填项；补充材料不是必填，提交后在处理前仍可继续补充或删除附件。如暂不能提交，系统会提示具体原因。
          </p>
        </div>

        {!canCreate ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            {disabledReason ?? '当前项目暂不能发起申诉。'}
          </div>
        ) : null}

        <ErrorAlert message={error ?? validationError} />

        <label className="grid gap-2">
          <span className="text-xs font-bold text-slate-500">申诉说明</span>
          <textarea
            className="min-h-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            disabled={!canCreate || submitting}
            maxLength={PROJECT_APPEAL_REASON_MAX_LENGTH}
            onChange={(event) => setReason(event.target.value)}
            placeholder="请填写申诉说明，1-10000 字。"
            value={reason}
          />
        </label>

        <div className="grid gap-2">
          <span className="text-xs font-bold text-slate-500">
            补充材料（选填）
          </span>
          <input
            className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            disabled={!canCreate || submitting}
            multiple
            onChange={(event) =>
              setFiles(Array.from(event.target.files ?? []))
            }
            ref={fileInputRef}
            type="file"
          />
          <span className="text-xs text-slate-500">
            已选择 {files.length} 个文件；如文件大小、类型或数量不符合要求，系统会提示具体原因。
          </span>
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="提交申诉"
        description="确认提交该项目申诉吗？提交后在处理完成前不能再次发起新申诉。"
        loading={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirmSubmit()}
        open={confirmOpen}
        title="确认提交申诉？"
      />
    </Modal>
  );
}

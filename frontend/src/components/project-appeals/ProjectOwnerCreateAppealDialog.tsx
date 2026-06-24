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
          <ul className="mt-2 grid gap-1">
            <li>每个项目最多申诉 {PROJECT_APPEAL_MAX_COUNT} 次。</li>
            <li>存在 submitted / processing 状态申诉时，不能再次提交。</li>
            <li>只有已有 confirmed 合议结果且项目存在 finalLevel 时才能提交。</li>
            <li>申诉说明必填；附件可选，提交后可在 submitted 状态继续补充。</li>
            <li>后端是最终裁判，409 / 403 / 404 会按真实错误展示。</li>
          </ul>
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
            已选择 {files.length} 个文件；文件大小、类型和数量以后端校验为准。
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

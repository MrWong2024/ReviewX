'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { Textarea } from '@/src/components/ui/Textarea';
import type { ExpertReviewListItem } from '../types';
import { RETURN_REASON_MAX_LENGTH } from '../utils';

type ReturnExpertReviewModalProps = {
  error?: string | null;
  expertReview: ExpertReviewListItem | null;
  onClose: () => void;
  onSubmit: (returnReason: string) => Promise<void>;
  open: boolean;
  submitting: boolean;
};

export function ReturnExpertReviewModal({
  error,
  expertReview,
  onClose,
  onSubmit,
  open,
  submitting,
}: ReturnExpertReviewModalProps) {
  const [returnReason, setReturnReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReturnReason('');
      setValidationError(null);
    }
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = returnReason.trim();

    if (!trimmed) {
      setValidationError('请填写退回原因。');
      return;
    }

    if (trimmed.length > RETURN_REASON_MAX_LENGTH) {
      setValidationError(`退回原因不能超过 ${RETURN_REASON_MAX_LENGTH} 字。`);
      return;
    }

    if (
      !window.confirm(
        '确认退回该专家评分吗？退回后专家需要修改并重新提交评分。',
      )
    ) {
      return;
    }

    setValidationError(null);
    await onSubmit(trimmed);
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={submitting} onClick={onClose} variant="ghost">
            取消
          </Button>
          <Button
            disabled={submitting}
            form="return-expert-review-form"
            type="submit"
            variant="danger"
          >
            {submitting ? '正在退回...' : '确认退回'}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="md"
      title="退回专家评分"
    >
      {expertReview ? (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-700">
          <div className="font-bold text-slate-950">
            {expertReview.expert.name || '未知专家'}
          </div>
          <div className="mt-1 text-slate-500">
            手机号：{expertReview.expert.phone || '-'}
          </div>
        </div>
      ) : null}

      <form
        className="grid gap-4"
        id="return-expert-review-form"
        onSubmit={handleSubmit}
      >
        <Textarea
          description={`必填，1-${RETURN_REASON_MAX_LENGTH} 字。`}
          error={validationError ?? undefined}
          id="return-reason"
          label="退回原因"
          onChange={(event) => setReturnReason(event.target.value)}
          placeholder="请说明需要专家修改或补充的具体原因"
          rows={6}
          value={returnReason}
        />
        <div className="text-right text-xs font-semibold text-slate-400">
          {returnReason.trim().length} / {RETURN_REASON_MAX_LENGTH}
        </div>
      </form>

      <ErrorAlert message={error ?? null} />
    </Modal>
  );
}

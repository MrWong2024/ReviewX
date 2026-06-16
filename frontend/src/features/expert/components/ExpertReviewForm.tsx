'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { formatDateTime } from '@/src/lib/format/date';
import type {
  ExpertReview,
  ReviewSchemeSnapshot,
  SaveExpertReviewInput,
} from '../types';
import {
  calculateExpertReviewTotalScore,
  formatScore,
  getExpertReviewStatusView,
  isExpertReviewReadonly,
  parseOptionalScore,
  validateScoreRange,
} from '../utils';
import {
  ExpertReviewItemEditor,
  type ExpertReviewItemEditorErrors,
  type ExpertReviewItemEditorValue,
} from './ExpertReviewItemEditor';
import { ExpertTaskStatusBadge } from './ExpertTaskStatusBadge';

type ExpertReviewFormProps = {
  error?: string | null;
  onSaveDraft: (input: SaveExpertReviewInput) => Promise<void>;
  onSubmitReview: (input: SaveExpertReviewInput) => Promise<void>;
  review: ExpertReview;
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  saving: boolean;
  submitting: boolean;
};

type FormErrors = Record<string, ExpertReviewItemEditorErrors>;

export function ExpertReviewForm({
  error,
  onSaveDraft,
  onSubmitReview,
  review,
  reviewSchemeSnapshot,
  saving,
  submitting,
}: ExpertReviewFormProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [items, setItems] = useState<ExpertReviewItemEditorValue[]>(
    createFormItems(review),
  );
  const [pendingSubmitInput, setPendingSubmitInput] =
    useState<SaveExpertReviewInput | null>(null);

  useEffect(() => {
    setItems(createFormItems(review));
    setErrors({});
    setPendingSubmitInput(null);
    setConfirmOpen(false);
  }, [review]);

  const readOnly = isExpertReviewReadonly(review.status);
  const statusView = getExpertReviewStatusView(review.status);
  const draftTotalScore = useMemo(
    () =>
      calculateExpertReviewTotalScore(
        items.map((item) => ({
          score: parseOptionalScore(item.scoreInput),
        })),
      ),
    [items],
  );
  const displayTotalScore =
    review.status === 'submitted' ? review.totalScore : draftTotalScore;

  function updateItem(index: number, nextItem: ExpertReviewItemEditorValue) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? nextItem : item,
      ),
    );
  }

  async function handleSaveDraft() {
    if (readOnly || saving || submitting) {
      return;
    }

    if (!validateForm(false)) {
      return;
    }

    await onSaveDraft(buildInput(items));
  }

  function handleSubmitClick() {
    if (readOnly || saving || submitting) {
      return;
    }

    if (!validateForm(true)) {
      return;
    }

    setPendingSubmitInput(buildInput(items));
    setConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    if (!pendingSubmitInput) {
      return;
    }

    await onSubmitReview(pendingSubmitInput);
    setConfirmOpen(false);
    setPendingSubmitInput(null);
  }

  function validateForm(requireSubmit: boolean): boolean {
    const nextErrors: FormErrors = {};
    let valid = true;

    items.forEach((item, index) => {
      const itemErrors: ExpertReviewItemEditorErrors = {};
      const scoreInput = item.scoreInput.trim();
      const score = parseOptionalScore(item.scoreInput);

      if (requireSubmit && !scoreInput) {
        itemErrors.score = '分数为必填项。';
      } else if (scoreInput && score === null) {
        itemErrors.score = '分数必须为数字。';
      } else if (score !== null) {
        const rangeError = validateScoreRange(score, item.itemSnapshot);

        if (rangeError) {
          itemErrors.score = rangeError;
        }
      }

      if (requireSubmit && !item.evaluationDescription.trim()) {
        itemErrors.evaluationDescription = '评价描述为必填项。';
      }

      if (requireSubmit && score !== null) {
        const thresholdRatio =
          item.itemSnapshot.suggestionRequiredThresholdRatio ?? 0.8;
        const belowThreshold =
          score < item.itemSnapshot.maxScore * thresholdRatio;

        if (
          item.hasMajorIssue &&
          !item.improvementSuggestion.trim()
        ) {
          itemErrors.improvementSuggestion =
            '已标记重大问题，请填写改进建议。';
        } else if (
          belowThreshold &&
          !item.improvementSuggestion.trim()
        ) {
          itemErrors.improvementSuggestion =
            '该项得分低于阈值，请填写改进建议。';
        }
      }

      if (Object.keys(itemErrors).length > 0) {
        nextErrors[String(index)] = itemErrors;
        valid = false;
      }
    });

    setErrors(nextErrors);

    return valid;
  }

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              专家评分
            </h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              评审方案快照随项目保存，提交后除非评审负责人退回，否则不能再修改。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExpertTaskStatusBadge status={review.status} />
            <Badge tone="primary">
              {review.status === 'submitted'
                ? '最终提交分'
                : '当前草稿总分'}{' '}
              {formatScore(displayTotalScore)} /{' '}
              {formatScore(reviewSchemeSnapshot.totalScore)}
            </Badge>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black text-slate-950">
                {reviewSchemeSnapshot.name ?? '评审方案快照'}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500">
                总分 {formatScore(reviewSchemeSnapshot.totalScore)} · 评分项{' '}
                {reviewSchemeSnapshot.items.length} 个
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {statusView.description}
            </span>
          </div>
        </div>

        {review.status === 'returned' ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <div className="font-bold">评分已退回，可修改后重新提交。</div>
            <div className="mt-1">
              退回时间：{formatDateTime(review.returnedAt)}
            </div>
            <div className="mt-1 whitespace-pre-wrap break-words">
              退回原因：{review.returnReason?.trim() || '-'}
            </div>
          </div>
        ) : null}

        {review.status === 'submitted' ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            <div className="font-bold">评分已提交，当前为只读状态。</div>
            <div className="mt-1">
              提交时间：{formatDateTime(review.submittedAt)}，总分：
              {formatScore(review.totalScore)}
            </div>
          </div>
        ) : null}

        <ErrorAlert message={error} />

        <div className="form-stack">
          {items.map((item, index) => (
            <ExpertReviewItemEditor
              errors={errors[String(index)]}
              index={index}
              item={item}
              key={`${item.itemSnapshot.name}-${index}`}
              onChange={(nextItem) => updateItem(index, nextItem)}
              readOnly={readOnly}
            />
          ))}
        </div>

        {readOnly ? null : (
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            <Button
              disabled={saving || submitting}
              onClick={handleSaveDraft}
              variant="secondary"
            >
              {saving ? '保存中...' : '保存草稿'}
            </Button>
            <Button
              disabled={saving || submitting}
              onClick={handleSubmitClick}
              variant="primary"
            >
              {submitting
                ? '提交中...'
                : review.status === 'returned'
                  ? '重新提交评分'
                  : '提交评分'}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel={
          review.status === 'returned' ? '重新提交评分' : '提交评分'
        }
        description="提交后评分将进入评审流程，除非评审负责人退回，否则不能再修改。确认提交评分吗？"
        loading={submitting}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingSubmitInput(null);
        }}
        onConfirm={() => {
          void handleConfirmSubmit();
        }}
        open={confirmOpen}
        title="确认提交评分？"
      />
    </section>
  );
}

function createFormItems(review: ExpertReview): ExpertReviewItemEditorValue[] {
  return review.items.map((item) => ({
    itemSnapshot: item.itemSnapshot,
    scoreInput:
      item.score === undefined || item.score === null ? '' : String(item.score),
    evaluationDescription: item.evaluationDescription,
    improvementSuggestion: item.improvementSuggestion,
    hasMajorIssue: item.hasMajorIssue,
  }));
}

function buildInput(
  items: ExpertReviewItemEditorValue[],
): SaveExpertReviewInput {
  return {
    items: items.map((item) => {
      const score = parseOptionalScore(item.scoreInput);

      return {
        name: item.itemSnapshot.name,
        ...(score !== null ? { score } : {}),
        evaluationDescription: item.evaluationDescription,
        improvementSuggestion: item.improvementSuggestion,
        hasMajorIssue: item.hasMajorIssue,
      };
    }),
  };
}

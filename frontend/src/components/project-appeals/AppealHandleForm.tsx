'use client';

import { useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import type {
  HandleProjectAppealInput,
  ReviewLevelOption,
} from '@/src/lib/project-appeals/types';
import {
  formatLevel,
  PROJECT_APPEAL_HANDLING_OPINION_MAX_LENGTH,
} from '@/src/lib/project-appeals/utils';

type AppealHandleFormProps = {
  currentFinalLevel?: string | null;
  disabled?: boolean;
  error?: string | null;
  levelLabelByValue: Map<string, string>;
  levelOptions: ReviewLevelOption[];
  onSubmit: (input: HandleProjectAppealInput) => Promise<void>;
  submitting?: boolean;
};

type Decision = HandleProjectAppealInput['decision'];

export function AppealHandleForm({
  currentFinalLevel,
  disabled = false,
  error,
  levelLabelByValue,
  levelOptions,
  onSubmit,
  submitting = false,
}: AppealHandleFormProps) {
  const [adjustLevel, setAdjustLevel] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [decision, setDecision] = useState<Decision>('accepted');
  const [handlingOpinion, setHandlingOpinion] = useState('');
  const [newFinalLevel, setNewFinalLevel] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedNewLevelLabel = useMemo(
    () => formatLevel(newFinalLevel, levelLabelByValue),
    [levelLabelByValue, newFinalLevel],
  );
  const currentLevelLabel = formatLevel(currentFinalLevel, levelLabelByValue);

  function buildPayload(): HandleProjectAppealInput | null {
    const opinion = handlingOpinion.trim();

    if (!opinion) {
      setValidationError('处理意见为必填项。');
      return null;
    }

    if (opinion.length > PROJECT_APPEAL_HANDLING_OPINION_MAX_LENGTH) {
      setValidationError('处理意见不能超过 10000 字。');
      return null;
    }

    if (decision === 'rejected') {
      return {
        decision,
        handlingOpinion: opinion,
      };
    }

    if (!adjustLevel) {
      return {
        decision,
        handlingOpinion: opinion,
      };
    }

    if (!newFinalLevel) {
      setValidationError('请选择新的最终等级。');
      return null;
    }

    if (currentFinalLevel && newFinalLevel === currentFinalLevel) {
      setValidationError('调整等级时请选择与当前最终等级不同的等级。');
      return null;
    }

    return {
      decision,
      handlingOpinion: opinion,
      newFinalLevel,
    };
  }

  function handlePrepareSubmit() {
    setValidationError(null);

    if (buildPayload()) {
      setConfirmOpen(true);
    }
  }

  async function handleConfirmSubmit() {
    const payload = buildPayload();

    if (!payload) {
      setConfirmOpen(false);
      return;
    }

    await onSubmit(payload);
    setConfirmOpen(false);
  }

  const submitLabel =
    decision === 'accepted' ? '提交接受结果' : '提交驳回结果';
  const confirmDescription =
    decision === 'accepted' && adjustLevel && newFinalLevel
      ? `确认接受该申诉，并将最终等级从 ${currentLevelLabel} 调整为 ${selectedNewLevelLabel} 吗？处理结果提交后不可撤回、重开或再次编辑。`
      : `确认${decision === 'accepted' ? '接受' : '驳回'}该申诉吗？处理结果提交后不可撤回、重开或再次编辑。`;

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4">
          <h2 className="m-0 text-lg font-black text-slate-950">处理申诉</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            可接受或驳回申诉；接受时可选择是否调整最终等级。
          </p>
        </div>

        <ErrorAlert message={error ?? validationError} />
        {disabled ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            当前申诉状态不允许处理。
          </div>
        ) : (
          <div className="grid gap-4">
            <div>
              <div className="mb-2 text-xs font-bold text-slate-500">
                处理决定
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    checked={decision === 'accepted'}
                    onChange={() => {
                      setDecision('accepted');
                    }}
                    type="radio"
                  />
                  接受申诉
                </label>
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    checked={decision === 'rejected'}
                    onChange={() => {
                      setDecision('rejected');
                      setAdjustLevel(false);
                      setNewFinalLevel('');
                    }}
                    type="radio"
                  />
                  驳回申诉
                </label>
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-bold text-slate-500">
                处理意见
              </span>
              <textarea
                className="min-h-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                maxLength={PROJECT_APPEAL_HANDLING_OPINION_MAX_LENGTH}
                onChange={(event) => setHandlingOpinion(event.target.value)}
                placeholder="请填写处理意见，1-10000 字。"
                value={handlingOpinion}
              />
            </label>

            {decision === 'accepted' ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
                  <input
                    checked={adjustLevel}
                    onChange={(event) => {
                      setAdjustLevel(event.target.checked);
                      if (!event.target.checked) {
                        setNewFinalLevel('');
                      }
                    }}
                    type="checkbox"
                  />
                  接受申诉并调整最终等级
                </label>
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  当前最终等级：{currentLevelLabel}
                </div>
                {adjustLevel ? (
                  <select
                    className="mt-3 min-h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                    onChange={(event) => setNewFinalLevel(event.target.value)}
                    value={newFinalLevel}
                  >
                    <option value="">请选择新的最终等级</option>
                    {levelOptions.map((option) => (
                      <option key={option.id} value={option.code}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ) : null}

            <div>
              <Button
                disabled={submitting}
                onClick={handlePrepareSubmit}
                variant={decision === 'accepted' ? 'primary' : 'danger'}
              >
                {submitting ? '提交中...' : submitLabel}
              </Button>
            </div>
          </div>
        )}

        <ConfirmDialog
          confirmLabel={submitLabel}
          description={confirmDescription}
          loading={submitting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void handleConfirmSubmit()}
          open={confirmOpen}
          title="确认提交申诉处理结果？"
        />
      </div>
    </section>
  );
}

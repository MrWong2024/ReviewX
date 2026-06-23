'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import type {
  ConfirmConsensusReviewPayload,
  ConsensusReviewResponse,
  ReviewManagerLookupMaps,
  ReviewManagerReferenceData,
} from '../types';
import {
  FALLBACK_REVIEW_LEVEL_OPTIONS,
  FINAL_OPINION_MAX_LENGTH,
  formatConsensusDraftSource,
  formatScore,
  getReviewLevelOptions,
  parseScoreInput,
  shortId,
} from '../utils';

type ConsensusReviewPanelProps = {
  confirming: boolean;
  consensus: ConsensusReviewResponse | null;
  error?: string | null;
  generating: boolean;
  loading: boolean;
  lookupMaps: ReviewManagerLookupMaps;
  onConfirm: (payload: ConfirmConsensusReviewPayload) => Promise<void>;
  onGenerateDraft: () => Promise<void>;
  referenceData: ReviewManagerReferenceData | null;
  reviewSchemeTotalScore?: number | null;
};

type ConfirmFormState = {
  finalLevel: string;
  finalOpinion: string;
  finalScore: string;
  useDraftAsBase: boolean;
};

export function ConsensusReviewPanel({
  confirming,
  consensus,
  error,
  generating,
  loading,
  lookupMaps,
  onConfirm,
  onGenerateDraft,
  referenceData,
  reviewSchemeTotalScore,
}: ConsensusReviewPanelProps) {
  const reviewLevelOptions = useMemo(
    () => getReviewLevelOptions(referenceData),
    [referenceData],
  );
  const [form, setForm] = useState<ConfirmFormState>(() =>
    createFormState(consensus, reviewLevelOptions[0]?.code ?? 'A'),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const resolvedTotalScore =
    consensus?.reviewSchemeSnapshot.totalScore ?? reviewSchemeTotalScore ?? null;
  const isConfirmed = consensus?.status === 'confirmed';
  const canGenerateDraft = consensus?.status !== 'confirmed';

  const levelOptions = useMemo(() => {
    const options =
      reviewLevelOptions.length > 0
        ? reviewLevelOptions
        : FALLBACK_REVIEW_LEVEL_OPTIONS;

    if (
      form.finalLevel &&
      !options.some(
        (option) =>
          option.code === form.finalLevel || option.name === form.finalLevel,
      )
    ) {
      return [
        ...options,
        {
          code: form.finalLevel,
          dictType: 'review_level',
          id: form.finalLevel,
          isActive: true,
          name: form.finalLevel,
          sortOrder: Number.MAX_SAFE_INTEGER,
        },
      ];
    }

    return options;
  }, [form.finalLevel, reviewLevelOptions]);

  useEffect(() => {
    setForm(
      createFormState(consensus, reviewLevelOptions[0]?.code ?? 'A'),
    );
    setFormError(null);
  }, [consensus, reviewLevelOptions]);

  function fillFromDraft() {
    if (!consensus?.draftOpinion && consensus?.draftScore === undefined) {
      return;
    }

    setForm((current) => ({
      ...current,
      finalOpinion: consensus.draftOpinion ?? '',
      finalScore:
        consensus.draftScore === undefined || consensus.draftScore === null
          ? ''
          : String(consensus.draftScore),
      useDraftAsBase: true,
    }));
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const finalOpinion = form.finalOpinion.trim();
    const finalScore = parseScoreInput(form.finalScore);
    const finalLevel = form.finalLevel.trim();

    if (!finalOpinion) {
      setFormError('请填写合议意见。');
      return;
    }

    if (finalOpinion.length > FINAL_OPINION_MAX_LENGTH) {
      setFormError(`合议意见不能超过 ${FINAL_OPINION_MAX_LENGTH} 字。`);
      return;
    }

    if (finalScore === null) {
      setFormError('请填写有效的合议分数。');
      return;
    }

    if (finalScore < 0) {
      setFormError('合议分数不能小于 0。');
      return;
    }

    if (
      resolvedTotalScore !== null &&
      Number.isFinite(resolvedTotalScore) &&
      finalScore > resolvedTotalScore
    ) {
      setFormError(`合议分数不能超过 ${formatScore(resolvedTotalScore)}。`);
      return;
    }

    if (!finalLevel) {
      setFormError('请选择最终等级。');
      return;
    }

    if (
      isConfirmed &&
      !window.confirm('本操作会覆盖当前最终合议结论，确认重新提交吗？')
    ) {
      return;
    }

    setFormError(null);
    await onConfirm({
      finalLevel,
      finalOpinion,
      finalScore,
      useDraftAsBase: form.useDraftAsBase || undefined,
    });
  }

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              合议草稿与最终确认
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              草稿由后端 rule_based 能力生成，最终结论由评审负责人人工确认。
            </p>
          </div>
          {canGenerateDraft ? (
            <Button
              disabled={generating || loading}
              onClick={() => void onGenerateDraft()}
              variant="primary"
            >
              {generating ? '正在生成...' : '生成合议草稿'}
            </Button>
          ) : (
            <Badge tone="success">已确认合议</Badge>
          )}
        </div>

        <ErrorAlert message={error ?? null} />

        {loading ? (
          <LoadingState text="正在加载合议记录..." />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.05fr)]">
            <div className="grid gap-4">
              {consensus ? (
                <ConsensusSnapshot
                  consensus={consensus}
                  lookupMaps={lookupMaps}
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                  <EmptyState text="暂无合议草稿。" />
                </div>
              )}

              {isConfirmed ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  重新确认会覆盖当前最终结论。
                </div>
              ) : null}

              {consensus?.status === 'confirmed' ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-500">
                  已确认的合议不提供覆盖草稿入口；如需调整，请在右侧重新确认最终意见、最终分数和最终等级。
                </div>
              ) : null}
            </div>

            <form
              className="rounded-xl border border-slate-200 bg-white/90 p-4"
              onSubmit={handleConfirm}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-base font-black text-slate-950">
                    人工确认合议
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    最终分数范围：
                    {resolvedTotalScore === null
                      ? '暂未获取评分方案总分，提交失败时以后端错误为准'
                      : `0-${formatScore(resolvedTotalScore)}`}
                  </p>
                </div>
                {consensus &&
                (Boolean(consensus.draftOpinion) ||
                  (consensus.draftScore !== undefined &&
                    consensus.draftScore !== null)) ? (
                  <Button
                    disabled={!consensus}
                    onClick={fillFromDraft}
                    size="sm"
                    variant="secondary"
                  >
                    使用草稿填入
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4">
                <Textarea
                  description={`必填，1-${FINAL_OPINION_MAX_LENGTH} 字。`}
                  id="consensus-final-opinion"
                  label="最终合议意见"
                  onChange={(event) =>
                    setForm({ ...form, finalOpinion: event.target.value })
                  }
                  rows={8}
                  value={form.finalOpinion}
                />
                <div className="text-right text-xs font-semibold text-slate-400">
                  {form.finalOpinion.trim().length} / {FINAL_OPINION_MAX_LENGTH}
                </div>
                <Input
                  id="consensus-final-score"
                  label="最终合议分数"
                  min={0}
                  onChange={(event) =>
                    setForm({ ...form, finalScore: event.target.value })
                  }
                  step="0.01"
                  type="number"
                  value={form.finalScore}
                />
                <Select
                  id="consensus-final-level"
                  label="最终等级"
                  onChange={(event) =>
                    setForm({ ...form, finalLevel: event.target.value })
                  }
                  value={form.finalLevel}
                >
                  <option value="">请选择</option>
                  {levelOptions.map((level) => (
                    <option key={`${level.id}-${level.code}`} value={level.code}>
                      {level.name}
                      {level.code !== level.name ? `（${level.code}）` : ''}
                    </option>
                  ))}
                </Select>
                <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm font-semibold text-slate-600">
                  <input
                    checked={form.useDraftAsBase}
                    className="mt-1 h-4 w-4 accent-cyan-700"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        useDraftAsBase: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <span>本次确认以当前草稿为基础</span>
                </label>
                <ErrorAlert message={formError} />
                <Button disabled={confirming} type="submit" variant="primary">
                  {confirming
                    ? '正在提交...'
                    : isConfirmed
                      ? '重新确认最终结论'
                      : '确认最终合议'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function ConsensusSnapshot({
  consensus,
  lookupMaps,
}: {
  consensus: ConsensusReviewResponse;
  lookupMaps: ReviewManagerLookupMaps;
}) {
  const statusTone = consensus.status === 'confirmed' ? 'success' : 'warning';
  const finalLevelLabel = consensus.finalLevel
    ? lookupMaps.reviewLevelLabelByValue.get(consensus.finalLevel) ??
      consensus.finalLevel
    : '-';

  return (
    <section className="rounded-xl border border-slate-200 bg-white/90 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-black text-slate-950">
            当前合议记录
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            状态：{consensus.status}
          </p>
        </div>
        <Badge tone={statusTone}>
          {consensus.status === 'confirmed' ? '已确认' : '草稿'}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InfoTile
          label="专家数量"
          value={`${consensus.expertReviewStats.submittedCount} / ${consensus.expertReviewStats.expertCount}`}
        />
        <InfoTile
          label="专家平均分"
          value={formatScore(consensus.expertReviewStats.averageScore, '暂无')}
        />
        <InfoTile
          label="评分方案"
          value={displayValue(consensus.reviewSchemeSnapshot.name)}
        />
      </div>

      {consensus.status === 'draft' ? (
        <div className="mt-4 grid gap-3">
          <InfoTile
            label="草稿来源"
            value={formatConsensusDraftSource(consensus.draftSource)}
          />
          <InfoTile
            label="草稿分数"
            value={formatScore(consensus.draftScore, '暂无')}
          />
          <InfoTile
            label="生成时间"
            value={formatDateTime(consensus.draftGeneratedAt)}
          />
          <TextBlock label="草稿意见" value={consensus.draftOpinion} />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <InfoTile
            label="最终分数"
            value={formatScore(consensus.finalScore, '暂无')}
          />
          <InfoTile label="最终等级" value={finalLevelLabel} />
          <InfoTile
            label="确认时间"
            value={formatDateTime(consensus.confirmedAt)}
          />
          <InfoTile
            label="确认人"
            value={formatConfirmedUser(consensus)}
          />
          <TextBlock label="最终意见" value={consensus.finalOpinion} />
        </div>
      )}
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {displayValue(value)}
      </div>
    </div>
  );
}

function formatConfirmedUser(consensus: ConsensusReviewResponse): string {
  if (consensus.confirmedByUser) {
    const phone = consensus.confirmedByUser.phone?.trim();

    return phone
      ? `${consensus.confirmedByUser.name}（${phone}）`
      : consensus.confirmedByUser.name;
  }

  return consensus.confirmedByUserId
    ? `用户（${shortId(consensus.confirmedByUserId)}）`
    : '-';
}

function createFormState(
  consensus: ConsensusReviewResponse | null,
  defaultLevel: string,
): ConfirmFormState {
  if (consensus?.status === 'confirmed') {
    return {
      finalLevel: consensus.finalLevel ?? defaultLevel,
      finalOpinion: consensus.finalOpinion ?? '',
      finalScore:
        consensus.finalScore === undefined || consensus.finalScore === null
          ? ''
          : String(consensus.finalScore),
      useDraftAsBase: false,
    };
  }

  if (consensus?.status === 'draft') {
    return {
      finalLevel: consensus.finalLevel ?? defaultLevel,
      finalOpinion: consensus.draftOpinion ?? '',
      finalScore:
        consensus.draftScore === undefined || consensus.draftScore === null
          ? ''
          : String(consensus.draftScore),
      useDraftAsBase: true,
    };
  }

  return {
    finalLevel: defaultLevel,
    finalOpinion: '',
    finalScore: '',
    useDraftAsBase: false,
  };
}

'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  const consensusFormKeyRef = useRef(getConsensusFormKey(consensus));
  const draftGenerationRequestedRef = useRef(false);
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
    const previousConsensusFormKey = consensusFormKeyRef.current;
    const nextConsensusFormKey = getConsensusFormKey(consensus);

    setForm((current) => {
      const nextForm = createFormState(
        consensus,
        reviewLevelOptions[0]?.code ?? 'A',
      );

      if (
        consensus?.status === 'draft' &&
        (draftGenerationRequestedRef.current ||
          previousConsensusFormKey === nextConsensusFormKey)
      ) {
        return {
          ...nextForm,
          finalOpinion: current.finalOpinion,
          finalScore: current.finalScore,
        };
      }

      return nextForm;
    });
    consensusFormKeyRef.current = nextConsensusFormKey;
    setFormError(null);
  }, [consensus, reviewLevelOptions]);

  async function handleGenerateDraftClick() {
    draftGenerationRequestedRef.current = true;

    try {
      await onGenerateDraft();
    } finally {
      draftGenerationRequestedRef.current = false;
    }
  }

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

    setFormError(null);
    await onConfirm({
      finalLevel,
      finalOpinion,
      finalScore,
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
              草稿根据已提交的专家评分规则汇总生成，最终结论由评审负责人人工确认。
            </p>
          </div>
          {canGenerateDraft ? (
            <Button
              disabled={generating || loading}
              onClick={() => void handleGenerateDraftClick()}
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
          <div
            className={
              isConfirmed
                ? 'grid gap-5'
                : 'grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(380px,1.05fr)]'
            }
          >
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
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/80 px-4 py-3 text-sm font-semibold leading-6 text-cyan-800">
                  最终合议结论已确认。如项目负责人提出异议，请通过申诉流程处理；如需更正录入错误，应走后续专门更正流程。
                </div>
              ) : null}
            </div>

            {!isConfirmed ? (
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
                      草稿仅供复核参考，最终意见、分数和等级需由评审负责人确认。
                    </p>
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
                    {form.finalOpinion.trim().length} /{' '}
                    {FINAL_OPINION_MAX_LENGTH}
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
                      <option
                        key={`${level.id}-${level.code}`}
                        value={level.code}
                      >
                        {level.name}
                        {level.code !== level.name ? `（${level.code}）` : ''}
                      </option>
                    ))}
                  </Select>
                  <ErrorAlert message={formError} />
                  <Button disabled={confirming} type="submit" variant="primary">
                    {confirming ? '正在提交...' : '确认最终合议'}
                  </Button>
                </div>
              </form>
            ) : null}
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
            状态：{formatConsensusRecordStatus(consensus.status)}
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
  const confirmedByUser = consensus.confirmedByUser;
  const name = confirmedByUser?.name.trim();

  if (name) {
    const phone = confirmedByUser?.phone?.trim();

    return phone ? `${name}（${phone}）` : name;
  }

  return consensus.confirmedByUserId ? '确认人信息暂不可用' : '-';
}

function formatConsensusRecordStatus(
  status: ConsensusReviewResponse['status'],
): string {
  switch (status) {
    case 'confirmed':
      return '已确认';
    case 'draft':
      return '草稿';
    default:
      return '未知状态';
  }
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
    };
  }

  if (consensus?.status === 'draft') {
    return {
      finalLevel: consensus.finalLevel ?? defaultLevel,
      finalOpinion: '',
      finalScore: '',
    };
  }

  return {
    finalLevel: defaultLevel,
    finalOpinion: '',
    finalScore: '',
  };
}

function getConsensusFormKey(
  consensus: ConsensusReviewResponse | null,
): string {
  return consensus ? `${consensus.id}:${consensus.status}` : 'empty';
}

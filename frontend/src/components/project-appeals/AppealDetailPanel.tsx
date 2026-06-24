'use client';

import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { formatDateTime } from '@/src/lib/format/date';
import type {
  ProjectAppealDetail,
  ProjectOwnerConsensus,
} from '@/src/lib/project-appeals/types';
import {
  formatAppealNo,
  formatLevel,
  formatLevelChangeResult,
} from '@/src/lib/project-appeals/utils';
import { AppealStatusBadge } from './AppealStatusBadge';

type AppealDetailPanelProps = {
  appeal: ProjectAppealDetail | null;
  consensus?: ProjectOwnerConsensus | null;
  error?: string | null;
  levelLabelByValue: Map<string, string>;
  loading?: boolean;
  title?: string;
};

export function AppealDetailPanel({
  appeal,
  consensus,
  error,
  levelLabelByValue,
  loading = false,
  title = '申诉详情',
}: AppealDetailPanelProps) {
  const confirmedConsensus = consensus ?? appeal?.consensus ?? null;

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              申诉处理结果提交后不可撤回、重开或再次编辑。
            </p>
          </div>
          {appeal ? <AppealStatusBadge status={appeal.status} /> : null}
        </div>

        <ErrorAlert message={error} />
        {loading ? (
          <LoadingState text="正在加载申诉详情..." />
        ) : appeal ? (
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-4">
              <InfoTile label="申诉编号" value={formatAppealNo(appeal.appealNo)} />
              <InfoTile label="提交时间" value={formatDateTime(appeal.createdAt)} />
              <InfoTile label="处理时间" value={formatDateTime(appeal.handledAt)} />
              <InfoTile label="附件数量" value={`${appeal.attachmentCount} 个`} />
              <InfoTile
                label="申诉前等级"
                value={formatLevel(appeal.levelBeforeAppeal, levelLabelByValue)}
              />
              <InfoTile
                label="处理后等级"
                value={formatLevel(
                  appeal.levelAfterHandling || appeal.levelBeforeAppeal,
                  levelLabelByValue,
                )}
              />
              <InfoTile
                label="等级变化"
                value={formatLevelChangeResult(appeal)}
              />
              <InfoTile
                label="处理人"
                value={appeal.handledByUserId ?? '-'}
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-xs font-bold text-slate-500">申诉说明</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {appeal.reason}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <div className="text-sm font-black text-slate-950">处理结果</div>
                <Badge tone={appeal.causedLevelChange ? 'success' : 'muted'}>
                  {formatLevelChangeResult(appeal)}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {appeal.handlingOpinion || '暂无处理意见。'}
              </p>
            </div>

            <ConsensusSummary
              consensus={confirmedConsensus}
              levelLabelByValue={levelLabelByValue}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ConsensusSummary({
  consensus,
  levelLabelByValue,
}: {
  consensus: ProjectOwnerConsensus | null;
  levelLabelByValue: Map<string, string>;
}) {
  if (!consensus) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        暂无已确认合议摘要。
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black text-slate-950">关联合议摘要</div>
          <div className="mt-1 text-xs font-semibold text-cyan-700">
            已确认：{formatDateTime(consensus.confirmedAt)}
          </div>
        </div>
        <Badge tone="primary">
          最终等级 {formatLevel(consensus.finalLevel, levelLabelByValue)}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <InfoTile label="最终分数" value={formatScore(consensus.finalScore)} />
        <InfoTile
          label="专家数量"
          value={`${consensus.expertReviewStats.expertCount} 名`}
        />
        <InfoTile
          label="已提交评分"
          value={`${consensus.expertReviewStats.submittedCount} 份`}
        />
        <InfoTile
          label="平均分"
          value={formatScore(consensus.expertReviewStats.averageScore)}
        />
      </div>
      <div className="mt-4 rounded-lg border border-white/80 bg-white/75 p-3">
        <div className="text-xs font-bold text-slate-500">最终合议意见</div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {consensus.finalOpinion || '暂无合议意见。'}
        </p>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

function formatScore(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

'use client';

import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import type { ReviewSummaryResponse } from '../types';
import { formatScore } from '../utils';

type ReviewSummaryPanelProps = {
  error?: string | null;
  loading: boolean;
  summary: ReviewSummaryResponse | null;
};

export function ReviewSummaryPanel({
  error,
  loading,
  summary,
}: ReviewSummaryPanelProps) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4">
          <h2 className="m-0 text-lg font-black text-slate-950">
            专家评分汇总
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            汇总数据由后端计算，前端只读展示。
          </p>
        </div>
        <ErrorAlert message={error ?? null} />
        {loading ? (
          <LoadingState text="正在加载评分汇总..." />
        ) : summary ? (
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-5">
              <Metric label="已分配专家" value={summary.assignedExpertCount} />
              <Metric label="已提交" value={summary.submittedExpertCount} />
              <Metric label="草稿" value={summary.draftExpertCount} />
              <Metric label="已退回" value={summary.returnedExpertCount} />
              <Metric label="未开始" value={summary.notStartedExpertCount} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric
                label="平均分"
                value={formatScore(summary.averageScore, '暂无')}
              />
              <Metric
                label="最高分"
                value={formatScore(summary.maxScore, '暂无')}
              />
              <Metric
                label="最低分"
                value={formatScore(summary.minScore, '暂无')}
              />
            </div>
            <section className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <h3 className="m-0 text-base font-black text-slate-950">
                各评分项平均分
              </h3>
              {summary.perItemAverageScores &&
              summary.perItemAverageScores.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {[...summary.perItemAverageScores]
                    .sort((left, right) => left.sortOrder - right.sortOrder)
                    .map((item) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                        key={item.name}
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {item.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            满分 {formatScore(item.maxScore)}
                          </div>
                        </div>
                        <div className="text-sm font-black text-cyan-700">
                          {formatScore(item.averageScore, '暂无')}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyState text="暂无评分项平均分。" />
                </div>
              )}
            </section>
          </div>
        ) : (
          <EmptyState text="暂无评分汇总。" />
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
    </div>
  );
}

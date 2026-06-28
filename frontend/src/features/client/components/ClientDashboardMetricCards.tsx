import { Badge } from '@/src/components/feedback/Badge';
import type { ClientDashboardOverviewResponse } from '../types';
import { formatMoneyWan, formatNumber, formatPercent } from '../utils';

type ClientDashboardMetricCardsProps = {
  overview: ClientDashboardOverviewResponse;
};

type MetricCard = {
  label: string;
  value: string;
  helper?: string;
  tone?: 'cyan' | 'emerald' | 'indigo' | 'amber' | 'red' | 'slate';
};

export function ClientDashboardMetricCards({
  overview,
}: ClientDashboardMetricCardsProps) {
  const projectMetrics: MetricCard[] = [
    {
      label: '项目总数',
      value: formatNumber(overview.projectTotals.totalProjects),
      helper: '当前筛选范围',
      tone: 'indigo',
    },
    {
      label: '已安排评审',
      value: formatNumber(overview.projectTotals.scheduled),
      helper: '含时间、地点或会议入口',
      tone: 'cyan',
    },
    {
      label: '已分配专家',
      value: formatNumber(overview.projectTotals.withAssignedExperts),
      helper: '至少 1 名专家',
      tone: 'emerald',
    },
    {
      label: '专家评分完成',
      value: formatNumber(overview.projectTotals.expertReviewsCompleted),
      helper: '提交数达到分配数',
      tone: 'emerald',
    },
    {
      label: '合议已确认',
      value: formatNumber(overview.projectTotals.consensusConfirmed),
      helper: 'confirmed 合议',
      tone: 'indigo',
    },
    {
      label: '已定等级',
      value: formatNumber(overview.projectTotals.withFinalLevel),
      helper: '项目等级或已确认合议等级',
      tone: 'cyan',
    },
    {
      label: '处理中申诉项目',
      value: formatNumber(overview.projectTotals.withPendingAppeal),
      helper: 'submitted / processing',
      tone: 'amber',
    },
  ];

  const fundingMetrics: MetricCard[] = [
    {
      label: '拨款总额',
      value: formatMoneyWan(overview.funding.totalFunding),
      helper: '项目资金口径按万元展示',
      tone: 'indigo',
    },
    {
      label: '已拨款',
      value: formatMoneyWan(overview.funding.allocatedFunding),
      helper: '已拨付资金合计',
      tone: 'cyan',
    },
    {
      label: '拨付率',
      value: formatPercent(overview.funding.allocationRate),
      helper: '已拨款 / 拨款总额',
      tone: 'emerald',
    },
    {
      label: '专家提交率',
      value: formatPercent(overview.expertReviewTotals.submissionRate),
      helper: `${formatNumber(
        overview.expertReviewTotals.submittedExpertReviewCount,
      )} / ${formatNumber(overview.expertReviewTotals.assignedExpertCount)}`,
      tone: 'emerald',
    },
  ];

  const appealMetrics: MetricCard[] = [
    {
      label: '申诉总数',
      value: formatNumber(overview.appealTotals.totalAppeals),
      helper: '全部申诉记录',
      tone: 'slate',
    },
    {
      label: '待处理申诉',
      value: formatNumber(overview.appealTotals.pendingAppeals),
      helper: 'submitted / processing',
      tone: 'amber',
    },
    {
      label: '已通过申诉',
      value: formatNumber(overview.appealTotals.acceptedAppeals),
      helper: 'accepted',
      tone: 'emerald',
    },
    {
      label: '等级调整申诉',
      value: formatNumber(overview.appealTotals.levelChangedAppeals),
      helper: '导致最终等级变化',
      tone: 'red',
    },
  ];

  return (
    <div className="grid gap-5">
      <section>
        <SectionTitle badge="项目进度">总览统计</SectionTitle>
        <MetricGrid metrics={projectMetrics} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.55fr)]">
        <div>
          <SectionTitle badge="资金与专家">资金拨付 / 专家提交率</SectionTitle>
          <MetricGrid metrics={fundingMetrics} />
        </div>
        <div>
          <SectionTitle badge="申诉">申诉统计</SectionTitle>
          <MetricGrid metrics={appealMetrics} compact />
        </div>
      </section>
    </div>
  );
}

function SectionTitle({
  badge,
  children,
}: {
  badge: string;
  children: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Badge tone="primary">{badge}</Badge>
      <h2 className="m-0 text-base font-bold text-slate-950">{children}</h2>
    </div>
  );
}

function MetricGrid({
  compact = false,
  metrics,
}: {
  compact?: boolean;
  metrics: MetricCard[];
}) {
  return (
    <div
      className={
        compact
          ? 'grid gap-3 sm:grid-cols-2'
          : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
      }
    >
      {metrics.map((metric) => (
        <article
          className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(18,31,68,0.07)]"
          key={metric.label}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold text-slate-600">
              {metric.label}
            </div>
            <span
              className={[
                'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                metric.tone === 'emerald' ? 'bg-emerald-500' : '',
                metric.tone === 'cyan' ? 'bg-cyan-500' : '',
                metric.tone === 'indigo' ? 'bg-indigo-500' : '',
                metric.tone === 'amber' ? 'bg-amber-500' : '',
                metric.tone === 'red' ? 'bg-red-500' : '',
                metric.tone === 'slate' || !metric.tone ? 'bg-slate-400' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          </div>
          <div className="mt-3 break-words text-2xl font-black text-slate-950">
            {metric.value}
          </div>
          {metric.helper ? (
            <div className="mt-1 text-xs leading-5 text-slate-500">
              {metric.helper}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

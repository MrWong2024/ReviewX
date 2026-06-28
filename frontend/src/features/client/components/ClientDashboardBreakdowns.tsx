import { EmptyState } from '@/src/components/feedback/EmptyState';
import type {
  ClientDashboardOverviewResponse,
  ClientDashboardProgressStage,
  ClientLookupMaps,
} from '../types';
import {
  formatBatchName,
  formatLookupName,
  formatProgressStage,
  formatReviewLevel,
} from '../utils';

type ClientDashboardBreakdownsProps = {
  lookupMaps: ClientLookupMaps;
  overview: ClientDashboardOverviewResponse;
};

type BreakdownItem = {
  key: string;
  label: string;
  count: number;
};

export function ClientDashboardBreakdowns({
  lookupMaps,
  overview,
}: ClientDashboardBreakdownsProps) {
  const sections: Array<{ items: BreakdownItem[]; title: string }> = [
    {
      title: '最终等级分布',
      items: overview.breakdowns.byFinalLevel.map((item) => ({
        key: item.finalLevel ?? 'empty',
        label:
          item.finalLevel === '其他' || !item.finalLevel
            ? '未定级'
            : formatReviewLevel(
                item.finalLevel,
                lookupMaps.reviewLevelLabelByValue,
              ),
        count: item.count,
      })),
    },
    {
      title: '进度阶段命中',
      items: overview.breakdowns.byProgressStage.map((item) => ({
        key: item.stage,
        label: formatProgressStage(item.stage as ClientDashboardProgressStage),
        count: item.count,
      })),
    },
    {
      title: '项目类型分布',
      items: overview.breakdowns.byProjectType.map((item) => ({
        key: item.projectTypeId ?? 'empty',
        label: formatLookupName(
          item.projectTypeId,
          lookupMaps.treeNameById,
          '未知项目类型',
        ),
        count: item.count,
      })),
    },
    {
      title: '项目状态分布',
      items: overview.breakdowns.byStatus.map((item) => ({
        key: item.statusId ?? 'empty',
        label: formatLookupName(
          item.statusId,
          lookupMaps.dictionaryNameById,
          '未知状态',
        ),
        count: item.count,
      })),
    },
    {
      title: '受理处室分布',
      items: overview.breakdowns.byDepartment.map((item) => ({
        key: item.departmentId ?? 'empty',
        label: formatLookupName(
          item.departmentId,
          lookupMaps.treeNameById,
          '未知受理处室',
        ),
        count: item.count,
      })),
    },
    {
      title: '批次分布',
      items: overview.breakdowns.byBatch.map((item) => ({
        key: item.batchId ?? 'empty',
        label: formatBatchName(item.batchId, lookupMaps.batchNameById),
        count: item.count,
      })),
    },
  ];

  return (
    <section>
      <div className="mb-3">
        <h2 className="m-0 text-base font-bold text-slate-950">分布展示</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          条形长度按当前筛选结果内各分布最高值归一化。
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <BreakdownPanel
            items={section.items}
            key={section.title}
            title={section.title}
          />
        ))}
      </div>
    </section>
  );
}

function BreakdownPanel({
  items,
  title,
}: {
  items: BreakdownItem[];
  title: string;
}) {
  const visibleItems = items.filter((item) => item.count > 0);
  const maxCount = Math.max(1, ...visibleItems.map((item) => item.count));

  return (
    <article className="rounded-lg border border-white/80 bg-white/90 p-4 shadow-[0_14px_34px_rgba(18,31,68,0.07)]">
      <div className="mb-3 text-sm font-bold text-slate-900">{title}</div>
      {visibleItems.length === 0 ? (
        <EmptyState title="暂无分布数据" text="当前筛选范围暂无项目。" />
      ) : (
        <div className="grid gap-3">
          {visibleItems.map((item) => {
            const width = Math.max(4, Math.round((item.count / maxCount) * 100));

            return (
              <div className="grid gap-1" key={item.key}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-semibold text-slate-700">
                    {item.label}
                  </span>
                  <span className="shrink-0 font-bold text-slate-950">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#25337a] to-[#0f9bb4]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

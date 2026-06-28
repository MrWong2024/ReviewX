import { Badge } from '@/src/components/feedback/Badge';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { Pagination } from '@/src/components/ui/Pagination';
import type { ClientDashboardProjectItem, ClientLookupMaps } from '../types';
import {
  formatAppealStatus,
  formatBatchName,
  formatConsensusStatus,
  formatDateTime,
  formatEffectiveFinalLevelSource,
  formatLookupName,
  formatMoneyWan,
  formatNames,
  formatNumber,
  formatProgressStage,
  formatProgressStages,
  formatReviewLevel,
  formatUserLookupName,
  safeText,
} from '../utils';

type ClientDashboardProjectTableProps = {
  items: ClientDashboardProjectItem[];
  lookupMaps: ClientLookupMaps;
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
  total: number;
};

export function ClientDashboardProjectTable({
  items,
  lookupMaps,
  onPageChange,
  page,
  pageSize,
  total,
}: ClientDashboardProjectTableProps) {
  return (
    <section className="panel">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-bold text-slate-950">项目钻取列表</div>
        <div className="mt-1 text-xs text-slate-500">
          共 {total} 个项目；展开行内详情可查看阶段、合议、申诉、资金和协作单位摘要。
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState title="暂无符合条件的项目" text="请调整筛选条件后重试。" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1680px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-50/90">
                  {[
                    '项目编号 / 名称',
                    '批次',
                    '类型',
                    '状态',
                    '承担单位',
                    '项目负责人',
                    '受理处室',
                    '评审负责人',
                    '评审方案',
                    '主阶段',
                    '有效最终等级',
                    '专家评分',
                    '材料',
                    '申诉',
                    '评审现场',
                    '钻取',
                  ].map((title) => (
                    <th
                      className="border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 first:rounded-tl-xl last:rounded-tr-xl"
                      key={title}
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    className="group transition hover:bg-cyan-50/40"
                    key={item.id}
                  >
                    <td className="border-b border-slate-100 px-4 py-3 align-top group-last:border-b-0">
                      <div className="code">{item.projectNo}</div>
                      <div className="mt-1 max-w-64 break-words font-semibold text-slate-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatBatchName(item.batchId, lookupMaps.batchNameById)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatLookupName(
                        item.projectTypeId,
                        lookupMaps.treeNameById,
                        '未知项目类型',
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatLookupName(
                        item.statusId,
                        lookupMaps.dictionaryNameById,
                        '未知状态',
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatLookupName(
                        item.leadOrganizationId,
                        lookupMaps.organizationNameById,
                        '未知单位',
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatUserLookupName(item.ownerUserId, lookupMaps.userNameById)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatLookupName(
                        item.departmentId,
                        lookupMaps.treeNameById,
                        '未知受理处室',
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatUserLookupName(
                        item.reviewManagerId,
                        lookupMaps.userNameById,
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatLookupName(
                        item.reviewSchemeId,
                        lookupMaps.reviewSchemeNameById,
                        '未知方案',
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top group-last:border-b-0">
                      <Badge tone={getStageTone(item.primaryStage)}>
                        {formatProgressStage(item.primaryStage)}
                      </Badge>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top group-last:border-b-0">
                      <div className="font-semibold text-slate-900">
                        {formatReviewLevel(
                          item.effectiveFinalLevel,
                          lookupMaps.reviewLevelLabelByValue,
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatEffectiveFinalLevelSource(
                          item.effectiveFinalLevelSource,
                        )}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatNumber(item.metrics.assignedExpertCount)} /{' '}
                      {formatNumber(item.metrics.submittedExpertReviewCount)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 group-last:border-b-0">
                      {formatNumber(item.metrics.submittedMaterialCount)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top group-last:border-b-0">
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          tone={
                            item.metrics.pendingAppealCount > 0
                              ? 'warning'
                              : 'muted'
                          }
                        >
                          {formatNumber(item.metrics.appealTotalCount)} 次
                        </Badge>
                        {item.metrics.pendingAppealCount > 0 ? (
                          <Badge tone="danger">
                            待处理 {item.metrics.pendingAppealCount}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top group-last:border-b-0">
                      <div className="text-slate-700">
                        {formatDateTime(item.reviewTime)}
                      </div>
                      <div className="mt-1 max-w-44 break-words text-xs text-slate-500">
                        {safeText(item.reviewLocation)}
                      </div>
                      {item.meetingUrl?.trim() ? (
                        <a
                          className="mt-2 inline-flex min-h-7 items-center rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
                          href={item.meetingUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          进入会议 / 直播
                        </a>
                      ) : (
                        <div className="mt-2 text-xs text-slate-400">未配置</div>
                      )}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 align-top group-last:border-b-0">
                      <ProjectDetail item={item} lookupMaps={lookupMaps} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            onPageChange={onPageChange}
            page={page}
            pageSize={pageSize}
            total={total}
          />
        </>
      )}
    </section>
  );
}

function ProjectDetail({
  item,
  lookupMaps,
}: {
  item: ClientDashboardProjectItem;
  lookupMaps: ClientLookupMaps;
}) {
  return (
    <details className="max-w-[520px]">
      <summary className="cursor-pointer select-none text-xs font-semibold text-cyan-700">
        展开详情
      </summary>
      <div className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-sm">
        <DetailGrid
          items={[
            {
              label: '进度明细',
              value: formatProgressStages(item.stages),
            },
            {
              label: '资金',
              value: `${formatMoneyWan(item.allocatedFunding)} / ${formatMoneyWan(
                item.totalFunding,
              )}`,
            },
            {
              label: '学科',
              value: formatNames(
                item.disciplineIds,
                lookupMaps.treeNameById,
                '未知学科',
              ),
            },
            {
              label: '合作单位',
              value: formatNames(
                item.cooperationOrganizationIds,
                lookupMaps.organizationNameById,
                '未知单位',
              ),
            },
            {
              label: '项目等级',
              value: formatReviewLevel(
                item.finalLevel,
                lookupMaps.reviewLevelLabelByValue,
              ),
            },
            {
              label: '原始等级',
              value: formatReviewLevel(
                item.originalLevel,
                lookupMaps.reviewLevelLabelByValue,
              ),
            },
            {
              label: '合议状态',
              value: formatConsensusStatus(item.consensus.status),
            },
            {
              label: '合议分数 / 等级',
              value: item.consensus.status
                ? `${formatNumber(item.consensus.finalScore)} / ${formatReviewLevel(
                    item.consensus.finalLevel,
                    lookupMaps.reviewLevelLabelByValue,
                  )}`
                : '-',
            },
            {
              label: '合议确认时间',
              value: formatDateTime(item.consensus.confirmedAt),
            },
            {
              label: '最新申诉',
              value: item.latestAppeal
                ? `第 ${item.latestAppeal.appealNo} 次，${formatAppealStatus(
                    item.latestAppeal.status,
                  )}`
                : '-',
            },
            {
              label: '最新申诉时间',
              value: item.latestAppeal
                ? formatDateTime(item.latestAppeal.createdAt)
                : '-',
            },
            {
              label: '更新时间',
              value: formatDateTime(item.updatedAt),
            },
          ]}
        />
      </div>
    </details>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="font-semibold text-slate-500">{item.label}</div>
          <div className="mt-0.5 break-words text-slate-800">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function getStageTone(
  stage: ClientDashboardProjectItem['primaryStage'],
): 'danger' | 'muted' | 'primary' | 'success' | 'warning' {
  if (stage === 'appeal_pending') {
    return 'danger';
  }

  if (stage === 'final_level_set' || stage === 'consensus_confirmed') {
    return 'success';
  }

  if (stage === 'expert_reviews_started' || stage === 'consensus_draft') {
    return 'warning';
  }

  if (
    stage === 'review_assigned' ||
    stage === 'scheduled' ||
    stage === 'experts_assigned'
  ) {
    return 'primary';
  }

  return 'muted';
}

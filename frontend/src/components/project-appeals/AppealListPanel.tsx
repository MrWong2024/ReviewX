'use client';

import Link from 'next/link';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { formatDateTime } from '@/src/lib/format/date';
import type { ProjectAppeal } from '@/src/lib/project-appeals/types';
import {
  formatAppealNo,
  formatLevel,
  formatLevelChangeResult,
} from '@/src/lib/project-appeals/utils';
import { AppealStatusBadge } from './AppealStatusBadge';

type AppealListPanelProps = {
  appeals: ProjectAppeal[];
  detailHref: (appeal: ProjectAppeal) => string;
  emptyText?: string;
  error?: string | null;
  levelLabelByValue: Map<string, string>;
  loading?: boolean;
  title?: string;
};

export function AppealListPanel({
  appeals,
  detailHref,
  emptyText = '暂无申诉记录。',
  error,
  levelLabelByValue,
  loading = false,
  title = '申诉记录',
}: AppealListPanelProps) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              每个项目最多可提交 3 次申诉。已有申诉正在处理时，暂不能重复提交。
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
            共 {appeals.length} 条
          </span>
        </div>

        <ErrorAlert message={error} />
        {loading ? (
          <LoadingState text="正在加载申诉记录..." />
        ) : appeals.length === 0 ? (
          <EmptyState text={emptyText} title="暂无申诉" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">申诉</th>
                  <th className="border-b border-slate-200 px-3 py-3">状态</th>
                  <th className="border-b border-slate-200 px-3 py-3">等级</th>
                  <th className="border-b border-slate-200 px-3 py-3">附件</th>
                  <th className="border-b border-slate-200 px-3 py-3">处理</th>
                  <th className="border-b border-slate-200 px-3 py-3">时间</th>
                  <th className="border-b border-slate-200 px-3 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((appeal) => (
                  <tr key={appeal.id} className="align-top">
                    <td className="border-b border-slate-100 px-3 py-3">
                      <div className="font-bold text-slate-900">
                        {formatAppealNo(appeal.appealNo)}
                      </div>
                      <div className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                        {appeal.reasonSummary || appeal.reason}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <AppealStatusBadge status={appeal.status} />
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <div className="font-semibold text-slate-800">
                        {formatLevel(
                          appeal.levelBeforeAppeal,
                          levelLabelByValue,
                        )}
                        {' -> '}
                        {formatLevel(
                          appeal.levelAfterHandling ||
                            appeal.levelBeforeAppeal,
                          levelLabelByValue,
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatLevelChangeResult(appeal)}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {appeal.attachmentCount} 个
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <div className="max-w-xs text-slate-700">
                        {appeal.handlingOpinion || '-'}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <div>提交：{formatDateTime(appeal.createdAt)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        处理：{formatDateTime(appeal.handledAt)}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <Link
                        className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50"
                        href={detailHref(appeal)}
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

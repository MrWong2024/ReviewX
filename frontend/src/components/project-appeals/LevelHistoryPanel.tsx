'use client';

import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { formatDateTime } from '@/src/lib/format/date';
import type { ProjectLevelChangeLog } from '@/src/lib/project-appeals/types';
import {
  formatLevel,
  formatLevelChangeSource,
  shortId,
} from '@/src/lib/project-appeals/utils';

type LevelHistoryPanelProps = {
  error?: string | null;
  history: ProjectLevelChangeLog[];
  levelLabelByValue: Map<string, string>;
  loading?: boolean;
  title?: string;
};

export function LevelHistoryPanel({
  error,
  history,
  levelLabelByValue,
  loading = false,
  title = '等级变更历史',
}: LevelHistoryPanelProps) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              展示原等级、变更后等级、变更原因、来源、时间和操作人。
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
            共 {history.length} 条
          </span>
        </div>

        <ErrorAlert message={error} />
        {loading ? (
          <LoadingState text="正在加载等级变更历史..." />
        ) : history.length === 0 ? (
          <EmptyState text="暂无等级变更记录。" title="暂无记录" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase text-slate-500">
                  <th className="border-b border-slate-200 px-3 py-3">等级</th>
                  <th className="border-b border-slate-200 px-3 py-3">来源</th>
                  <th className="border-b border-slate-200 px-3 py-3">原因</th>
                  <th className="border-b border-slate-200 px-3 py-3">操作人</th>
                  <th className="border-b border-slate-200 px-3 py-3">时间</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="border-b border-slate-100 px-3 py-3 font-semibold text-slate-800">
                      {formatLevel(item.fromLevel, levelLabelByValue)}
                      {' -> '}
                      {formatLevel(item.toLevel, levelLabelByValue)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatLevelChangeSource(item.source)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      <div className="max-w-lg whitespace-pre-wrap text-slate-700">
                        {item.reason || '-'}
                      </div>
                      {item.appealId ? (
                        <div className="mt-1 text-xs text-slate-500">
                          关联申诉 {shortId(item.appealId)}
                        </div>
                      ) : null}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {shortId(item.changedByUserId)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3">
                      {formatDateTime(item.changedAt)}
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

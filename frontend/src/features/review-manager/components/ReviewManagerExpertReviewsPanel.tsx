'use client';

import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { formatDateTime } from '@/src/lib/format/date';
import type {
  ExpertReviewListItem,
  ReviewManagerLookupMaps,
} from '../types';
import {
  canReturnExpertReview,
  formatExpertOrganizations,
  formatScore,
} from '../utils';
import { ReviewManagerProjectStatusBadge } from './ReviewManagerProjectStatusBadge';

type ReviewManagerExpertReviewsPanelProps = {
  error?: string | null;
  items: ExpertReviewListItem[];
  loading: boolean;
  lookupMaps: ReviewManagerLookupMaps;
  onReturnReview: (item: ExpertReviewListItem) => void;
  onSelectReview: (item: ExpertReviewListItem) => void;
  returnDisabled?: boolean;
  returnDisabledMessage?: string;
  selectedExpertUserId?: string | null;
};

export function ReviewManagerExpertReviewsPanel({
  error,
  items,
  loading,
  lookupMaps,
  onReturnReview,
  onSelectReview,
  returnDisabled = false,
  returnDisabledMessage,
  selectedExpertUserId,
}: ReviewManagerExpertReviewsPanelProps) {
  const columns: DataColumn<ExpertReviewListItem>[] = [
    {
      key: 'expert',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">
            {item.expert.name || '未知专家'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {item.expert.phone || '-'}
          </div>
        </div>
      ),
      title: '专家',
    },
    {
      key: 'organizations',
      render: (item) =>
        formatExpertOrganizations(item.expert, lookupMaps.organizationNameById),
      title: '单位',
    },
    {
      key: 'status',
      render: (item) => <ReviewManagerProjectStatusBadge status={item.status} />,
      title: '状态',
    },
    {
      key: 'totalScore',
      render: (item) => formatScore(item.totalScore),
      title: '总分',
    },
    {
      key: 'submittedAt',
      render: (item) => formatDateTime(item.submittedAt),
      title: '提交时间',
    },
    {
      key: 'returnedAt',
      render: (item) => formatDateTime(item.returnedAt),
      title: '退回时间',
    },
    {
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Button
            onClick={() => onSelectReview(item)}
            size="sm"
            variant={
              selectedExpertUserId === item.expert.id ? 'primary' : 'secondary'
            }
          >
            查看详情
          </Button>
          {!returnDisabled && canReturnExpertReview(item) ? (
            <Button
              onClick={() => onReturnReview(item)}
              size="sm"
              variant="danger"
            >
              退回
            </Button>
          ) : null}
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              专家评分列表
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {returnDisabled
                ? (returnDisabledMessage ?? '专家评分当前仅可查看。')
                : '查看已分配专家的评分状态，已提交评分可退回修改。'}
            </p>
          </div>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
            {items.length} 位专家
          </span>
        </div>
        <ErrorAlert message={error ?? null} />
        {loading ? (
          <LoadingState text="正在加载专家评分列表..." />
        ) : (
          <DataTable
            columns={columns}
            emptyText="暂无专家评分记录。"
            getRowKey={(item) => item.expert.id}
            items={items}
          />
        )}
      </div>
    </section>
  );
}

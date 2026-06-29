'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ExpertShell } from '@/src/components/layout/ExpertShell';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  listExpertReviewTasks,
  loadExpertReferenceData,
} from '../api';
import { ExpertTaskStatusBadge } from '../components/ExpertTaskStatusBadge';
import type {
  ExpertReferenceData,
  ExpertReviewTask,
  ExpertReviewViewStatus,
} from '../types';
import {
  buildExpertLookupMaps,
  createEmptyExpertLookupMaps,
  EXPERT_REVIEW_STATUS_OPTIONS,
  formatExpertErrorMessage,
  formatLookupName,
  formatReviewManagerName,
  formatScore,
  getExpertTaskActionLabel,
} from '../utils';

type ExpertTaskFilters = {
  batchId: string;
  reviewManagerId: string;
  reviewSchemeId: string;
  status: '' | ExpertReviewViewStatus;
};

const EMPTY_FILTERS: ExpertTaskFilters = {
  batchId: '',
  reviewManagerId: '',
  reviewSchemeId: '',
  status: '',
};

const PAGE_SIZE = 20;
const PROJECT_REVIEW_SCHEME_MISSING = 'PROJECT_REVIEW_SCHEME_MISSING';
const REVIEW_SCHEME_MISSING_HINT = '项目尚未分配评审方案';
const REVIEW_SCHEME_MISSING_MESSAGE =
  '项目尚未分配评审方案，暂不能评分。';

export function ExpertReviewTasksPage() {
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpertTaskFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<ExpertReviewTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [referenceData, setReferenceData] =
    useState<ExpertReferenceData | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(
    null,
  );
  const [total, setTotal] = useState(0);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildExpertLookupMaps(referenceData)
        : createEmptyExpertLookupMaps(),
    [referenceData],
  );
  const activeBatches = useMemo(
    () => referenceData?.batches.filter((item) => item.isActive) ?? [],
    [referenceData],
  );
  const activeReviewManagers = useMemo(
    () =>
      referenceData?.reviewManagers.filter((item) => item.isActive) ?? [],
    [referenceData],
  );
  const activeReviewSchemes = useMemo(
    () => referenceData?.reviewSchemes.filter((item) => item.isActive) ?? [],
    [referenceData],
  );

  async function loadData(
    nextPage = page,
    nextFilters: ExpertTaskFilters = filters,
    options: { reloadReference?: boolean } = {},
  ) {
    setLoading(true);
    setError(null);

    const [tasksResult, referenceResult] = await Promise.allSettled([
      listExpertReviewTasks({
        batchId: nextFilters.batchId,
        page: nextPage,
        pageSize: PAGE_SIZE,
        reviewManagerId: nextFilters.reviewManagerId,
        reviewSchemeId: nextFilters.reviewSchemeId,
        status: nextFilters.status || undefined,
      }),
      options.reloadReference || !referenceData
        ? loadExpertReferenceData()
        : Promise.resolve(referenceData),
    ]);

    if (tasksResult.status === 'fulfilled') {
      setItems(tasksResult.value.items);
      setPage(tasksResult.value.page);
      setTotal(tasksResult.value.total);
    } else {
      setItems([]);
      setTotal(0);
      setError(`评审任务加载失败。${formatExpertTaskPageError(tasksResult.reason)}`);
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
      setReferenceDataError(null);
    } else {
      setReferenceDataError(formatExpertTaskPageError(referenceResult.reason));
    }

    setLoading(false);
  }

  function updateFilters(nextFilters: ExpertTaskFilters) {
    setFilters(nextFilters);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadData(1, filters);
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    void loadData(1, EMPTY_FILTERS);
  }

  useEffect(() => {
    void loadData(1, EMPTY_FILTERS, { reloadReference: true });
  }, []);

  const columns: DataColumn<ExpertReviewTask>[] = [
    {
      key: 'projectNo',
      render: (item) => <span className="code">{item.project.projectNo}</span>,
      title: '项目编号',
    },
    {
      key: 'name',
      render: (item) => (
        <div className="max-w-64 break-words font-semibold text-slate-900">
          {item.project.name}
        </div>
      ),
      title: '项目名称',
    },
    {
      key: 'batchId',
      render: (item) =>
        formatLookupName(
          item.project.batchId,
          lookupMaps.batchNameById,
          '未知批次',
        ),
      title: '批次',
    },
    {
      key: 'projectStatus',
      render: (item) =>
        formatLookupName(
          item.project.statusId,
          lookupMaps.dictionaryNameById,
          '未知项目状态',
        ),
      title: '项目状态',
    },
    {
      key: 'reviewManager',
      render: (item) =>
        formatReviewManagerName(item.project, lookupMaps.userNameById),
      title: '评审负责人',
    },
    {
      key: 'reviewScheme',
      render: (item) =>
        formatLookupName(
          item.project.reviewSchemeId,
          lookupMaps.reviewSchemeNameById,
          '未知评审方案',
        ),
      title: '评审方案',
    },
    {
      key: 'reviewTime',
      render: (item) => formatDateTime(item.project.reviewTime),
      title: '评审时间',
    },
    {
      key: 'reviewLocation',
      render: (item) => displayValue(item.project.reviewLocation),
      title: '评审地点',
    },
    {
      key: 'materials',
      render: (item) => <Badge tone="primary">{item.materialCount}</Badge>,
      title: '材料数量',
    },
    {
      key: 'status',
      render: (item) => <ExpertTaskStatusBadge status={item.status} />,
      title: '评分状态',
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
      key: 'actions',
      render: (item) => <ExpertReviewTaskAction item={item} />,
      title: '操作',
    },
  ];

  return (
    <ExpertShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Review Tasks</div>
          <h1>我的评审任务</h1>
          <p>查看分配给自己的评审项目，并按评分状态筛选和进入详情。</p>
        </div>
        <Button
          disabled={loading}
          onClick={() => void loadData(page, filters, { reloadReference: true })}
          variant="secondary"
        >
          刷新
        </Button>
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="toolbar-left">
          <Select
            id="expert-filter-status"
            label="评分状态"
            onChange={(event) =>
              updateFilters({
                ...filters,
                status: event.target.value as ExpertTaskFilters['status'],
              })
            }
            value={filters.status}
          >
            <option value="">全部</option>
            {EXPERT_REVIEW_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select
            id="expert-filter-batch"
            label="批次"
            onChange={(event) =>
              updateFilters({ ...filters, batchId: event.target.value })
            }
            value={filters.batchId}
          >
            <option value="">全部</option>
            {activeBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </Select>
          <Select
            id="expert-filter-manager"
            label="评审负责人"
            onChange={(event) =>
              updateFilters({
                ...filters,
                reviewManagerId: event.target.value,
              })
            }
            value={filters.reviewManagerId}
          >
            <option value="">全部</option>
            {activeReviewManagers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {formatReviewManagerOption(manager)}
              </option>
            ))}
          </Select>
          <Select
            id="expert-filter-scheme"
            label="评审方案"
            onChange={(event) =>
              updateFilters({
                ...filters,
                reviewSchemeId: event.target.value,
              })
            }
            value={filters.reviewSchemeId}
          >
            <option value="">全部</option>
            {activeReviewSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            筛选
          </Button>
          <Button onClick={handleReset} variant="ghost">
            重置
          </Button>
        </div>
      </form>

      {referenceDataError ? (
        <ErrorAlert
          message={`基础数据加载失败，部分名称将使用短 ID 兜底：${referenceDataError}`}
        />
      ) : null}
      <ErrorAlert message={error} />

      <section className="panel">
        {loading ? (
          <LoadingState text="正在加载评审任务..." />
        ) : (
          <>
            <DataTable
              columns={columns}
              emptyText="暂无评审任务。"
              getRowKey={(item) => item.project.id}
              items={items}
            />
            <Pagination
              onPageChange={(nextPage) => void loadData(nextPage, filters)}
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
            />
          </>
        )}
      </section>
    </ExpertShell>
  );
}

function formatReviewManagerOption(manager: { name: string; phone?: string }) {
  return manager.phone ? `${manager.name}（${manager.phone}）` : manager.name;
}

function ExpertReviewTaskAction({ item }: { item: ExpertReviewTask }) {
  if (!item.project.reviewSchemeId) {
    return (
      <div className="table-actions">
        <div className="flex max-w-40 flex-col items-start gap-1">
          <Button disabled size="sm" title={REVIEW_SCHEME_MISSING_HINT}>
            暂不能评分
          </Button>
          <span className="text-xs font-medium leading-5 text-slate-500">
            {REVIEW_SCHEME_MISSING_HINT}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="table-actions">
      <Link
        className="inline-flex min-h-7 items-center rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
        href={`/expert/review-tasks/${item.project.id}`}
      >
        {getExpertTaskActionLabel(item.status)}
      </Link>
    </div>
  );
}

function formatExpertTaskPageError(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === PROJECT_REVIEW_SCHEME_MISSING) {
      return REVIEW_SCHEME_MISSING_MESSAGE;
    }

    if (error.status === 409) {
      return getErrorMessage(error);
    }
  }

  return formatExpertErrorMessage(error);
}

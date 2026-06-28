'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ReviewManagerShell } from '@/src/components/layout/ReviewManagerShell';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  listReviewManagerProjects,
  loadReviewManagerReferenceData,
} from '../api';
import type {
  ReviewManagerProjectListItem,
  ReviewManagerReferenceData,
} from '../types';
import {
  buildReviewManagerLookupMaps,
  createEmptyReviewManagerLookupMaps,
  formatLookupName,
  formatReviewManagerErrorMessage,
} from '../utils';

type ProjectFilters = {
  batchId: string;
  keyword: string;
  reviewSchemeId: string;
  statusId: string;
};

const EMPTY_FILTERS: ProjectFilters = {
  batchId: '',
  keyword: '',
  reviewSchemeId: '',
  statusId: '',
};

const PAGE_SIZE = 20;
const PROJECT_ACTION_LINK_CLASS_NAME =
  'inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-slate-950';

export function ReviewManagerProjectsPage() {
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<ReviewManagerProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [referenceData, setReferenceData] =
    useState<ReviewManagerReferenceData | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(
    null,
  );
  const [total, setTotal] = useState(0);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildReviewManagerLookupMaps(referenceData)
        : createEmptyReviewManagerLookupMaps(),
    [referenceData],
  );
  const activeBatches = useMemo(
    () => referenceData?.batches.filter((item) => item.isActive) ?? [],
    [referenceData],
  );
  const activeStatuses = useMemo(
    () => referenceData?.projectStatuses.filter((item) => item.isActive) ?? [],
    [referenceData],
  );
  const activeReviewSchemes = useMemo(
    () =>
      referenceData?.reviewSchemes.filter((item) => item.isActive) ?? [],
    [referenceData],
  );

  async function loadData(
    nextPage = page,
    nextFilters: ProjectFilters = filters,
    options: { reloadReference?: boolean } = {},
  ) {
    setLoading(true);
    setError(null);

    const [projectsResult, referenceResult] = await Promise.allSettled([
      listReviewManagerProjects({
        batchId: nextFilters.batchId,
        keyword: nextFilters.keyword.trim(),
        page: nextPage,
        pageSize: PAGE_SIZE,
        reviewSchemeId: nextFilters.reviewSchemeId,
        statusId: nextFilters.statusId,
      }),
      options.reloadReference || !referenceData
        ? loadReviewManagerReferenceData()
        : Promise.resolve(referenceData),
    ]);

    if (projectsResult.status === 'fulfilled') {
      setItems(projectsResult.value.items);
      setPage(projectsResult.value.page);
      setTotal(projectsResult.value.total);
    } else {
      setItems([]);
      setTotal(0);
      setError(
        `负责项目加载失败。${formatReviewManagerErrorMessage(
          projectsResult.reason,
        )}`,
      );
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
      setReferenceDataError(null);
    } else {
      setReferenceDataError(
        formatReviewManagerErrorMessage(referenceResult.reason),
      );
    }

    setLoading(false);
  }

  function updateFilters(nextFilters: ProjectFilters) {
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

  const columns: DataColumn<ReviewManagerProjectListItem>[] = [
    {
      key: 'projectNo',
      render: (item) => <span className="code">{item.projectNo}</span>,
      title: '项目编号',
    },
    {
      key: 'name',
      render: (item) => (
        <div className="max-w-64 break-words font-semibold text-slate-900">
          {item.name}
        </div>
      ),
      title: '项目名称',
    },
    {
      key: 'projectTypeId',
      render: (item) =>
        formatLookupName(item.projectTypeId, lookupMaps.treeNameById, '未知类型'),
      title: '项目类型',
    },
    {
      key: 'leadOrganizationId',
      render: (item) =>
        formatLookupName(
          item.leadOrganizationId,
          lookupMaps.organizationNameById,
          '未知单位',
        ),
      title: '承担单位',
    },
    {
      key: 'ownerUserId',
      render: (item) =>
        formatLookupName(item.ownerUserId, lookupMaps.userNameById, '未知负责人'),
      title: '项目负责人',
    },
    {
      key: 'statusId',
      render: (item) =>
        formatLookupName(
          item.statusId,
          lookupMaps.dictionaryNameById,
          '未知状态',
        ),
      title: '项目状态',
    },
    {
      key: 'reviewSchemeId',
      render: (item) =>
        formatLookupName(
          item.reviewSchemeId,
          lookupMaps.reviewSchemeNameById,
          '未知评审方案',
        ),
      title: '评审方案',
    },
    {
      key: 'reviewTime',
      render: (item) => formatDateTime(item.reviewTime),
      title: '评审时间',
    },
    {
      key: 'reviewLocation',
      render: (item) => displayValue(item.reviewLocation),
      title: '评审地点',
    },
    {
      key: 'actions',
      render: (item) => (
        <div className="flex flex-wrap gap-2">
          <Link
            className={PROJECT_ACTION_LINK_CLASS_NAME}
            href={`/review-manager/projects/${item.id}`}
          >
            项目总览
          </Link>
          <Link
            className={PROJECT_ACTION_LINK_CLASS_NAME}
            href={`/review-manager/projects/${item.id}/review-organization`}
          >
            评审组织
          </Link>
          <Link
            className={PROJECT_ACTION_LINK_CLASS_NAME}
            href={`/review-manager/projects/${item.id}/consensus`}
          >
            合议处理
          </Link>
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <ReviewManagerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Managed Projects</div>
          <h1>负责项目</h1>
          <p>查看当前评审负责人负责的项目，并进入项目总览、评审组织或合议处理。</p>
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
          <Input
            id="review-manager-project-keyword"
            label="关键词"
            onChange={(event) =>
              updateFilters({ ...filters, keyword: event.target.value })
            }
            placeholder="项目编号或名称"
            value={filters.keyword}
          />
          <Select
            id="review-manager-project-batch"
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
            id="review-manager-project-status"
            label="项目状态"
            onChange={(event) =>
              updateFilters({ ...filters, statusId: event.target.value })
            }
            value={filters.statusId}
          >
            <option value="">全部</option>
            {activeStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>
          <Select
            id="review-manager-project-scheme"
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
          <LoadingState text="正在加载负责项目..." />
        ) : (
          <>
            <DataTable
              columns={columns}
              emptyText="暂无负责项目。"
              getRowKey={(item) => item.id}
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
    </ReviewManagerShell>
  );
}

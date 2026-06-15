'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ProjectOwnerShell } from '@/src/components/layout/ProjectOwnerShell';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  flattenTree,
  indentedTreeLabel,
} from '@/src/lib/tree/build-tree';
import {
  listProjectOwnerProjects,
  loadProjectOwnerReferenceData,
} from '../api';
import type {
  ProjectOwnerProject,
  ProjectOwnerReferenceData,
} from '../types';
import {
  buildProjectOwnerLookupMaps,
  createEmptyProjectOwnerLookupMaps,
  formatLookupName,
  formatNames,
  formatOptionalName,
} from '../utils';

type ProjectOwnerFilters = {
  batchId: string;
  projectTypeId: string;
  reviewManagerId: string;
  reviewSchemeId: string;
  statusId: string;
};

const EMPTY_FILTERS: ProjectOwnerFilters = {
  batchId: '',
  projectTypeId: '',
  reviewManagerId: '',
  reviewSchemeId: '',
  statusId: '',
};

const PAGE_SIZE = 20;

export function ProjectOwnerProjectsPage() {
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectOwnerFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<ProjectOwnerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [referenceData, setReferenceData] =
    useState<ProjectOwnerReferenceData | null>(null);
  const [total, setTotal] = useState(0);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildProjectOwnerLookupMaps(referenceData)
        : createEmptyProjectOwnerLookupMaps(),
    [referenceData],
  );
  const activeBatches = useMemo(
    () => referenceData?.batches.filter((item) => item.isActive) ?? [],
    [referenceData],
  );
  const projectTypeOptions = useMemo(
    () =>
      flattenTree(
        referenceData?.treeDictionaries.filter(
          (item) => item.treeType === 'project_type' && item.isActive,
        ) ?? [],
      ),
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
    nextFilters: ProjectOwnerFilters = filters,
    options: { reloadReference?: boolean } = {},
  ) {
    setLoading(true);
    setError(null);

    try {
      const [response, nextReferenceData] = await Promise.all([
        listProjectOwnerProjects({
          batchId: nextFilters.batchId,
          page: nextPage,
          pageSize: PAGE_SIZE,
          projectTypeId: nextFilters.projectTypeId,
          reviewManagerId: nextFilters.reviewManagerId,
          reviewSchemeId: nextFilters.reviewSchemeId,
          statusId: nextFilters.statusId,
        }),
        options.reloadReference || !referenceData
          ? loadProjectOwnerReferenceData()
          : Promise.resolve(referenceData),
      ]);

      setReferenceData(nextReferenceData);
      setItems(response.items);
      setPage(response.page);
      setTotal(response.total);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  function updateFilters(nextFilters: ProjectOwnerFilters) {
    setFilters(nextFilters);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadData(1, filters);
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    loadData(1, EMPTY_FILTERS);
  }

  useEffect(() => {
    loadData(1, EMPTY_FILTERS, { reloadReference: true });
  }, []);

  const columns: DataColumn<ProjectOwnerProject>[] = [
    {
      key: 'projectNo',
      render: (item) => <span className="code">{item.projectNo}</span>,
      title: '项目编号',
    },
    { key: 'name', render: (item) => item.name, title: '项目名称' },
    {
      key: 'batchId',
      render: (item) =>
        formatLookupName(item.batchId, lookupMaps.batchNameById, '未知批次'),
      title: '批次',
    },
    {
      key: 'projectTypeId',
      render: (item) =>
        formatOptionalName(
          item.projectTypeId,
          lookupMaps.treeNameById,
          '未知项目类型',
        ),
      title: '项目类型',
    },
    {
      key: 'statusId',
      render: (item) =>
        formatOptionalName(
          item.statusId,
          lookupMaps.dictionaryNameById,
          '未知项目状态',
        ),
      title: '项目状态',
    },
    {
      key: 'disciplineIds',
      render: (item) =>
        formatNames(item.disciplineIds, lookupMaps.treeNameById, '未知学科'),
      title: '学科',
    },
    {
      key: 'leadOrganizationId',
      render: (item) =>
        formatOptionalName(
          item.leadOrganizationId,
          lookupMaps.organizationNameById,
          '未知单位',
        ),
      title: '承担单位',
    },
    {
      key: 'reviewManagerId',
      render: (item) =>
        formatOptionalName(
          item.reviewManagerId,
          lookupMaps.userNameById,
          '未知评审负责人',
        ),
      title: '评审负责人',
    },
    {
      key: 'reviewSchemeId',
      render: (item) =>
        formatOptionalName(
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
      key: 'materialCount',
      render: (item) => <Badge tone="primary">{item.materialCount}</Badge>,
      title: '材料数量',
    },
    {
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Link
            className="inline-flex min-h-7 items-center rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
            href={`/project-owner/projects/${item.id}`}
          >
            查看详情
          </Link>
          <Link
            className="inline-flex min-h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            href={`/project-owner/projects/${item.id}#materials`}
          >
            管理材料
          </Link>
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <ProjectOwnerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">My Projects</div>
          <h1>我的项目</h1>
          <p>查看本人负责的项目、评审安排和材料提交情况。</p>
        </div>
      </div>

      {referenceData ? (
        <>
          <form className="toolbar" onSubmit={handleSearch}>
            <div className="toolbar-left">
              <Select
                id="project-owner-filter-batch"
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
                id="project-owner-filter-type"
                label="项目类型"
                onChange={(event) =>
                  updateFilters({
                    ...filters,
                    projectTypeId: event.target.value,
                  })
                }
                value={filters.projectTypeId}
              >
                <option value="">全部</option>
                {projectTypeOptions.map(({ depth, hasChildren, item }) => (
                  <option key={item.id} value={item.id}>
                    {indentedTreeLabel(item.name, depth, hasChildren)}
                  </option>
                ))}
              </Select>
              <Select
                id="project-owner-filter-status"
                label="项目状态"
                onChange={(event) =>
                  updateFilters({ ...filters, statusId: event.target.value })
                }
                value={filters.statusId}
              >
                <option value="">全部</option>
                {referenceData.projectStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </Select>
              <Select
                id="project-owner-filter-manager"
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
                id="project-owner-filter-scheme"
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

          <ErrorAlert message={error} />

          <section className="panel">
            {loading ? (
              <LoadingState text="正在加载我的项目..." />
            ) : (
              <>
                <DataTable
                  columns={columns}
                  emptyText="当前账号暂无负责项目，请联系管理员确认项目负责人绑定关系。"
                  getRowKey={(item) => item.id}
                  items={items}
                />
                <Pagination
                  onPageChange={(nextPage) => loadData(nextPage, filters)}
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                />
              </>
            )}
          </section>
        </>
      ) : (
        <section className="panel">
          {loading ? (
            <LoadingState text="正在加载项目和基础数据..." />
          ) : (
            <div className="panel-body">
              <ErrorAlert message={error ?? '基础数据加载失败，请稍后重试。'} />
              <Button
                onClick={() =>
                  loadData(1, filters, { reloadReference: true })
                }
                variant="secondary"
              >
                重试
              </Button>
            </div>
          )}
        </section>
      )}
    </ProjectOwnerShell>
  );
}

function formatReviewManagerOption(manager: { name: string; phone?: string }) {
  return manager.phone ? `${manager.name}（${manager.phone}）` : manager.name;
}

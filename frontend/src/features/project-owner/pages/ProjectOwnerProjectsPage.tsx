'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ProjectOwnerShell } from '@/src/components/layout/ProjectOwnerShell';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Pagination } from '@/src/components/ui/Pagination';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import { listProjectOwnerProjects } from '../api';
import type { ProjectOwnerProject } from '../types';
import { formatNames, formatOptionalName } from '../utils';

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
const emptyNameMap = new Map<string, string>();

export function ProjectOwnerProjectsPage() {
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectOwnerFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<ProjectOwnerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  async function loadData(
    nextPage = page,
    nextFilters: ProjectOwnerFilters = filters,
  ) {
    setLoading(true);
    setError(null);

    try {
      const response = await listProjectOwnerProjects({
        batchId: nextFilters.batchId,
        page: nextPage,
        pageSize: PAGE_SIZE,
        projectTypeId: nextFilters.projectTypeId,
        reviewManagerId: nextFilters.reviewManagerId,
        reviewSchemeId: nextFilters.reviewSchemeId,
        statusId: nextFilters.statusId,
      });
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
    loadData(1, EMPTY_FILTERS);
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
      render: (item) => item.batchId,
      title: '批次',
    },
    {
      key: 'projectTypeId',
      render: (item) => formatOptionalName(item.projectTypeId, emptyNameMap),
      title: '项目类型',
    },
    {
      key: 'statusId',
      render: (item) => formatOptionalName(item.statusId, emptyNameMap),
      title: '项目状态',
    },
    {
      key: 'disciplineIds',
      render: (item) => formatNames(item.disciplineIds, emptyNameMap),
      title: '学科',
    },
    {
      key: 'leadOrganizationId',
      render: (item) =>
        formatOptionalName(item.leadOrganizationId, emptyNameMap),
      title: '承担单位',
    },
    {
      key: 'reviewManagerId',
      render: (item) => formatOptionalName(item.reviewManagerId, emptyNameMap),
      title: '评审负责人',
    },
    {
      key: 'reviewSchemeId',
      render: (item) => formatOptionalName(item.reviewSchemeId, emptyNameMap),
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

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800 shadow-sm">
        当前后端未提供 project_owner 可访问的主数据名称映射接口；筛选项请填写对应 ID，列表中相关字段暂以 ID 兜底展示。
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="toolbar-left">
          <Input
            id="project-owner-filter-batch"
            label="批次 ID"
            onChange={(event) =>
              updateFilters({ ...filters, batchId: event.target.value.trim() })
            }
            value={filters.batchId}
          />
          <Input
            id="project-owner-filter-type"
            label="项目类型 ID"
            onChange={(event) =>
              updateFilters({
                ...filters,
                projectTypeId: event.target.value.trim(),
              })
            }
            value={filters.projectTypeId}
          />
          <Input
            id="project-owner-filter-status"
            label="项目状态 ID"
            onChange={(event) =>
              updateFilters({ ...filters, statusId: event.target.value.trim() })
            }
            value={filters.statusId}
          />
          <Input
            id="project-owner-filter-manager"
            label="评审负责人 ID"
            onChange={(event) =>
              updateFilters({
                ...filters,
                reviewManagerId: event.target.value.trim(),
              })
            }
            value={filters.reviewManagerId}
          />
          <Input
            id="project-owner-filter-scheme"
            label="评审方案 ID"
            onChange={(event) =>
              updateFilters({
                ...filters,
                reviewSchemeId: event.target.value.trim(),
              })
            }
            value={filters.reviewSchemeId}
          />
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
    </ProjectOwnerShell>
  );
}

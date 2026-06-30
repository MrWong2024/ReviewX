'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import { getProjectOrganizationStatus } from '@/src/lib/labels/project-review-organization-labels';
import {
  flattenTree,
  treeOptionLabel,
} from '@/src/lib/tree/build-tree';
import { BatchExpertsModal } from '../components/project-review-organization/BatchExpertsModal';
import { BatchReviewAssignmentModal } from '../components/project-review-organization/BatchReviewAssignmentModal';
import { ReviewAssignmentModal } from '../components/project-review-organization/ReviewAssignmentModal';
import {
  listBatches,
  listDictionaries,
  listOrganizations,
  listProjects,
  listReviewSchemes,
  listTreeDictionaries,
  listUsers,
} from '../api';
import type {
  AdminUser,
  Batch,
  Dictionary,
  Organization,
  Project,
  ReviewScheme,
  TreeDictionary,
} from '../types';

type BooleanFilter = '' | 'false' | 'true';

type ProjectFilters = {
  batchId: string;
  hasReviewManager: BooleanFilter;
  hasReviewScheme: BooleanFilter;
  keyword: string;
  projectTypeId: string;
  reviewManagerId: string;
  reviewSchemeId: string;
  statusId: string;
};

const PAGE_SIZE = 100;

const EMPTY_FILTERS: ProjectFilters = {
  batchId: '',
  hasReviewManager: '',
  hasReviewScheme: '',
  keyword: '',
  projectTypeId: '',
  reviewManagerId: '',
  reviewSchemeId: '',
  statusId: '',
};

const PROJECT_ORGANIZATION_STATUS_HEADER_CLASS =
  'sticky right-[200px] z-30 w-[160px] min-w-[160px] bg-slate-50/95 shadow-[-1px_0_0_rgba(203,213,225,0.9)]';
const PROJECT_ORGANIZATION_STATUS_CELL_CLASS =
  'sticky right-[200px] z-20 w-[160px] min-w-[160px] whitespace-nowrap bg-white shadow-[-1px_0_0_rgba(203,213,225,0.9)] group-hover:bg-cyan-50/80';
const PROJECT_ACTIONS_HEADER_CLASS =
  'sticky right-0 z-40 w-[200px] min-w-[200px] bg-slate-50/95 shadow-[-8px_0_12px_rgba(15,23,42,0.06)]';
const PROJECT_ACTIONS_CELL_CLASS =
  'sticky right-0 z-30 w-[200px] min-w-[200px] bg-white shadow-[-8px_0_12px_rgba(15,23,42,0.06)] group-hover:bg-cyan-50/80';

export function ProjectsPage() {
  const [assignmentTarget, setAssignmentTarget] = useState<Project | null>(null);
  const [batchAssignmentProjects, setBatchAssignmentProjects] = useState<
    Project[]
  >([]);
  const [batchExpertsProjects, setBatchExpertsProjects] = useState<Project[]>(
    [],
  );
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [page, setPage] = useState(1);
  const [reviewManagers, setReviewManagers] = useState<AdminUser[]>([]);
  const [reviewSchemes, setReviewSchemes] = useState<ReviewScheme[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [treeDictionaries, setTreeDictionaries] = useState<TreeDictionary[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedProjects = useMemo(
    () => items.filter((item) => selected.has(item.id)),
    [items, selected],
  );
  const allCurrentPageSelected =
    items.length > 0 && items.every((item) => selected.has(item.id));

  const batchNameById = useMemo(
    () => new Map(batches.map((item) => [item.id, item.name])),
    [batches],
  );
  const dictionaryNameById = useMemo(
    () => new Map(dictionaries.map((item) => [item.id, item.name])),
    [dictionaries],
  );
  const organizationNameById = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations],
  );
  const schemeNameById = useMemo(
    () => new Map(reviewSchemes.map((item) => [item.id, item.name])),
    [reviewSchemes],
  );
  const treeNameById = useMemo(
    () =>
      new Map(
        treeDictionaries.map((item) => [
          item.id,
          item.fullName || item.name,
        ]),
      ),
    [treeDictionaries],
  );
  const userNameById = useMemo(
    () =>
      new Map(
        users.map((user) => [user.id, `${user.name}（${user.phone}）`]),
      ),
    [users],
  );

  const projectTypes = treeDictionaries.filter(
    (item) => item.treeType === 'project_type',
  );
  const projectTypeOptions = useMemo(
    () => flattenTree(projectTypes),
    [projectTypes],
  );
  const projectStatuses = dictionaries.filter(
    (item) => item.dictType === 'project_status',
  );

  useEffect(() => {
    loadOptions();
    loadData(1, EMPTY_FILTERS);
  }, []);

  async function loadOptions() {
    try {
      const [
        batchResponse,
        dictionaryResponse,
        organizationResponse,
        projectTypeResponse,
        disciplineResponse,
        departmentResponse,
        managerResponse,
        userResponse,
        schemeResponse,
      ] = await Promise.all([
        listBatches({ page: 1, pageSize: 1000 }),
        listDictionaries({ dictType: 'project_status' }),
        listOrganizations({ page: 1, pageSize: 1000 }),
        listTreeDictionaries({ treeType: 'project_type' }),
        listTreeDictionaries({ treeType: 'discipline' }),
        listTreeDictionaries({ treeType: 'department' }),
        listUsers({
          isActive: true,
          page: 1,
          pageSize: 1000,
          role: 'review_manager',
        }),
        listUsers({ page: 1, pageSize: 1000 }),
        listReviewSchemes(),
      ]);

      setBatches(batchResponse.items);
      setDictionaries(dictionaryResponse);
      setOrganizations(organizationResponse.items);
      setTreeDictionaries([
        ...projectTypeResponse,
        ...disciplineResponse,
        ...departmentResponse,
      ]);
      setReviewManagers(managerResponse.items);
      setUsers(userResponse.items);
      setReviewSchemes(schemeResponse);
    } catch {
      setBatches([]);
      setDictionaries([]);
      setOrganizations([]);
      setTreeDictionaries([]);
      setReviewManagers([]);
      setUsers([]);
      setReviewSchemes([]);
    }
  }

  async function loadData(nextPage = page, nextFilters = filters) {
    setLoading(true);
    setError(null);

    try {
      const response = await listProjects({
        batchId: nextFilters.batchId,
        hasReviewManager: toBooleanQuery(nextFilters.hasReviewManager),
        hasReviewScheme: toBooleanQuery(nextFilters.hasReviewScheme),
        keyword: nextFilters.keyword.trim(),
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
      setSelectedIds([]);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  function updateFilters(nextFilters: ProjectFilters) {
    setFilters(nextFilters);
    setSelectedIds([]);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    loadData(1, filters);
  }

  function handleReset() {
    setFilters(EMPTY_FILTERS);
    setNotice(null);
    loadData(1, EMPTY_FILTERS);
  }

  function toggleProject(projectId: string) {
    setSelectedIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  }

  function toggleCurrentPage() {
    if (allCurrentPageSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !items.some((item) => item.id === id)),
      );
      return;
    }

    setSelectedIds((current) => [
      ...current,
      ...items
        .map((item) => item.id)
        .filter((id) => !current.includes(id)),
    ]);
  }

  function handleAssignmentSaved() {
    setAssignmentTarget(null);
    setNotice('已保存分配。');
    loadData(page, filters);
  }

  function handleBatchAssignmentCompleted() {
    setNotice('批量分配完成。');
    loadData(page, filters);
  }

  function handleBatchExpertsCompleted() {
    setNotice('批量专家设置完成。');
    loadData(page, filters);
  }

  const columns: DataColumn<Project>[] = [
    {
      key: 'select',
      render: (item) => (
        <input
          checked={selected.has(item.id)}
          className="h-4 w-4 accent-cyan-700"
          onChange={() => toggleProject(item.id)}
          type="checkbox"
        />
      ),
      title: '选择',
    },
    {
      key: 'projectNo',
      render: (item) => <span className="code">{item.projectNo}</span>,
      title: '项目编号',
    },
    { key: 'name', render: (item) => item.name, title: '项目名称' },
    {
      key: 'batchId',
      render: (item) => batchNameById.get(item.batchId) ?? item.batchId,
      title: '批次',
    },
    {
      key: 'projectTypeId',
      render: (item) => formatOptionalName(item.projectTypeId, treeNameById),
      title: '项目类型',
    },
    {
      key: 'statusId',
      render: (item) => formatOptionalName(item.statusId, dictionaryNameById),
      title: '项目状态',
    },
    {
      key: 'disciplineIds',
      render: (item) => formatNames(item.disciplineIds, treeNameById),
      title: '学科',
    },
    {
      key: 'leadOrganizationId',
      render: (item) =>
        formatOptionalName(item.leadOrganizationId, organizationNameById),
      title: '承担单位',
    },
    {
      key: 'reviewManagerId',
      render: (item) => formatOptionalName(item.reviewManagerId, userNameById),
      title: '评审负责人',
    },
    {
      key: 'reviewSchemeId',
      render: (item) => formatOptionalName(item.reviewSchemeId, schemeNameById),
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
      key: 'meetingUrl',
      render: (item) =>
        item.meetingUrl ? (
          <a
            className="font-semibold text-cyan-700 hover:text-cyan-900"
            href={item.meetingUrl}
            rel="noreferrer"
            target="_blank"
          >
            打开
          </a>
        ) : (
          '-'
        ),
      title: '会议链接',
    },
    {
      cellClassName: PROJECT_ORGANIZATION_STATUS_CELL_CLASS,
      headerClassName: PROJECT_ORGANIZATION_STATUS_HEADER_CLASS,
      key: 'organizationStatus',
      render: (item) => {
        const status = getProjectOrganizationStatus(item);

        return <Badge tone={status.tone}>{status.label}</Badge>;
      },
      title: '组织状态',
    },
    {
      cellClassName: PROJECT_ACTIONS_CELL_CLASS,
      headerClassName: PROJECT_ACTIONS_HEADER_CLASS,
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Button
            onClick={() => {
              setNotice(null);
              setAssignmentTarget(item);
            }}
            size="sm"
            variant="secondary"
          >
            分配
          </Button>
          <Link
            className="inline-flex min-h-7 items-center rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
            href={`/admin/projects/${item.id}/review-organization`}
          >
            评审组织
          </Link>
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>项目评审组织</h1>
          <p>
            查看已导入项目，分配评审负责人和评审方案，并进入项目评审组织页面维护评审时间、地点、会议链接和专家。
          </p>
        </div>
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="toolbar-left">
          <Input
            id="project-keyword"
            label="关键词"
            onChange={(event) =>
              updateFilters({ ...filters, keyword: event.target.value })
            }
            placeholder="项目编号或名称"
            value={filters.keyword}
          />
          <Select
            id="project-batch"
            label="批次"
            onChange={(event) =>
              updateFilters({ ...filters, batchId: event.target.value })
            }
            value={filters.batchId}
          >
            <option value="">全部</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-type"
            label="项目类型"
            onChange={(event) =>
              updateFilters({ ...filters, projectTypeId: event.target.value })
            }
            value={filters.projectTypeId}
          >
            <option value="">全部</option>
            {projectTypeOptions.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
          <Select
            id="project-status"
            label="项目状态"
            onChange={(event) =>
              updateFilters({ ...filters, statusId: event.target.value })
            }
            value={filters.statusId}
          >
            <option value="">全部</option>
            {projectStatuses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-review-manager"
            label="评审负责人"
            onChange={(event) =>
              updateFilters({ ...filters, reviewManagerId: event.target.value })
            }
            value={filters.reviewManagerId}
          >
            <option value="">全部</option>
            {reviewManagers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}（{manager.phone}）
              </option>
            ))}
          </Select>
          <Select
            id="project-scheme"
            label="评审方案"
            onChange={(event) =>
              updateFilters({ ...filters, reviewSchemeId: event.target.value })
            }
            value={filters.reviewSchemeId}
          >
            <option value="">全部</option>
            {reviewSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-has-review-manager"
            label="是否已分配负责人"
            onChange={(event) =>
              updateFilters({
                ...filters,
                hasReviewManager: event.target.value as BooleanFilter,
              })
            }
            value={filters.hasReviewManager}
          >
            <option value="">全部</option>
            <option value="true">已分配</option>
            <option value="false">未分配</option>
          </Select>
          <Select
            id="project-has-review-scheme"
            label="是否已分配方案"
            onChange={(event) =>
              updateFilters({
                ...filters,
                hasReviewScheme: event.target.value as BooleanFilter,
              })
            }
            value={filters.hasReviewScheme}
          >
            <option value="">全部</option>
            <option value="true">已分配</option>
            <option value="false">未分配</option>
          </Select>
          <Button type="submit" variant="secondary">
            搜索
          </Button>
          <Button onClick={handleReset} variant="ghost">
            重置
          </Button>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            checked={allCurrentPageSelected}
            className="h-4 w-4 accent-cyan-700"
            disabled={items.length === 0}
            onChange={toggleCurrentPage}
            type="checkbox"
          />
          当前页全选
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-600">
            已选择 {selectedIds.length} 个项目
          </span>
          <Button
            disabled={selectedProjects.length === 0}
            onClick={() => setBatchAssignmentProjects(selectedProjects)}
            size="sm"
            variant="secondary"
          >
            批量分配负责人/方案
          </Button>
          <Button
            disabled={selectedProjects.length === 0}
            onClick={() => setBatchExpertsProjects(selectedProjects)}
            size="sm"
            variant="secondary"
          >
            批量设置专家
          </Button>
          <Button
            disabled={selectedIds.length === 0}
            onClick={() => setSelectedIds([])}
            size="sm"
            variant="ghost"
          >
            清空选择
          </Button>
        </div>
      </div>

      <ErrorAlert message={error} />
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      <section className="panel">
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <DataTable
              columns={columns}
              emptyText="暂无项目数据"
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

      <ReviewAssignmentModal
        onClose={() => setAssignmentTarget(null)}
        onSaved={handleAssignmentSaved}
        open={Boolean(assignmentTarget)}
        project={assignmentTarget}
        reviewManagers={reviewManagers}
        reviewSchemes={reviewSchemes}
      />
      <BatchReviewAssignmentModal
        onClose={() => setBatchAssignmentProjects([])}
        onCompleted={handleBatchAssignmentCompleted}
        open={batchAssignmentProjects.length > 0}
        projects={batchAssignmentProjects}
        reviewManagers={reviewManagers}
        reviewSchemes={reviewSchemes}
      />
      <BatchExpertsModal
        disciplineNameById={treeNameById}
        onClose={() => setBatchExpertsProjects([])}
        onCompleted={handleBatchExpertsCompleted}
        open={batchExpertsProjects.length > 0}
        organizationNameById={organizationNameById}
        projects={batchExpertsProjects}
      />
    </>
  );
}

function toBooleanQuery(value: BooleanFilter): boolean | '' {
  if (value === '') {
    return '';
  }

  return value === 'true';
}

function formatOptionalName(
  id: string | null | undefined,
  nameById: Map<string, string>,
): string {
  if (!id) {
    return '-';
  }

  return nameById.get(id) ?? id;
}

function formatNames(ids: string[], nameById: Map<string, string>): string {
  if (ids.length === 0) {
    return '-';
  }

  return ids.map((id) => nameById.get(id) ?? id).join('、');
}

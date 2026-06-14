'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  getProjectImportFieldLabel,
  getProjectImportJobStatusLabel,
  getProjectImportJobStatusTone,
  getProjectImportRowStatusLabel,
  getProjectImportRowStatusTone,
  PROJECT_IMPORT_ROW_STATUS_OPTIONS,
} from '@/src/lib/labels/project-import-labels';
import { flattenTree } from '@/src/lib/tree/build-tree';
import {
  confirmProjectImportJob,
  confirmProjectImportRow,
  getProjectImportJob,
  listBatches,
  listDictionaries,
  listOrganizations,
  listProjectImportRows,
  listTreeDictionaries,
  listUsers,
  skipProjectImportRow,
  updateProjectImportRow,
} from '../api';
import {
  ProjectImportJobStats,
} from '../components/project-imports/ProjectImportJobStats';
import {
  ProjectImportRowModal,
  type ProjectImportTreeSelectOption,
} from '../components/project-imports/ProjectImportRowModal';
import type {
  AdminUser,
  Batch,
  Dictionary,
  Organization,
  ProjectImportJob,
  ProjectImportRow,
  ProjectImportRowStatus,
  TreeDictionary,
  UpdateProjectImportRowInput,
} from '../types';

type ProjectImportDetailPageProps = {
  jobId: string;
};

type RowFilters = {
  keyword: string;
  status: '' | ProjectImportRowStatus;
};

type ConfirmAction =
  | { type: 'bulk' }
  | { row: ProjectImportRow; type: 'confirm-row' }
  | { row: ProjectImportRow; type: 'skip-row' };

const PAGE_SIZE = 20;
const EMPTY_FILTERS: RowFilters = {
  keyword: '',
  status: '',
};

export function ProjectImportDetailPage({ jobId }: ProjectImportDetailPageProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RowFilters>(EMPTY_FILTERS);
  const [job, setJob] = useState<ProjectImportJob | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalNotice, setModalNotice] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ProjectImportRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<ProjectImportRow | null>(null);
  const [submittingRow, setSubmittingRow] = useState(false);
  const [total, setTotal] = useState(0);
  const [treeDictionaries, setTreeDictionaries] = useState<TreeDictionary[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

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
  const ownerNameById = useMemo(
    () =>
      new Map(
        users.map((item) => [
          item.id,
          item.phone ? `${item.name}（${item.phone}）` : item.name,
        ]),
      ),
    [users],
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
  const departmentNameById = useMemo(
    () =>
      new Map(
        treeDictionaries
          .filter((item) => item.treeType === 'department')
          .map((item) => [item.id, item.fullName || item.name]),
      ),
    [treeDictionaries],
  );
  const regionNameById = useMemo(
    () =>
      new Map(
        treeDictionaries
          .filter((item) => item.treeType === 'administrative_division')
          .map((item) => [item.id, item.fullName || item.name]),
      ),
    [treeDictionaries],
  );

  const projectTypeOptions = useMemo(
    () =>
      toTreeSelectOptions(
        treeDictionaries.filter((item) => item.treeType === 'project_type'),
      ),
    [treeDictionaries],
  );
  const departmentOptions = useMemo(
    () =>
      toTreeSelectOptions(
        treeDictionaries.filter((item) => item.treeType === 'department'),
      ),
    [treeDictionaries],
  );
  const regionOptions = useMemo(
    () =>
      toTreeSelectOptions(
        treeDictionaries.filter(
          (item) => item.treeType === 'administrative_division',
        ),
      ),
    [treeDictionaries],
  );
  const disciplineOptions = useMemo(
    () =>
      flattenTree(
        treeDictionaries.filter((item) => item.treeType === 'discipline'),
      ).map(({ depth, hasChildren, item }) => ({
        depth,
        description:
          item.fullName && item.fullName !== item.name
            ? item.fullName
            : item.isActive
              ? undefined
              : '已停用',
        disabled: !item.isActive,
        hasChildren,
        label: item.name,
        value: item.id,
      })),
    [treeDictionaries],
  );
  const organizationOptions = useMemo(
    () =>
      organizations.map((organization) => ({
        description: organization.isActive ? undefined : '已停用',
        disabled: !organization.isActive,
        label: organization.name,
        value: organization.id,
      })),
    [organizations],
  );
  const ownerOptions = useMemo(
    () =>
      users.map((user) => ({
        description: user.phone,
        disabled: !user.isActive,
        label: user.name,
        value: user.id,
      })),
    [users],
  );
  const projectStatusOptions = useMemo(
    () =>
      dictionaries
        .filter((item) => item.dictType === 'project_status')
        .map((item) => ({
          description: item.isActive ? undefined : '已停用',
          disabled: !item.isActive,
          label: item.name,
          value: item.id,
        })),
    [dictionaries],
  );

  async function loadOptions() {
    try {
      const [
        batchResponse,
        statusResponse,
        organizationResponse,
        projectTypeResponse,
        disciplineResponse,
        departmentResponse,
        regionResponse,
        userResponse,
      ] = await Promise.all([
        listBatches({ page: 1, pageSize: 1000 }),
        listDictionaries({ dictType: 'project_status' }),
        listOrganizations({ page: 1, pageSize: 1000 }),
        listTreeDictionaries({ treeType: 'project_type' }),
        listTreeDictionaries({ treeType: 'discipline' }),
        listTreeDictionaries({ treeType: 'department' }),
        listTreeDictionaries({ treeType: 'administrative_division' }),
        listUsers({
          isActive: true,
          page: 1,
          pageSize: 1000,
          role: 'project_owner',
        }),
      ]);

      setBatches(batchResponse.items);
      setDictionaries(statusResponse);
      setOrganizations(organizationResponse.items);
      setTreeDictionaries([
        ...projectTypeResponse,
        ...disciplineResponse,
        ...departmentResponse,
        ...regionResponse,
      ]);
      setUsers(userResponse.items);
    } catch {
      setBatches([]);
      setDictionaries([]);
      setOrganizations([]);
      setTreeDictionaries([]);
      setUsers([]);
    }
  }

  async function loadJob() {
    setJobLoading(true);
    setError(null);

    try {
      const response = await getProjectImportJob(jobId);
      setJob(response);
    } catch (loadError) {
      setError(getProjectImportErrorMessage(loadError, '导入任务加载失败'));
    } finally {
      setJobLoading(false);
    }
  }

  async function loadRows(
    nextPage = page,
    nextFilters: RowFilters = filters,
  ) {
    setRowsLoading(true);
    setError(null);

    try {
      const response = await listProjectImportRows(jobId, {
        keyword: nextFilters.keyword.trim(),
        page: nextPage,
        pageSize: PAGE_SIZE,
        status: nextFilters.status,
      });
      setRows(response.items);
      setPage(response.page);
      setTotal(response.total);
    } catch (loadError) {
      setError(getProjectImportErrorMessage(loadError, '导入行加载失败'));
    } finally {
      setRowsLoading(false);
    }
  }

  async function refreshCurrentData() {
    await Promise.all([loadJob(), loadRows(page, filters)]);
  }

  useEffect(() => {
    loadOptions();
    loadJob();
    loadRows(1, EMPTY_FILTERS);
  }, [jobId]);

  function updateFilters(nextFilters: RowFilters) {
    setFilters(nextFilters);
    void loadRows(1, nextFilters);
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadRows(1, filters);
  }

  function openRow(row: ProjectImportRow) {
    setSelectedRow(row);
    setModalError(null);
    setModalNotice(null);
  }

  async function handleSaveRow(input: UpdateProjectImportRowInput) {
    if (!selectedRow) {
      return;
    }

    setSubmittingRow(true);
    setModalError(null);
    setModalNotice(null);

    try {
      const updated = await updateProjectImportRow(jobId, selectedRow.id, input);
      setSelectedRow(updated);

      if (input.createOrganization || input.createOwnerUser) {
        await loadOptions();
      }

      await refreshCurrentData();
      setModalNotice(
        `已重新匹配，当前行状态为 ${getProjectImportRowStatusLabel(updated.status)}。${
          updated.status === 'importable' ? '该行现在可确认入库。' : ''
        }`,
      );
    } catch (saveError) {
      setModalError(getProjectImportErrorMessage(saveError, '行修正保存失败'));
    } finally {
      setSubmittingRow(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) {
      return;
    }

    setOperationLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (confirmAction.type === 'bulk') {
        const result = await confirmProjectImportJob(jobId);
        setNotice(
          `批量确认完成：成功 ${result.successCount} 条，失败 ${result.failedCount} 条，跳过 ${result.skippedCount} 条。`,
        );
      } else if (confirmAction.type === 'confirm-row') {
        const updated = await confirmProjectImportRow(
          jobId,
          confirmAction.row.id,
        );
        setNotice(
          updated.status === 'confirmed'
            ? `Excel 第 ${updated.rowNumber} 行已确认入库。`
            : `确认请求已返回，当前行状态为 ${getProjectImportRowStatusLabel(updated.status)}，请检查问题列表。`,
        );
        if (selectedRow?.id === updated.id) {
          setSelectedRow(updated);
        }
      } else {
        const updated = await skipProjectImportRow(jobId, confirmAction.row.id);
        setNotice(
          `Excel 第 ${updated.rowNumber} 行已跳过，本阶段不支持恢复。`,
        );
        if (selectedRow?.id === updated.id) {
          setSelectedRow(updated);
        }
      }

      setConfirmAction(null);
      await refreshCurrentData();
    } catch (actionError) {
      setError(getProjectImportErrorMessage(actionError, '操作失败'));
    } finally {
      setOperationLoading(false);
    }
  }

  const columns: DataColumn<ProjectImportRow>[] = [
    {
      key: 'rowNumber',
      render: (item) => item.rowNumber,
      title: 'Excel 行号',
    },
    {
      key: 'project',
      render: (item) => (
        <div className="min-w-48">
          <div className="font-semibold text-slate-900">
            {displayValue(item.normalized.projectNo)}
          </div>
          <div className="mt-1 text-sm leading-5 text-slate-500">
            {displayValue(item.normalized.name)}
          </div>
        </div>
      ),
      title: '项目',
    },
    {
      key: 'matched',
      render: (item) => (
        <div className="grid gap-1 text-sm leading-5">
          <div>
            负责人：
            {labelById(item.resolved.ownerUserId, ownerNameById) ||
              displayValue(item.normalized.ownerName)}
          </div>
          <div>
            承担单位：
            {labelById(
              item.resolved.leadOrganizationId,
              organizationNameById,
            ) || displayValue(item.normalized.leadOrganizationName)}
          </div>
          <div>
            项目类型：
            {labelById(item.resolved.projectTypeId, treeNameById) ||
              displayValue(item.normalized.projectTypeName)}
          </div>
        </div>
      ),
      title: '匹配摘要',
    },
    {
      key: 'status',
      render: (item) => (
        <Badge tone={getProjectImportRowStatusTone(item.status)}>
          {getProjectImportRowStatusLabel(item.status)}
        </Badge>
      ),
      title: '状态',
    },
    {
      key: 'issues',
      render: (item) => (
        <Badge tone={item.issues.length > 0 ? 'warning' : 'success'}>
          {item.issues.length} 项
        </Badge>
      ),
      title: '问题',
    },
    {
      key: 'updatedAt',
      render: (item) => formatDateTime(item.updatedAt),
      title: '更新时间',
    },
    {
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Button onClick={() => openRow(item)} size="sm" variant="ghost">
            {item.status === 'confirmed' || item.status === 'skipped'
              ? '查看'
              : '查看/修正'}
          </Button>
          {item.status === 'importable' ? (
            <Button
              disabled={operationLoading}
              onClick={() => setConfirmAction({ row: item, type: 'confirm-row' })}
              size="sm"
              variant="primary"
            >
              确认入库
            </Button>
          ) : null}
          {canSkipRow(item.status) ? (
            <Button
              disabled={operationLoading}
              onClick={() => setConfirmAction({ row: item, type: 'skip-row' })}
              size="sm"
              variant="danger"
            >
              跳过
            </Button>
          ) : null}
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">Project Import</div>
          <h1>项目导入任务详情</h1>
          <p>查看导入任务统计和行级解析结果，修正待确认数据后确认入库。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push('/admin/project-imports')}
            variant="secondary"
          >
            返回任务列表
          </Button>
          <Button
            disabled={!job || job.importableRows <= 0 || operationLoading}
            onClick={() => setConfirmAction({ type: 'bulk' })}
            variant="primary"
          >
            批量确认可导入行
          </Button>
        </div>
      </div>

      <ErrorAlert message={error} />
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      <section className="panel mb-5">
        {jobLoading ? (
          <LoadingState />
        ) : job ? (
          <div className="panel-body">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-black text-slate-950">
                  {job.originalFilename}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>批次：{batchNameById.get(job.batchId) ?? job.batchId}</span>
                  <Badge tone={getProjectImportJobStatusTone(job.status)}>
                    {getProjectImportJobStatusLabel(job.status)}
                  </Badge>
                  <span>创建：{formatDateTime(job.createdAt)}</span>
                  <span>更新：{formatDateTime(job.updatedAt)}</span>
                </div>
              </div>
            </div>
            <ProjectImportJobStats job={job} />
            {job.errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
                任务错误：{job.errorMessage}
              </div>
            ) : null}
            <div className="mt-5">
              <h2 className="m-0 mb-3 text-sm font-black text-slate-900">
                字段映射
              </h2>
              {Object.entries(job.fieldMapping).length === 0 ? (
                <div className="text-sm text-slate-400">暂无字段映射</div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(job.fieldMapping).map(([field, header]) => (
                    <div
                      className="rounded-lg bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-100"
                      key={field}
                    >
                      <span className="font-bold text-slate-700">
                        {getProjectImportFieldLabel(field)}
                      </span>
                      <span className="mx-2 text-slate-300">→</span>
                      <span className="text-slate-500">
                        {header || '未识别'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="panel-body text-sm text-slate-500">
            未找到导入任务。
          </div>
        )}
      </section>

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="toolbar-left">
          <Input
            id="project-import-row-keyword"
            label="关键词"
            onChange={(event) =>
              setFilters({ ...filters, keyword: event.target.value })
            }
            placeholder="项目编号、名称或行内容"
            value={filters.keyword}
          />
          <Select
            id="project-import-row-status"
            label="行状态"
            onChange={(event) =>
              updateFilters({
                ...filters,
                status: event.target.value as '' | ProjectImportRowStatus,
              })
            }
            value={filters.status}
          >
            <option value="">全部状态</option>
            {PROJECT_IMPORT_ROW_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            搜索
          </Button>
        </div>
      </form>

      <section className="panel">
        {rowsLoading ? (
          <LoadingState />
        ) : (
          <>
            <DataTable
              columns={columns}
              emptyText="暂无导入行"
              getRowKey={(item) => item.id}
              items={rows}
            />
            <Pagination
              onPageChange={(nextPage) => loadRows(nextPage)}
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
            />
          </>
        )}
      </section>

      <ProjectImportRowModal
        error={modalError}
        names={{
          departmentNameById,
          dictionaryNameById,
          organizationNameById,
          ownerNameById,
          regionNameById,
          treeNameById,
        }}
        notice={modalNotice}
        onClose={() => setSelectedRow(null)}
        onSave={handleSaveRow}
        open={Boolean(selectedRow)}
        options={{
          departmentOptions,
          disciplineOptions,
          organizationOptions,
          ownerOptions,
          projectStatusOptions,
          projectTypeOptions,
          regionOptions,
        }}
        row={selectedRow}
        saving={submittingRow}
      />

      <ConfirmDialog
        confirmLabel={getConfirmLabel(confirmAction)}
        description={getConfirmDescription(confirmAction)}
        loading={operationLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          void handleConfirmAction();
        }}
        open={Boolean(confirmAction)}
        title={getConfirmTitle(confirmAction)}
      />
    </>
  );
}

function toTreeSelectOptions(
  items: TreeDictionary[],
): ProjectImportTreeSelectOption[] {
  return flattenTree(items).map(({ depth, hasChildren, item }) => ({
    depth,
    disabled: !item.isActive,
    hasChildren,
    label: item.name,
    value: item.id,
  }));
}

function labelById(
  id: string | undefined,
  labels: Map<string, string>,
): string {
  if (!id) {
    return '';
  }

  return labels.get(id) ?? id;
}

function canSkipRow(status: ProjectImportRowStatus): boolean {
  return (
    status === 'importable' ||
    status === 'pending_confirmation' ||
    status === 'failed'
  );
}

function getConfirmTitle(action: ConfirmAction | null): string {
  if (action?.type === 'bulk') {
    return '批量确认可导入行';
  }

  if (action?.type === 'skip-row') {
    return '跳过导入行';
  }

  return '确认导入行';
}

function getConfirmLabel(action: ConfirmAction | null): string {
  if (action?.type === 'skip-row') {
    return '跳过';
  }

  return '确认';
}

function getConfirmDescription(action: ConfirmAction | null): string {
  if (!action) {
    return '';
  }

  if (action.type === 'bulk') {
    return '仅确认当前任务中所有可导入行，待确认、已跳过、已确认行会跳过。';
  }

  if (action.type === 'skip-row') {
    return `确认跳过 Excel 第 ${action.row.rowNumber} 行？跳过后本阶段不支持恢复。`;
  }

  return `确认将 Excel 第 ${action.row.rowNumber} 行入库？确认后会创建或更新正式项目。`;
}

function getProjectImportErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.status === 409) {
      return `${fallback}：当前导入数据状态冲突，请刷新页面后重试。`;
    }

    if (error.status === 400) {
      return `${fallback}：提交内容不符合要求，请检查输入或主数据选择。${appendOriginalMessage(error.message)}`;
    }

    return `${fallback}：${getErrorMessage(error)}`;
  }

  return `${fallback}：${getErrorMessage(error)}`;
}

function appendOriginalMessage(message: string): string {
  return message ? `（${message}）` : '';
}

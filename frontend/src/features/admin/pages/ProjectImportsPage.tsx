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
import {
  getProjectImportJobStatusLabel,
  getProjectImportJobStatusTone,
  PROJECT_IMPORT_JOB_STATUS_OPTIONS,
} from '@/src/lib/labels/project-import-labels';
import {
  deleteProjectImportJob,
  listBatches,
  listProjectImportJobs,
  uploadProjectImport,
} from '../api';
import type {
  Batch,
  ProjectImportJob,
  ProjectImportJobStatus,
} from '../types';

type ProjectImportFilters = {
  batchId: string;
  keyword: string;
  status: '' | ProjectImportJobStatus;
};

const PAGE_SIZE = 20;
const MAX_EXCEL_SIZE = 10 * 1024 * 1024;
const EMPTY_FILTERS: ProjectImportFilters = {
  batchId: '',
  keyword: '',
  status: '',
};

export function ProjectImportsPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ProjectImportJob | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [filters, setFilters] =
    useState<ProjectImportFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<ProjectImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [uploadBatchId, setUploadBatchId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const batchNameById = useMemo(
    () => new Map(batches.map((item) => [item.id, item.name])),
    [batches],
  );

  async function loadOptions() {
    try {
      const response = await listBatches({ page: 1, pageSize: 1000 });
      setBatches(response.items);
    } catch {
      setBatches([]);
    }
  }

  async function loadJobs(
    nextPage = page,
    nextFilters: ProjectImportFilters = filters,
  ) {
    setLoading(true);
    setError(null);

    try {
      const response = await listProjectImportJobs({
        batchId: nextFilters.batchId,
        keyword: nextFilters.keyword.trim(),
        page: nextPage,
        pageSize: PAGE_SIZE,
        status: nextFilters.status,
      });
      setItems(response.items);
      setPage(response.page);
      setTotal(response.total);
    } catch (loadError) {
      setError(getProjectImportErrorMessage(loadError, '任务列表加载失败'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
    loadJobs(1, EMPTY_FILTERS);
  }, []);

  function updateFilters(nextFilters: ProjectImportFilters) {
    setFilters(nextFilters);
    void loadJobs(1, nextFilters);
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadJobs(1, filters);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);
    setNotice(null);

    const validationMessage = validateUpload(uploadBatchId, file);

    if (validationMessage) {
      setUploadError(validationMessage);
      return;
    }

    if (!file) {
      setUploadError('请选择 Excel 文件。');
      return;
    }

    setUploading(true);

    try {
      const job = await uploadProjectImport({
        batchId: uploadBatchId,
        file,
      });
      setNotice(
        `Excel 已上传并完成解析：${job.originalFilename}，当前状态为 ${getProjectImportJobStatusLabel(job.status)}。`,
      );
      setFile(null);
      setFileInputKey((current) => current + 1);
      await loadJobs(1, filters);
    } catch (uploadFailure) {
      setUploadError(getProjectImportErrorMessage(uploadFailure, 'Excel 上传失败'));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteJob() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await deleteProjectImportJob(deleteTarget.id);
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;

      setNotice(
        `已删除导入任务，并清理 ${result.deletedRows} 条行记录。`,
      );
      setDeleteTarget(null);
      await loadJobs(nextPage, filters);
    } catch (deleteFailure) {
      setError(getDeleteProjectImportErrorMessage(deleteFailure));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataColumn<ProjectImportJob>[] = [
    {
      key: 'originalFilename',
      render: (item) => (
        <span className="font-semibold text-slate-900">
          {item.originalFilename}
        </span>
      ),
      title: '文件名',
    },
    {
      key: 'batchId',
      render: (item) => batchNameById.get(item.batchId) ?? item.batchId,
      title: '批次',
    },
    {
      key: 'status',
      render: (item) => (
        <Badge tone={getProjectImportJobStatusTone(item.status)}>
          {getProjectImportJobStatusLabel(item.status)}
        </Badge>
      ),
      title: '状态',
    },
    { key: 'totalRows', render: (item) => item.totalRows, title: '总行数' },
    {
      key: 'importableRows',
      render: (item) => item.importableRows,
      title: '可导入',
    },
    { key: 'pendingRows', render: (item) => item.pendingRows, title: '待确认' },
    {
      key: 'confirmedRows',
      render: (item) => item.confirmedRows,
      title: '已确认',
    },
    { key: 'skippedRows', render: (item) => item.skippedRows, title: '已跳过' },
    { key: 'failedRows', render: (item) => item.failedRows, title: '失败' },
    {
      key: 'createdAt',
      render: (item) => formatDateTime(item.createdAt),
      title: '创建时间',
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
          <Button
            onClick={() => router.push(`/admin/project-imports/${item.id}`)}
            size="sm"
            variant="ghost"
          >
            查看详情
          </Button>
          <Button
            disabled={deleting || item.confirmedRows > 0}
            onClick={() => setDeleteTarget(item)}
            size="sm"
            title={
              item.confirmedRows > 0
                ? '已有确认入库项目，不能删除导入任务'
                : '删除导入任务'
            }
            variant="danger"
          >
            删除
          </Button>
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>项目导入</h1>
          <p>通过 Excel 导入待评审项目，处理自动匹配失败或待确认数据。</p>
        </div>
      </div>

      <section className="panel mb-5">
        <div className="panel-body">
          <h2 className="m-0 mb-4 text-lg font-black text-slate-950">
            上传 Excel
          </h2>
          <form className="toolbar mb-0" onSubmit={handleUpload}>
            <div className="toolbar-left">
              <Select
                disabled={uploading}
                id="project-import-upload-batch"
                label="批次"
                onChange={(event) => setUploadBatchId(event.target.value)}
                value={uploadBatchId}
              >
                <option value="">请选择批次</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </Select>
              <Input
                accept=".xlsx,.xls"
                disabled={uploading}
                id="project-import-upload-file"
                key={fileInputKey}
                label="Excel 文件"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                }}
                type="file"
              />
              <Button disabled={uploading} type="submit" variant="primary">
                {uploading ? '上传中...' : '上传并解析'}
              </Button>
            </div>
          </form>
          <div className="mt-3 text-xs leading-5 text-slate-500">
            支持 .xlsx / .xls，单个文件不超过 10MB；后端仅解析第一个工作表，不保存原始 Excel 文件。
          </div>
          <ErrorAlert message={uploadError} />
        </div>
      </section>

      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="toolbar-left">
          <Input
            id="project-import-keyword"
            label="关键词"
            onChange={(event) =>
              setFilters({ ...filters, keyword: event.target.value })
            }
            placeholder="文件名或导入信息"
            value={filters.keyword}
          />
          <Select
            id="project-import-batch-filter"
            label="批次"
            onChange={(event) =>
              updateFilters({ ...filters, batchId: event.target.value })
            }
            value={filters.batchId}
          >
            <option value="">全部批次</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-import-status-filter"
            label="任务状态"
            onChange={(event) =>
              updateFilters({
                ...filters,
                status: event.target.value as '' | ProjectImportJobStatus,
              })
            }
            value={filters.status}
          >
            <option value="">全部状态</option>
            {PROJECT_IMPORT_JOB_STATUS_OPTIONS.map((option) => (
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

      <ErrorAlert message={error} />

      <section className="panel">
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <DataTable
              columns={columns}
              emptyText="暂无项目导入任务"
              getRowKey={(item) => item.id}
              items={items}
            />
            <Pagination
              onPageChange={(nextPage) => loadJobs(nextPage)}
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
            />
          </>
        )}
      </section>

      <ConfirmDialog
        confirmLabel="删除"
        description={getDeleteConfirmDescription(deleteTarget)}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDeleteJob();
        }}
        open={Boolean(deleteTarget)}
        title="删除导入任务"
      />
    </>
  );
}

function validateUpload(batchId: string, file: File | null): string | null {
  if (!batchId) {
    return '请先选择批次。';
  }

  if (!file) {
    return '请选择 Excel 文件。';
  }

  const lowerName = file.name.toLowerCase();

  if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
    return '文件格式不支持，请选择 .xlsx 或 .xls 文件。';
  }

  if (file.size > MAX_EXCEL_SIZE) {
    return '文件过大，请选择不超过 10MB 的 Excel 文件。';
  }

  return null;
}

function getProjectImportErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.status === 409) {
      return `${fallback}：当前导入数据状态冲突，请刷新页面后重试。`;
    }

    if (error.status === 400) {
      return `${fallback}：提交内容不符合要求，请检查批次、文件或筛选条件。${appendOriginalMessage(error.message)}`;
    }

    return `${fallback}：${getErrorMessage(error)}`;
  }

  return `${fallback}：${getErrorMessage(error)}`;
}

function getDeleteProjectImportErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 400) {
      return '删除导入任务失败：请求参数不正确，请刷新列表后重试。';
    }

    if (error.status === 404) {
      return '导入任务已不存在，请刷新列表。';
    }

    if (error.status === 409) {
      return error.message.includes('解析')
        ? '导入任务仍在解析中，不能删除。'
        : '该导入任务已有项目确认入库，不能删除导入记录。';
    }

    if (error.status >= 500) {
      return '删除导入任务失败：服务异常，请稍后重试。';
    }
  }

  return `删除导入任务失败：${getErrorMessage(error)}`;
}

function getDeleteConfirmDescription(job: ProjectImportJob | null): string {
  if (!job) {
    return '';
  }

  return `确认删除导入任务“${job.originalFilename}”？仅删除本次导入任务和行级解析记录，不会删除已入库项目。已有确认入库项目的导入任务不能删除。`;
}

function appendOriginalMessage(message: string): string {
  return message ? `（${message}）` : '';
}

'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  deleteProjectOwnerMaterial,
  getProjectOwnerMaterialDownloadUrl,
  resolveProjectMaterialDownloadUrl,
} from '../api';
import type { MaterialTypeSummary, ProjectMaterial } from '../types';
import { formatFileSize, formatLookupName } from '../utils';

type MaterialListPanelProps = {
  loading: boolean;
  materialTypeNameById: Map<string, string>;
  materialTypes: MaterialTypeSummary[];
  materials: ProjectMaterial[];
  onChanged: () => void;
  onFilterChange: (materialTypeId: string) => void;
  projectId: string;
  selectedMaterialTypeId: string;
};

export function MaterialListPanel({
  loading,
  materialTypeNameById,
  materialTypes,
  materials,
  onChanged,
  onFilterChange,
  projectId,
  selectedMaterialTypeId,
}: MaterialListPanelProps) {
  const [deleteTarget, setDeleteTarget] = useState<ProjectMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const displayedMaterials = useMemo(
    () =>
      selectedMaterialTypeId
        ? materials.filter(
            (material) => material.materialTypeId === selectedMaterialTypeId,
          )
        : materials,
    [materials, selectedMaterialTypeId],
  );

  async function handleDownload(material: ProjectMaterial) {
    setError(null);
    setNotice(null);

    try {
      const response = await getProjectOwnerMaterialDownloadUrl(
        projectId,
        material.id,
      );
      const url = resolveProjectMaterialDownloadUrl(response);

      if (!url) {
        setError('后端未返回可用下载 URL。');
        return;
      }

      window.open(url, '_blank');
    } catch (downloadError) {
      setError(getErrorMessage(downloadError));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await deleteProjectOwnerMaterial(projectId, deleteTarget.id);
      setDeleteTarget(null);
      setNotice(result.alreadyDeleted ? '材料此前已删除。' : '已删除材料。');
      onChanged();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataColumn<ProjectMaterial>[] = [
    {
      key: 'type',
      render: (item) => formatMaterialTypeName(item, materialTypeNameById),
      title: '材料类型',
    },
    {
      key: 'filename',
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-900">
            {item.originalFilename}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {item.safeFilename}
          </div>
        </div>
      ),
      title: '文件名',
    },
    {
      key: 'size',
      render: (item) => formatFileSize(item.sizeBytes),
      title: '大小',
    },
    {
      key: 'extension',
      render: (item) => <span className="code">{item.extension}</span>,
      title: '扩展名',
    },
    {
      key: 'createdAt',
      render: (item) => formatDateTime(item.createdAt),
      title: '上传时间',
    },
    {
      key: 'remark',
      render: (item) => displayValue(item.remark),
      title: '备注',
    },
    {
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Button
            onClick={() => handleDownload(item)}
            size="sm"
            variant="secondary"
          >
            下载
          </Button>
          <Button
            onClick={() => setDeleteTarget(item)}
            size="sm"
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
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-black text-slate-950">材料列表</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            下载使用后端签名 URL，不在前端拼接存储 objectKey。
          </p>
        </div>
        <Badge tone="primary">
          {displayedMaterials.length} / {materials.length} 个材料
        </Badge>
      </div>

      <ErrorAlert message={error} />
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={[
            'rounded-full border px-3 py-1.5 text-xs font-bold transition',
            selectedMaterialTypeId === ''
              ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700',
          ].join(' ')}
          onClick={() => onFilterChange('')}
          type="button"
        >
          全部材料
        </button>
        {materialTypes.map((type) => (
          <button
            className={[
              'rounded-full border px-3 py-1.5 text-xs font-bold transition',
              selectedMaterialTypeId === type.id
                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:text-cyan-700',
            ].join(' ')}
            key={type.id}
            onClick={() => onFilterChange(type.id)}
            type="button"
          >
            {type.name}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState text="正在加载材料..." />
      ) : (
        <DataTable
          columns={columns}
          emptyText="暂无已上传材料"
          getRowKey={(item) => item.id}
          items={displayedMaterials}
        />
      )}

      <ConfirmDialog
        confirmLabel="删除材料"
        description={
          deleteTarget
            ? `确认删除材料“${deleteTarget.originalFilename}”？删除后列表默认不再显示，当前页面不提供恢复。`
            : '确认删除材料？'
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(deleteTarget)}
        title="删除材料"
      />
    </section>
  );
}

function formatMaterialTypeName(
  material: ProjectMaterial,
  materialTypeNameById: Map<string, string>,
): string {
  if (material.materialType?.name) {
    return material.materialType.name;
  }

  return formatLookupName(
    material.materialTypeId,
    materialTypeNameById,
    '未知材料类型',
  );
}

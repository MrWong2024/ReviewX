'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  deleteAdminProjectMaterial,
  getAdminProjectMaterialDownloadUrl,
  listAdminProjectMaterials,
  resolveAdminProjectMaterialDownloadUrl,
} from '../../api';
import type { AdminProjectMaterial } from '../../types/project-review-organization';
import { AdminProjectMaterialDeleteModal } from './AdminProjectMaterialDeleteModal';
import {
  AdminProjectMaterialStatusBadge,
  getAdminMaterialStatusView,
} from './AdminProjectMaterialStatusBadge';

type AdminProjectMaterialsCardProps = {
  projectId: string;
  userNameById?: Map<string, string>;
};

export function AdminProjectMaterialsCard({
  projectId,
  userNameById,
}: AdminProjectMaterialsCardProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<AdminProjectMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<AdminProjectMaterial[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadMaterials();
  }, [projectId]);

  const materialStats = useMemo(() => {
    const draftCount = materials.filter(
      (material) => material.status === 'draft',
    ).length;
    const submittedCount = materials.filter(
      (material) => material.status === 'submitted',
    ).length;
    const legacyActiveCount = materials.filter(
      (material) => material.status === 'active',
    ).length;

    return {
      draftCount,
      legacyActiveCount,
      submittedCount,
      totalCount: materials.length,
    };
  }, [materials]);

  async function loadMaterials() {
    setLoading(true);
    setError(null);

    try {
      setMaterials(await listAdminProjectMaterials(projectId));
    } catch (loadError) {
      setMaterials([]);
      setError(`项目材料加载失败。${getErrorMessage(loadError)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(material: AdminProjectMaterial) {
    setDownloadingMaterialId(material.id);
    setError(null);
    setNotice(null);

    try {
      const response = await getAdminProjectMaterialDownloadUrl(
        projectId,
        material.id,
      );
      const url = resolveAdminProjectMaterialDownloadUrl(response);

      if (!url) {
        setError('下载地址获取失败：后端未返回可用下载 URL。');
        return;
      }

      window.open(url, '_blank');
    } catch (downloadError) {
      setError(`下载地址获取失败：${getErrorMessage(downloadError)}`);
    } finally {
      setDownloadingMaterialId(null);
    }
  }

  async function handleDelete(reason: string) {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    setError(null);
    setNotice(null);

    try {
      await deleteAdminProjectMaterial(projectId, deleteTarget.id, { reason });
      setDeleteTarget(null);
      setNotice('材料已删除，系统已保留删除审计。');
      await loadMaterials();
    } catch (deleteError) {
      setDeleteError(getDeleteErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataColumn<AdminProjectMaterial>[] = [
    {
      key: 'filename',
      render: (item) => (
        <div className="max-w-72">
          <div className="break-words font-semibold text-slate-900">
            {getMaterialFilename(item)}
          </div>
          {item.safeFilename ? (
            <div className="mt-1 break-words text-xs text-slate-500">
              {item.safeFilename}
            </div>
          ) : null}
        </div>
      ),
      title: '文件名',
    },
    {
      key: 'materialType',
      render: (item) => getMaterialTypeLabel(item),
      title: '材料类型',
    },
    {
      key: 'status',
      render: (item) => {
        const statusView = getAdminMaterialStatusView(item.status);

        return (
          <div className="max-w-56">
            <AdminProjectMaterialStatusBadge status={item.status} />
            <div className="mt-1 text-xs leading-5 text-slate-500">
              {statusView.description}
            </div>
          </div>
        );
      },
      title: '状态',
    },
    {
      key: 'uploadedBy',
      render: (item) => getUploadedByLabel(item, userNameById),
      title: '上传人',
    },
    {
      key: 'createdAt',
      render: (item) => formatDateTime(item.createdAt),
      title: '上传时间',
    },
    {
      key: 'size',
      render: (item) => formatFileSize(item.sizeBytes),
      title: '大小',
    },
    {
      key: 'remark',
      render: (item) => displayValue(item.remark),
      title: '备注',
    },
    {
      key: 'actions',
      render: (item) => {
        const deleteDisabledReason = getDeleteDisabledReason(item);

        return (
          <div>
            <div className="table-actions">
              <Button
                disabled={downloadingMaterialId === item.id}
                onClick={() => {
                  void handleDownload(item);
                }}
                size="sm"
                variant="secondary"
              >
                {downloadingMaterialId === item.id ? '获取中...' : '下载'}
              </Button>
              <Button
                disabled={Boolean(deleteDisabledReason)}
                onClick={() => {
                  setDeleteError(null);
                  setNotice(null);
                  setDeleteTarget(item);
                }}
                size="sm"
                title={deleteDisabledReason ?? '确需删除时必须填写删除原因'}
                variant="danger"
              >
                删除
              </Button>
            </div>
            {deleteDisabledReason ? (
              <div className="mt-1 text-xs leading-5 text-slate-500">
                {deleteDisabledReason}
              </div>
            ) : null}
          </div>
        );
      },
      title: '操作',
    },
  ];

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold text-slate-950">项目材料</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              这里显示项目负责人上传的材料。管理员可下载查看；如确需删除材料，必须填写删除原因，系统会物理删除文件并保留删除审计。
            </p>
          </div>
          <Button
            disabled={loading}
            onClick={() => {
              setNotice(null);
              void loadMaterials();
            }}
            variant="secondary"
          >
            重新加载
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone="muted">总材料 {materialStats.totalCount}</Badge>
          <Badge tone="warning">草稿 {materialStats.draftCount}</Badge>
          <Badge tone="success">已提交 {materialStats.submittedCount}</Badge>
          {materialStats.legacyActiveCount > 0 ? (
            <Badge tone="primary">
              历史草稿 {materialStats.legacyActiveCount}
            </Badge>
          ) : null}
        </div>

        <ErrorAlert message={error} />
        {notice ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <LoadingState text="正在加载项目材料..." />
        ) : materials.length === 0 ? (
          <EmptyState text="暂无项目材料。" />
        ) : (
          <DataTable
            columns={columns}
            getRowKey={(item) => item.id}
            items={materials}
          />
        )}
      </div>

      <AdminProjectMaterialDeleteModal
        error={deleteError}
        material={deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        open={Boolean(deleteTarget)}
        submitting={deleting}
      />
    </section>
  );
}

function getMaterialFilename(material: AdminProjectMaterial): string {
  const originalFilename = material.originalFilename?.trim();
  if (originalFilename) {
    return originalFilename;
  }

  return material.safeFilename?.trim() || '未命名材料';
}

function getMaterialTypeLabel(material: AdminProjectMaterial): string {
  return (
    material.materialType?.name ||
    `未知材料类型（${shortId(material.materialTypeId)}）`
  );
}

function getUploadedByLabel(
  material: AdminProjectMaterial,
  userNameById?: Map<string, string>,
): string {
  if (material.uploadedByUser?.name) {
    return material.uploadedByUser.phone
      ? `${material.uploadedByUser.name}（${material.uploadedByUser.phone}）`
      : material.uploadedByUser.name;
  }

  if (!material.uploadedByUserId) {
    return '未知上传人';
  }

  const mappedName = userNameById?.get(material.uploadedByUserId);
  if (mappedName) {
    return mappedName;
  }

  return `上传人（${shortId(material.uploadedByUserId)}）`;
}

function getDeleteDisabledReason(material: AdminProjectMaterial): string | null {
  if (
    material.status === 'draft' ||
    material.status === 'submitted' ||
    material.status === 'active'
  ) {
    return null;
  }

  if (material.status === 'deleted') {
    return '历史删除状态，不能再次删除';
  }

  return '未知状态，不能删除';
}

function getDeleteErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 400) {
      return `删除原因不符合要求：${getErrorMessage(error)}`;
    }

    if (error.status === 403) {
      return '当前账号无权管理该材料。';
    }

    if (error.status === 404) {
      return '材料不存在或已被删除。';
    }

    if (error.status >= 500) {
      return `${getErrorMessage(error)} 材料删除失败，文件存储可能未清理，请稍后重试或联系管理员。`;
    }
  }

  return getErrorMessage(error);
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function shortId(id: string): string {
  const trimmed = id.trim();

  if (trimmed.length <= 8) {
    return trimmed;
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

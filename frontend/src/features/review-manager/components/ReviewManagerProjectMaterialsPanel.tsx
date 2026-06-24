'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import {
  getReviewManagerProjectMaterialDownloadUrl,
  listReviewManagerProjectMaterials,
  resolveReviewManagerProjectMaterialDownloadUrl,
} from '../api';
import type { ReviewManagerProjectMaterialListItem } from '../types';
import { formatLookupName } from '../utils';

type ReviewManagerProjectMaterialsPanelProps = {
  materialTypeNameById: Map<string, string>;
  projectId: string;
};

export function ReviewManagerProjectMaterialsPanel({
  materialTypeNameById,
  projectId,
}: ReviewManagerProjectMaterialsPanelProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewManagerProjectMaterialListItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const submittedCount = useMemo(
    () => items.filter((item) => item.status === 'submitted').length,
    [items],
  );

  useEffect(() => {
    void loadMaterials();
  }, [projectId]);

  async function loadMaterials() {
    setLoading(true);
    setError(null);

    try {
      setItems(await listReviewManagerProjectMaterials(projectId));
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(materialId: string) {
    setDownloadingId(materialId);
    setError(null);

    try {
      const response = await getReviewManagerProjectMaterialDownloadUrl(
        projectId,
        materialId,
      );
      const url = resolveReviewManagerProjectMaterialDownloadUrl(response);

      if (!url) {
        setError('材料下载地址不可用，请稍后重试。');
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      setError(getErrorMessage(downloadError));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">项目材料</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              评审负责人仅可查看和下载项目负责人已提交评审的材料。
            </p>
          </div>
          <div className="table-actions">
            <Badge tone="primary">{submittedCount} 份已提交材料</Badge>
            <Button
              disabled={loading}
              onClick={() => void loadMaterials()}
              size="sm"
              variant="secondary"
            >
              刷新材料
            </Button>
          </div>
        </div>

        <ErrorAlert message={error} />
        {loading ? (
          <LoadingState text="正在加载项目材料..." />
        ) : items.length === 0 ? (
          <EmptyState text="暂无已提交评审材料。" />
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <div
                className="rounded-lg border border-slate-200 bg-white/80 p-4"
                key={item.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-black text-slate-900">
                      {item.originalFilename || item.safeFilename || '未命名材料'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                      <span>
                        {item.materialType?.name ??
                          formatLookupName(
                            item.materialTypeId,
                            materialTypeNameById,
                            '未知材料类型',
                          )}
                      </span>
                      <span>{formatFileSize(item.sizeBytes)}</span>
                      <span>提交时间：{formatDateTime(item.submittedAt)}</span>
                    </div>
                    {item.remark ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.remark}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success">已提交评审</Badge>
                    <Button
                      disabled={downloadingId === item.id}
                      onClick={() => void handleDownload(item.id)}
                      size="sm"
                      variant="secondary"
                    >
                      {downloadingId === item.id ? '获取中...' : '下载'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return '0 B';
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

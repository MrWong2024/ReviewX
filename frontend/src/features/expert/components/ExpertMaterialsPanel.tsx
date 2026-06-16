'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  getExpertProjectMaterialDownloadUrl,
  resolveExpertMaterialDownloadUrl,
} from '../api';
import type { ExpertMaterial } from '../types';
import { formatFileSize, formatLookupName } from '../utils';

type ExpertMaterialsPanelProps = {
  loading: boolean;
  materialTypeNameById: Map<string, string>;
  materials: ExpertMaterial[];
  materialsError?: string | null;
  projectId: string;
};

export function ExpertMaterialsPanel({
  loading,
  materialTypeNameById,
  materials,
  materialsError,
  projectId,
}: ExpertMaterialsPanelProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<
    string | null
  >(null);

  const materialStats = useMemo(
    () => ({
      totalCount: materials.length,
    }),
    [materials],
  );

  async function handleDownload(material: ExpertMaterial) {
    setDownloadingMaterialId(material.id);
    setDownloadError(null);

    try {
      const response = await getExpertProjectMaterialDownloadUrl(
        projectId,
        material.id,
      );
      const url = resolveExpertMaterialDownloadUrl(response);

      if (!url) {
        setDownloadError('下载地址获取失败：后端未返回可用下载 URL。');
        return;
      }

      window.open(url, '_blank');
    } catch (error) {
      setDownloadError(`下载地址获取失败：${getErrorMessage(error)}`);
    } finally {
      setDownloadingMaterialId(null);
    }
  }

  const columns: DataColumn<ExpertMaterial>[] = [
    {
      key: 'materialType',
      render: (item) => getMaterialTypeLabel(item, materialTypeNameById),
      title: '材料类型',
    },
    {
      key: 'filename',
      render: (item) => (
        <div className="max-w-72">
          <div className="break-words font-semibold text-slate-900">
            {item.originalFilename}
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
      key: 'size',
      render: (item) => formatFileSize(item.sizeBytes),
      title: '大小',
    },
    {
      key: 'extension',
      render: (item) => (
        <span className="code">{displayValue(item.extension)}</span>
      ),
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
      ),
      title: '操作',
    },
  ];

  return (
    <section className="panel" id="materials">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              项目材料
            </h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
              仅展示项目负责人已提交评审的材料，下载地址由专家材料接口签发。
            </p>
          </div>
          <Badge tone="primary">已提交 {materialStats.totalCount} 个</Badge>
        </div>

        <ErrorAlert message={materialsError} />
        <ErrorAlert message={downloadError} />

        {loading ? (
          <LoadingState text="正在加载项目材料..." />
        ) : (
          <DataTable
            columns={columns}
            emptyText="项目负责人提交评审后，专家才能看到材料。"
            getRowKey={(item) => item.id}
            items={materials}
          />
        )}
      </div>
    </section>
  );
}

function getMaterialTypeLabel(
  material: ExpertMaterial,
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

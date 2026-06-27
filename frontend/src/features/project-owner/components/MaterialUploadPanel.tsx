'use client';

import { useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { uploadProjectOwnerMaterials } from '../api';
import type { MaterialTypeSummary, UploadProjectMaterialsResult } from '../types';
import {
  ALLOWED_PROJECT_MATERIAL_EXTENSIONS,
  getProjectOwnerContentLockedErrorMessage,
  MATERIAL_REMARK_MAX_LENGTH,
  PROJECT_OWNER_CONTENT_LOCKED_MESSAGE,
  validateProjectMaterialFiles,
} from '../utils';

type MaterialUploadPanelProps = {
  locked?: boolean;
  lockedMessage?: string;
  materialTypes: MaterialTypeSummary[];
  materialTypesError?: string | null;
  onUploaded: (result: UploadProjectMaterialsResult) => void;
  projectId: string;
};

export function MaterialUploadPanel({
  locked = false,
  lockedMessage = PROJECT_OWNER_CONTENT_LOCKED_MESSAGE,
  materialTypes,
  materialTypesError,
  onUploaded,
  projectId,
}: MaterialUploadPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<
    UploadProjectMaterialsResult['failures']
  >([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [materialTypeId, setMaterialTypeId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [uploading, setUploading] = useState(false);

  const disabledReason = useMemo(() => {
    if (materialTypesError) {
      return materialTypesError;
    }

    if (materialTypes.length === 0) {
      return '尚未维护材料类型，请联系管理员维护普通字典 material_type。';
    }

    return null;
  }, [materialTypes, materialTypesError]);

  async function handleUpload() {
    setError(null);
    setFailures([]);
    setNotice(null);

    if (locked) {
      setError(lockedMessage);
      return;
    }

    if (disabledReason) {
      setError(disabledReason);
      return;
    }

    if (!materialTypeId) {
      setError('请选择材料类型。');
      return;
    }

    if (remark.length > MATERIAL_REMARK_MAX_LENGTH) {
      setError(`备注最多 ${MATERIAL_REMARK_MAX_LENGTH} 字。`);
      return;
    }

    const validationError = validateProjectMaterialFiles(files);

    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);

    try {
      const result = await uploadProjectOwnerMaterials({
        files,
        materialTypeId,
        projectId,
        remark: remark.trim() || undefined,
      });
      setFiles([]);
      setMaterialTypeId('');
      setRemark('');
      setFileInputKey((current) => current + 1);
      setNotice(
        `上传完成：成功 ${result.successCount} 个，失败 ${result.failedCount} 个。新上传材料已保存为草稿，提交前评审负责人和专家不可见。如需进入评审，请点击“提交评审材料”。`,
      );
      setFailures(result.failures);
      onUploaded(result);
    } catch (uploadError) {
      setError(getProjectOwnerContentLockedErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-4">
        <h3 className="m-0 text-base font-black text-slate-950">上传材料</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          支持多文件上传，后端仍是最终校验；本阶段不做文件预览。
        </p>
      </div>

      <ErrorAlert message={error} />
      {locked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800 shadow-sm">
          {lockedMessage}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}
      {failures.length > 0 ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          <div className="font-bold">失败明细</div>
          <ul className="mt-2 grid gap-1">
            {failures.map((failure) => (
              <li key={`${failure.originalFilename}-${failure.message}`}>
                <span className="font-semibold">
                  {failure.originalFilename}
                </span>
                ：{failure.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {!locked && disabledReason ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800 shadow-sm">
          {disabledReason}
        </div>
      ) : null}

      {locked ? null : (
        <>
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_minmax(260px,1fr)]">
        <Select
          disabled={Boolean(disabledReason) || uploading}
          id="project-owner-material-type"
          label="材料类型"
          onChange={(event) => setMaterialTypeId(event.target.value)}
          value={materialTypeId}
        >
          <option value="">请选择</option>
          {materialTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
        <Input
          accept={ALLOWED_PROJECT_MATERIAL_EXTENSIONS.map(
            (extension) => `.${extension}`,
          ).join(',')}
          disabled={Boolean(disabledReason) || uploading}
          id="project-owner-material-files"
          key={fileInputKey}
          label="材料文件"
          multiple
          onChange={(event) => {
            const selectedFiles = event.target.files
              ? Array.from(event.target.files)
              : [];
            setFiles(selectedFiles);
          }}
          type="file"
        />
      </div>

      <div className="mt-4">
        <Textarea
          disabled={Boolean(disabledReason) || uploading}
          id="project-owner-material-remark"
          label="备注"
          maxLength={MATERIAL_REMARK_MAX_LENGTH + 100}
          onChange={(event) => setRemark(event.target.value)}
          placeholder="可填写材料说明，最多 1000 字。"
          value={remark}
        />
      </div>

      <div className="mt-3 text-xs leading-5 text-slate-500">
        已选择 {files.length} 个文件。允许扩展名：
        {ALLOWED_PROJECT_MATERIAL_EXTENSIONS.join('、')}。
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          disabled={Boolean(disabledReason) || uploading}
          onClick={handleUpload}
          variant="primary"
        >
          {uploading ? '上传中...' : '上传材料'}
        </Button>
      </div>
        </>
      )}
    </section>
  );
}

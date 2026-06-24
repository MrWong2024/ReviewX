'use client';

import { useRef, useState } from 'react';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { formatDateTime } from '@/src/lib/format/date';
import type {
  ProjectAppealAttachment,
  ProjectAppealAttachmentUploadResult,
} from '@/src/lib/project-appeals/types';
import {
  formatFileSize,
  PROJECT_APPEAL_ATTACHMENT_REMARK_MAX_LENGTH,
  validateAppealAttachmentFiles,
} from '@/src/lib/project-appeals/utils';

type AppealAttachmentsPanelProps = {
  attachments: ProjectAppealAttachment[];
  canMutate?: boolean;
  emptyText?: string;
  error?: string | null;
  loading?: boolean;
  onDelete?: (attachment: ProjectAppealAttachment) => Promise<void>;
  onDownload: (attachment: ProjectAppealAttachment) => Promise<void>;
  onUpload?: (
    files: File[],
    remark: string,
  ) => Promise<ProjectAppealAttachmentUploadResult>;
  readonlyReason?: string;
  title?: string;
};

export function AppealAttachmentsPanel({
  attachments,
  canMutate = false,
  emptyText = '暂无补充材料。',
  error,
  loading = false,
  onDelete,
  onDownload,
  onUpload,
  readonlyReason = '当前申诉状态下附件只读。',
  title = '申诉附件',
}: AppealAttachmentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ProjectAppealAttachment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [remark, setRemark] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] =
    useState<ProjectAppealAttachmentUploadResult | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleDownload(attachment: ProjectAppealAttachment) {
    setDownloadingId(attachment.id);
    setDownloadError(null);

    try {
      await onDownload(attachment);
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure instanceof Error
          ? downloadFailure.message
          : '附件下载失败，请稍后重试。',
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleUpload() {
    if (!onUpload) {
      return;
    }

    const fileError = validateAppealAttachmentFiles(files);

    if (fileError) {
      setUploadError(fileError);
      return;
    }

    if (remark.trim().length > PROJECT_APPEAL_ATTACHMENT_REMARK_MAX_LENGTH) {
      setUploadError('附件备注不能超过 1000 字。');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await onUpload(files, remark.trim());
      setUploadResult(result);
      setFiles([]);
      setRemark('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : '附件上传失败，请稍后重试。',
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || !onDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : '附件删除失败，请稍后重试。',
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              附件下载必须先请求后端 download-url；不提供在线预览、重命名或永久删除。
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
            {attachments.length} 个附件
          </span>
        </div>

        <ErrorAlert message={error} />
        <ErrorAlert message={downloadError} />
        <ErrorAlert message={deleteError} />

        {canMutate && onUpload ? (
          <div className="mb-5 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
            <div className="mb-3">
              <div className="text-sm font-black text-slate-950">
                补充上传附件
              </div>
              <div className="mt-1 text-xs font-semibold text-cyan-700">
                仅 submitted 状态申诉允许补充附件；备注是本次上传批次备注。
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.45fr)]">
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                multiple
                onChange={(event) =>
                  setFiles(Array.from(event.target.files ?? []))
                }
                ref={fileInputRef}
                type="file"
              />
              <input
                className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                maxLength={PROJECT_APPEAL_ATTACHMENT_REMARK_MAX_LENGTH}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="批次备注（选填）"
                value={remark}
              />
            </div>
            {files.length > 0 ? (
              <div className="mt-2 text-xs font-semibold text-slate-500">
                已选择 {files.length} 个文件
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                disabled={uploading || files.length === 0}
                onClick={handleUpload}
                variant="primary"
              >
                {uploading ? '上传中...' : '上传附件'}
              </Button>
              <span className="text-xs text-slate-500">
                文件大小、类型和数量以后端校验为准。
              </span>
            </div>
            <ErrorAlert message={uploadError} />
            {uploadResult ? (
              <UploadResultNotice result={uploadResult} />
            ) : null}
          </div>
        ) : (
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            {readonlyReason}
          </div>
        )}

        {loading ? (
          <LoadingState text="正在加载申诉附件..." />
        ) : attachments.length === 0 ? (
          <EmptyState text={emptyText} title="暂无附件" />
        ) : (
          <div className="grid gap-3">
            {attachments.map((attachment) => (
              <div
                className="rounded-xl border border-slate-200 bg-white p-4"
                key={attachment.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words text-sm font-black text-slate-950">
                      {attachment.originalFilename}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <span>{formatFileSize(attachment.sizeBytes)}</span>
                      <span>{attachment.extension || '-'}</span>
                      <span>上传：{formatDateTime(attachment.createdAt)}</span>
                    </div>
                    {attachment.remark ? (
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {attachment.remark}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      disabled={downloadingId === attachment.id}
                      onClick={() => void handleDownload(attachment)}
                      size="sm"
                      variant="secondary"
                    >
                      {downloadingId === attachment.id ? '获取中...' : '下载'}
                    </Button>
                    {canMutate && onDelete ? (
                      <Button
                        onClick={() => setDeleteTarget(attachment)}
                        size="sm"
                        variant="danger"
                      >
                        删除
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmDialog
          confirmLabel="删除附件"
          description={
            deleteTarget
              ? `确认删除申诉附件“${deleteTarget.originalFilename}”吗？该操作为软删除，不会永久删除存储对象，但删除后当前列表不再展示。`
              : ''
          }
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          open={Boolean(deleteTarget)}
          title="确认删除申诉附件？"
        />
      </div>
    </section>
  );
}

function UploadResultNotice({
  result,
}: {
  result: ProjectAppealAttachmentUploadResult;
}) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700 shadow-sm">
      <div className="font-bold">
        上传完成：成功 {result.successCount} 个，失败 {result.failedCount} 个。
      </div>
      {result.failures.length > 0 ? (
        <ul className="mt-2 grid gap-1 text-amber-800">
          {result.failures.map((failure) => (
            <li key={`${failure.originalFilename}-${failure.message}`}>
              {failure.originalFilename}：{failure.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

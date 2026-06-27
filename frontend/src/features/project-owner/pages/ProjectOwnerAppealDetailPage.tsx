'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppealAttachmentsPanel } from '@/src/components/project-appeals/AppealAttachmentsPanel';
import { AppealDetailPanel } from '@/src/components/project-appeals/AppealDetailPanel';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ProjectOwnerShell } from '@/src/components/layout/ProjectOwnerShell';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import type {
  ProjectAppealAttachment,
  ProjectAppealAttachmentUploadResult,
  ProjectAppealDetail,
  ProjectOwnerConsensus,
} from '@/src/lib/project-appeals/types';
import {
  canOwnerMutateAppealAttachments,
  formatAppealErrorMessage,
  resolveAppealAttachmentDownloadUrl,
} from '@/src/lib/project-appeals/utils';
import {
  getProjectOwnerAppeal,
  getProjectOwnerAppealAttachmentDownloadUrl,
  getProjectOwnerConsensus,
  getProjectOwnerProject,
  listProjectOwnerAppealAttachments,
  loadProjectOwnerReferenceData,
  uploadProjectOwnerAppealAttachments,
} from '../api';
import type {
  ProjectOwnerProject,
  ProjectOwnerReferenceData,
} from '../types';
import {
  buildProjectOwnerLookupMaps,
  createEmptyProjectOwnerLookupMaps,
} from '../utils';

type ProjectOwnerAppealDetailPageProps = {
  appealId: string;
  projectId: string;
};

export function ProjectOwnerAppealDetailPage({
  appealId,
  projectId,
}: ProjectOwnerAppealDetailPageProps) {
  const [appeal, setAppeal] = useState<ProjectAppealDetail | null>(null);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ProjectAppealAttachment[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [consensus, setConsensus] = useState<ProjectOwnerConsensus | null>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectOwnerProject | null>(null);
  const [referenceData, setReferenceData] =
    useState<ProjectOwnerReferenceData | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(
    null,
  );

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildProjectOwnerLookupMaps(referenceData)
        : createEmptyProjectOwnerLookupMaps(),
    [referenceData],
  );
  const canUploadAttachments =
    appeal !== null && canOwnerMutateAppealAttachments(appeal);

  async function loadAppeal() {
    setAppealError(null);

    try {
      setAppeal(await getProjectOwnerAppeal(projectId, appealId));
    } catch (error) {
      setAppeal(null);
      setAppealError(formatAppealErrorMessage(error));
    }
  }

  async function loadAttachments() {
    setAttachmentsError(null);

    try {
      setAttachments(
        await listProjectOwnerAppealAttachments(projectId, appealId),
      );
    } catch (error) {
      setAttachments([]);
      setAttachmentsError(formatAppealErrorMessage(error));
    }
  }

  async function loadPage() {
    setLoading(true);
    setAppealError(null);
    setAttachmentsError(null);
    setReferenceDataError(null);

    const [
      projectResult,
      appealResult,
      attachmentsResult,
      consensusResult,
      referenceResult,
    ] = await Promise.allSettled([
      getProjectOwnerProject(projectId),
      getProjectOwnerAppeal(projectId, appealId),
      listProjectOwnerAppealAttachments(projectId, appealId),
      getProjectOwnerConsensus(projectId),
      loadProjectOwnerReferenceData(),
    ]);

    setProject(projectResult.status === 'fulfilled' ? projectResult.value : null);

    if (appealResult.status === 'fulfilled') {
      setAppeal(appealResult.value);
    } else {
      setAppeal(null);
      setAppealError(formatAppealErrorMessage(appealResult.reason));
    }

    if (attachmentsResult.status === 'fulfilled') {
      setAttachments(attachmentsResult.value);
    } else {
      setAttachments([]);
      setAttachmentsError(formatAppealErrorMessage(attachmentsResult.reason));
    }

    if (consensusResult.status === 'fulfilled') {
      setConsensus(consensusResult.value);
    } else if (
      isApiError(consensusResult.reason) &&
      consensusResult.reason.status === 404
    ) {
      setConsensus(null);
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceData(null);
      setReferenceDataError(getErrorMessage(referenceResult.reason));
    }

    setLoading(false);
  }

  async function handleDownload(attachment: ProjectAppealAttachment) {
    const response = await getProjectOwnerAppealAttachmentDownloadUrl(
      projectId,
      appealId,
      attachment.id,
    );
    const url = resolveAppealAttachmentDownloadUrl(response);

    if (!url) {
      throw new Error('附件下载地址无效。');
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function handleUpload(
    files: File[],
    remark: string,
  ): Promise<ProjectAppealAttachmentUploadResult> {
    const result = await uploadProjectOwnerAppealAttachments({
      appealId,
      files,
      projectId,
      remark,
    });

    await Promise.all([loadAppeal(), loadAttachments()]);
    return result;
  }

  useEffect(() => {
    void loadPage();
  }, [appealId, projectId]);

  return (
    <ProjectOwnerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Appeal Detail</div>
          <h1>{project?.name ?? '申诉详情'}</h1>
          <p>查看申诉状态、处理意见、等级变化和补充材料。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/project-owner/projects/${projectId}/review-result`}
          >
            返回评审结果与申诉
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/project-owner/projects/${projectId}`}
          >
            返回项目详情
          </Link>
        </div>
      </div>

      {referenceDataError ? (
        <ErrorAlert
          message={`基础数据加载失败，部分等级将使用原始值展示：${referenceDataError}`}
        />
      ) : null}

      {loading ? (
        <LoadingState text="正在加载申诉详情..." />
      ) : (
        <div className="grid gap-5">
          <AppealDetailPanel
            appeal={appeal}
            consensus={consensus}
            error={appealError}
            levelLabelByValue={lookupMaps.reviewLevelLabelByValue}
          />

          <AppealAttachmentsPanel
            attachments={attachments}
            canUpload={canUploadAttachments}
            error={attachmentsError}
            onDownload={handleDownload}
            onUpload={canUploadAttachments ? handleUpload : undefined}
            readonlyReason="当前申诉状态下附件只读，可下载，不能继续上传或删除。"
            uploadDescription="申诉提交后，已上传附件将作为申诉材料留痕，不能删除；处理前可继续补充上传材料。"
          />
        </div>
      )}
    </ProjectOwnerShell>
  );
}

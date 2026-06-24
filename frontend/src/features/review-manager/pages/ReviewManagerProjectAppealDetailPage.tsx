'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppealAttachmentsPanel } from '@/src/components/project-appeals/AppealAttachmentsPanel';
import { AppealDetailPanel } from '@/src/components/project-appeals/AppealDetailPanel';
import { AppealHandleForm } from '@/src/components/project-appeals/AppealHandleForm';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ReviewManagerShell } from '@/src/components/layout/ReviewManagerShell';
import type {
  HandleProjectAppealInput,
  ProjectAppealAttachment,
  ProjectAppealDetail,
} from '@/src/lib/project-appeals/types';
import {
  canHandleAppeal,
  formatAppealErrorMessage,
  getReviewLevelOptions,
  resolveAppealAttachmentDownloadUrl,
} from '@/src/lib/project-appeals/utils';
import {
  getReviewManagerAppeal,
  getReviewManagerAppealAttachmentDownloadUrl,
  getReviewManagerProjectSummary,
  handleReviewManagerAppeal,
  listReviewManagerAppealAttachments,
  loadReviewManagerReferenceData,
} from '../api';
import type {
  ReviewManagerProjectListItem,
  ReviewManagerReferenceData,
} from '../types';
import {
  buildReviewManagerLookupMaps,
  createEmptyReviewManagerLookupMaps,
  formatReviewManagerErrorMessage,
} from '../utils';

type ReviewManagerProjectAppealDetailPageProps = {
  appealId: string;
  projectId: string;
};

export function ReviewManagerProjectAppealDetailPage({
  appealId,
  projectId,
}: ReviewManagerProjectAppealDetailPageProps) {
  const [appeal, setAppeal] = useState<ProjectAppealDetail | null>(null);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ProjectAppealAttachment[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handling, setHandling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [project, setProject] = useState<ReviewManagerProjectListItem | null>(
    null,
  );
  const [referenceData, setReferenceData] =
    useState<ReviewManagerReferenceData | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(
    null,
  );

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildReviewManagerLookupMaps(referenceData)
        : createEmptyReviewManagerLookupMaps(),
    [referenceData],
  );
  const levelOptions = getReviewLevelOptions(referenceData?.reviewLevels);
  const canHandle = appeal !== null && canHandleAppeal(appeal);

  async function loadAppeal() {
    setAppealError(null);

    try {
      setAppeal(await getReviewManagerAppeal(projectId, appealId));
    } catch (error) {
      setAppeal(null);
      setAppealError(formatReviewManagerErrorMessage(error));
    }
  }

  async function loadAttachments() {
    setAttachmentsError(null);

    try {
      setAttachments(
        await listReviewManagerAppealAttachments(projectId, appealId),
      );
    } catch (error) {
      setAttachments([]);
      setAttachmentsError(formatReviewManagerErrorMessage(error));
    }
  }

  async function loadProjectSummary() {
    setProject(await getReviewManagerProjectSummary(projectId));
  }

  async function loadPage() {
    setLoading(true);
    setAppealError(null);
    setAttachmentsError(null);
    setReferenceDataError(null);

    const [projectResult, appealResult, attachmentsResult, referenceResult] =
      await Promise.allSettled([
        getReviewManagerProjectSummary(projectId),
        getReviewManagerAppeal(projectId, appealId),
        listReviewManagerAppealAttachments(projectId, appealId),
        loadReviewManagerReferenceData(),
      ]);

    setProject(projectResult.status === 'fulfilled' ? projectResult.value : null);

    if (appealResult.status === 'fulfilled') {
      setAppeal(appealResult.value);
    } else {
      setAppeal(null);
      setAppealError(formatReviewManagerErrorMessage(appealResult.reason));
    }

    if (attachmentsResult.status === 'fulfilled') {
      setAttachments(attachmentsResult.value);
    } else {
      setAttachments([]);
      setAttachmentsError(formatReviewManagerErrorMessage(attachmentsResult.reason));
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceData(null);
      setReferenceDataError(formatReviewManagerErrorMessage(referenceResult.reason));
    }

    setLoading(false);
  }

  async function handleDownload(attachment: ProjectAppealAttachment) {
    const response = await getReviewManagerAppealAttachmentDownloadUrl(
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

  async function handleSubmitAppeal(input: HandleProjectAppealInput) {
    setHandling(true);
    setHandleError(null);
    setNotice(null);

    try {
      await handleReviewManagerAppeal(projectId, appealId, input);
      setNotice('申诉处理结果已提交。');
      await Promise.all([loadAppeal(), loadAttachments(), loadProjectSummary()]);
    } catch (error) {
      setHandleError(formatAppealErrorMessage(error));
    } finally {
      setHandling(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [appealId, projectId]);

  return (
    <ReviewManagerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Appeal Handling</div>
          <h1>{project?.name ?? '申诉详情'}</h1>
          <p>查看申诉说明、关联合议摘要、附件，并处理 submitted / processing 状态申诉。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {project ? <Badge tone="primary">{project.projectNo}</Badge> : null}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/review-manager/projects/${projectId}/appeals`}
          >
            返回申诉列表
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/review-manager/projects/${projectId}/consensus`}
          >
            返回合议处理
          </Link>
        </div>
      </div>

      {referenceDataError ? (
        <ErrorAlert
          message={`基础数据加载失败，部分等级将使用原始值展示：${referenceDataError}`}
        />
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <LoadingState text="正在加载申诉详情..." />
      ) : (
        <div className="grid gap-5">
          <AppealDetailPanel
            appeal={appeal}
            error={appealError}
            levelLabelByValue={lookupMaps.reviewLevelLabelByValue}
          />

          <AppealAttachmentsPanel
            attachments={attachments}
            error={attachmentsError}
            onDownload={handleDownload}
            readonlyReason="评审负责人仅可查看和下载申诉附件，不提供上传或删除。"
          />

          {appeal && canHandle ? (
            <AppealHandleForm
              currentFinalLevel={
                project?.finalLevel || appeal.levelAfterHandling || appeal.levelBeforeAppeal
              }
              error={handleError}
              levelLabelByValue={lookupMaps.reviewLevelLabelByValue}
              levelOptions={levelOptions}
              onSubmit={handleSubmitAppeal}
              submitting={handling}
            />
          ) : appeal ? (
            <section className="panel">
              <div className="panel-body">
                <h2 className="m-0 text-lg font-black text-slate-950">
                  处理申诉
                </h2>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  当前申诉已结束或不可处理，处理结果只读展示。
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </ReviewManagerShell>
  );
}

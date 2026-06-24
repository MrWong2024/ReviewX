'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppealAttachmentsPanel } from '@/src/components/project-appeals/AppealAttachmentsPanel';
import { AppealDetailPanel } from '@/src/components/project-appeals/AppealDetailPanel';
import { AppealHandleForm } from '@/src/components/project-appeals/AppealHandleForm';
import { LevelHistoryPanel } from '@/src/components/project-appeals/LevelHistoryPanel';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import type {
  HandleProjectAppealInput,
  ProjectAppealAttachment,
  ProjectAppealDetail,
  ProjectLevelChangeLog,
} from '@/src/lib/project-appeals/types';
import {
  buildReviewLevelLabelMap,
  canHandleAppeal,
  formatAppealErrorMessage,
  getReviewLevelOptions,
  resolveAppealAttachmentDownloadUrl,
} from '@/src/lib/project-appeals/utils';
import {
  getAdminProjectAppeal,
  getAdminProjectAppealAttachmentDownloadUrl,
  getProject,
  handleAdminProjectAppeal,
  listAdminProjectAppealAttachments,
  listAdminProjectLevelHistory,
  listDictionaries,
} from '../api';
import type { Dictionary, Project } from '../types';

type ProjectAdminAppealDetailPageProps = {
  appealId: string;
  projectId: string;
};

export function ProjectAdminAppealDetailPage({
  appealId,
  projectId,
}: ProjectAdminAppealDetailPageProps) {
  const [appeal, setAppeal] = useState<ProjectAppealDetail | null>(null);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ProjectAppealAttachment[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [handling, setHandling] = useState(false);
  const [history, setHistory] = useState<ProjectLevelChangeLog[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [reviewLevels, setReviewLevels] = useState<Dictionary[]>([]);
  const [reviewLevelsError, setReviewLevelsError] = useState<string | null>(
    null,
  );

  const levelOptions = getReviewLevelOptions(reviewLevels);
  const levelLabelByValue = useMemo(
    () => buildReviewLevelLabelMap(levelOptions),
    [levelOptions],
  );
  const canHandle = appeal !== null && canHandleAppeal(appeal);

  async function loadAppeal() {
    setAppealError(null);

    try {
      setAppeal(await getAdminProjectAppeal(projectId, appealId));
    } catch (error) {
      setAppeal(null);
      setAppealError(formatAppealErrorMessage(error));
    }
  }

  async function loadAttachments() {
    setAttachmentsError(null);

    try {
      setAttachments(await listAdminProjectAppealAttachments(projectId, appealId));
    } catch (error) {
      setAttachments([]);
      setAttachmentsError(formatAppealErrorMessage(error));
    }
  }

  async function loadHistory() {
    setHistoryError(null);

    try {
      setHistory(await listAdminProjectLevelHistory(projectId));
    } catch (error) {
      setHistory([]);
      setHistoryError(formatAppealErrorMessage(error));
    }
  }

  async function loadProject() {
    setProject(await getProject(projectId));
  }

  async function loadPage() {
    setLoading(true);
    setAppealError(null);
    setAttachmentsError(null);
    setHistoryError(null);
    setReviewLevelsError(null);

    const [
      projectResult,
      appealResult,
      attachmentsResult,
      historyResult,
      levelsResult,
    ] = await Promise.allSettled([
      getProject(projectId),
      getAdminProjectAppeal(projectId, appealId),
      listAdminProjectAppealAttachments(projectId, appealId),
      listAdminProjectLevelHistory(projectId),
      listDictionaries({ dictType: 'review_level' }),
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

    if (historyResult.status === 'fulfilled') {
      setHistory(historyResult.value);
    } else {
      setHistory([]);
      setHistoryError(formatAppealErrorMessage(historyResult.reason));
    }

    if (levelsResult.status === 'fulfilled') {
      setReviewLevels(levelsResult.value.filter((item) => item.isActive));
    } else {
      setReviewLevels([]);
      setReviewLevelsError(formatAppealErrorMessage(levelsResult.reason));
    }

    setLoading(false);
  }

  async function handleDownload(attachment: ProjectAppealAttachment) {
    const response = await getAdminProjectAppealAttachmentDownloadUrl(
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
      await handleAdminProjectAppeal(projectId, appealId, input);
      setNotice('申诉处理结果已提交。');
      await Promise.all([
        loadAppeal(),
        loadAttachments(),
        loadHistory(),
        loadProject(),
      ]);
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
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">Admin Appeal Detail</div>
          <h1>{project?.name ?? '申诉详情'}</h1>
          <p>管理员可查看申诉详情、下载附件，并处理 submitted / processing 状态申诉。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {project ? <Badge tone="primary">{project.projectNo}</Badge> : null}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/admin/projects/${projectId}/appeals`}
          >
            返回申诉列表
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/admin/projects/${projectId}/review-organization`}
          >
            返回评审组织
          </Link>
        </div>
      </div>

      {reviewLevelsError ? (
        <ErrorAlert
          message={`评审等级字典加载失败，将使用原始等级值展示：${reviewLevelsError}`}
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
            levelLabelByValue={levelLabelByValue}
          />

          <AppealAttachmentsPanel
            attachments={attachments}
            error={attachmentsError}
            onDownload={handleDownload}
            readonlyReason="管理员可查看和下载申诉附件；附件上传和删除仍由项目负责人在 submitted 状态维护。"
          />

          {appeal && canHandle ? (
            <AppealHandleForm
              currentFinalLevel={
                project?.finalLevel || appeal.levelAfterHandling || appeal.levelBeforeAppeal
              }
              error={handleError}
              levelLabelByValue={levelLabelByValue}
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

          <LevelHistoryPanel
            error={historyError}
            history={history}
            levelLabelByValue={levelLabelByValue}
          />
        </div>
      )}
    </>
  );
}

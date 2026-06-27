'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppealListPanel } from '@/src/components/project-appeals/AppealListPanel';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ReviewManagerShell } from '@/src/components/layout/ReviewManagerShell';
import { formatDateTime } from '@/src/lib/format/date';
import type { ProjectAppeal } from '@/src/lib/project-appeals/types';
import {
  getReviewManagerProjectSummary,
  listReviewManagerAppeals,
  loadReviewManagerReferenceData,
} from '../api';
import type {
  ReviewManagerLookupMaps,
  ReviewManagerProjectListItem,
  ReviewManagerReferenceData,
} from '../types';
import {
  buildReviewManagerLookupMaps,
  createEmptyReviewManagerLookupMaps,
  formatLookupName,
  formatNames,
  formatReviewManagerErrorMessage,
} from '../utils';

type ReviewManagerProjectAppealsPageProps = {
  projectId: string;
};

export function ReviewManagerProjectAppealsPage({
  projectId,
}: ReviewManagerProjectAppealsPageProps) {
  const [appeals, setAppeals] = useState<ProjectAppeal[]>([]);
  const [appealsError, setAppealsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ReviewManagerProjectListItem | null>(
    null,
  );
  const [projectError, setProjectError] = useState<string | null>(null);
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

  async function loadPage() {
    setLoading(true);
    setProjectError(null);
    setAppealsError(null);
    setReferenceDataError(null);

    const [projectResult, appealsResult, referenceResult] =
      await Promise.allSettled([
        getReviewManagerProjectSummary(projectId),
        listReviewManagerAppeals(projectId),
        loadReviewManagerReferenceData(),
      ]);

    if (projectResult.status === 'fulfilled') {
      setProject(projectResult.value);
      setProjectError(projectResult.value ? null : '项目摘要不可用或无权限。');
    } else {
      setProject(null);
      setProjectError(formatReviewManagerErrorMessage(projectResult.reason));
    }

    if (appealsResult.status === 'fulfilled') {
      setAppeals(appealsResult.value);
    } else {
      setAppeals([]);
      setAppealsError(formatReviewManagerErrorMessage(appealsResult.reason));
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceData(null);
      setReferenceDataError(formatReviewManagerErrorMessage(referenceResult.reason));
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, [projectId]);

  return (
    <ReviewManagerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Appeal Workspace</div>
          <h1>{project?.name ?? '项目申诉处理'}</h1>
          <p>查看自己负责项目的申诉列表，并进入详情处理 submitted / processing 状态申诉。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/review-manager/projects/${projectId}`}
          >
            返回项目总览
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
          message={`基础数据加载失败，部分名称或等级将使用原始值展示：${referenceDataError}`}
        />
      ) : null}

      {loading ? (
        <LoadingState text="正在加载项目申诉..." />
      ) : (
        <div className="grid gap-5">
          <ProjectSummaryCard
            error={projectError}
            lookupMaps={lookupMaps}
            project={project}
          />
          <AppealListPanel
            appeals={appeals}
            detailHref={(appeal) =>
              `/review-manager/projects/${projectId}/appeals/${appeal.id}`
            }
            error={appealsError}
            levelLabelByValue={lookupMaps.reviewLevelLabelByValue}
            title="项目申诉列表"
          />
        </div>
      )}
    </ReviewManagerShell>
  );
}

function ProjectSummaryCard({
  error,
  lookupMaps,
  project,
}: {
  error?: string | null;
  lookupMaps: ReviewManagerLookupMaps;
  project: ReviewManagerProjectListItem | null;
}) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">项目摘要</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              review-manager 视角仅展示当前账号负责项目。
            </p>
          </div>
          {project ? <Badge tone="primary">{project.projectNo}</Badge> : null}
        </div>
        {project ? (
          <div className="grid gap-3 md:grid-cols-4">
            <InfoTile label="项目名称" value={project.name} />
            <InfoTile
              label="批次"
              value={formatLookupName(
                project.batchId,
                lookupMaps.batchNameById,
                '未知批次',
              )}
            />
            <InfoTile
              label="项目类型"
              value={formatLookupName(
                project.projectTypeId,
                lookupMaps.treeNameById,
                '未知类型',
              )}
            />
            <InfoTile
              label="承担单位"
              value={formatLookupName(
                project.leadOrganizationId,
                lookupMaps.organizationNameById,
                '未知单位',
              )}
            />
            <InfoTile
              label="合作单位"
              value={formatNames(
                project.cooperationOrganizationIds,
                lookupMaps.organizationNameById,
                '未知单位',
              )}
            />
            <InfoTile
              label="项目负责人"
              value={formatLookupName(
                project.ownerUserId,
                lookupMaps.userNameById,
                '未知负责人',
              )}
            />
            <InfoTile label="评审时间" value={formatDateTime(project.reviewTime)} />
            <InfoTile label="最终等级" value={project.finalLevel ?? '-'} />
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            {error ?? '项目摘要不可用或无权限。'}
          </div>
        )}
      </div>
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

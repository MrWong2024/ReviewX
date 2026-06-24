'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppealListPanel } from '@/src/components/project-appeals/AppealListPanel';
import { LevelHistoryPanel } from '@/src/components/project-appeals/LevelHistoryPanel';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { formatDateTime } from '@/src/lib/format/date';
import type {
  ProjectAppeal,
  ProjectLevelChangeLog,
} from '@/src/lib/project-appeals/types';
import {
  buildReviewLevelLabelMap,
  formatAppealErrorMessage,
  formatLevel,
  getReviewLevelOptions,
} from '@/src/lib/project-appeals/utils';
import {
  getProject,
  listAdminProjectAppeals,
  listAdminProjectLevelHistory,
  listDictionaries,
} from '../api';
import type { Dictionary, Project } from '../types';

type ProjectAdminAppealsPageProps = {
  projectId: string;
};

export function ProjectAdminAppealsPage({
  projectId,
}: ProjectAdminAppealsPageProps) {
  const [appeals, setAppeals] = useState<ProjectAppeal[]>([]);
  const [appealsError, setAppealsError] = useState<string | null>(null);
  const [history, setHistory] = useState<ProjectLevelChangeLog[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [reviewLevels, setReviewLevels] = useState<Dictionary[]>([]);
  const [reviewLevelsError, setReviewLevelsError] = useState<string | null>(
    null,
  );

  const levelLabelByValue = useMemo(
    () => buildReviewLevelLabelMap(getReviewLevelOptions(reviewLevels)),
    [reviewLevels],
  );

  async function loadPage() {
    setLoading(true);
    setProjectError(null);
    setAppealsError(null);
    setHistoryError(null);
    setReviewLevelsError(null);

    const [projectResult, appealsResult, historyResult, levelsResult] =
      await Promise.allSettled([
        getProject(projectId),
        listAdminProjectAppeals(projectId),
        listAdminProjectLevelHistory(projectId),
        listDictionaries({ dictType: 'review_level' }),
      ]);

    if (projectResult.status === 'fulfilled') {
      setProject(projectResult.value);
    } else {
      setProject(null);
      setProjectError(formatAppealErrorMessage(projectResult.reason));
    }

    if (appealsResult.status === 'fulfilled') {
      setAppeals(appealsResult.value);
    } else {
      setAppeals([]);
      setAppealsError(formatAppealErrorMessage(appealsResult.reason));
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

  useEffect(() => {
    void loadPage();
  }, [projectId]);

  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">Admin Appeals</div>
          <h1>{project?.name ?? '项目申诉'}</h1>
          <p>管理员可查看并处理任意项目申诉，并查看等级变更历史。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/admin/projects/${projectId}/review-organization`}
          >
            返回评审组织
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href="/admin/projects"
          >
            返回项目列表
          </Link>
        </div>
      </div>

      <ErrorAlert message={projectError} />
      {reviewLevelsError ? (
        <ErrorAlert
          message={`评审等级字典加载失败，将使用原始等级值展示：${reviewLevelsError}`}
        />
      ) : null}

      {loading ? (
        <LoadingState text="正在加载项目申诉..." />
      ) : (
        <div className="grid gap-5">
          <ProjectSummaryCard
            levelLabelByValue={levelLabelByValue}
            project={project}
          />
          <AppealListPanel
            appeals={appeals}
            detailHref={(appeal) =>
              `/admin/projects/${projectId}/appeals/${appeal.id}`
            }
            error={appealsError}
            levelLabelByValue={levelLabelByValue}
            title="项目申诉列表"
          />
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

function ProjectSummaryCard({
  levelLabelByValue,
  project,
}: {
  levelLabelByValue: Map<string, string>;
  project: Project | null;
}) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">项目摘要</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              admin 命名空间全局查看项目申诉，不调用 review-manager 接口。
            </p>
          </div>
          {project ? <Badge tone="primary">{project.projectNo}</Badge> : null}
        </div>
        {project ? (
          <div className="grid gap-3 md:grid-cols-4">
            <InfoTile label="项目名称" value={project.name} />
            <InfoTile label="评审时间" value={formatDateTime(project.reviewTime)} />
            <InfoTile
              label="原始等级"
              value={formatLevel(project.originalLevel, levelLabelByValue)}
            />
            <InfoTile
              label="最终等级"
              value={formatLevel(project.finalLevel, levelLabelByValue)}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            项目摘要不可用。
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

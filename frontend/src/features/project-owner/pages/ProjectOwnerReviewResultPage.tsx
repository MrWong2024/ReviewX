'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppealListPanel } from '@/src/components/project-appeals/AppealListPanel';
import { LevelHistoryPanel } from '@/src/components/project-appeals/LevelHistoryPanel';
import { ProjectOwnerCreateAppealDialog } from '@/src/components/project-appeals/ProjectOwnerCreateAppealDialog';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ProjectOwnerShell } from '@/src/components/layout/ProjectOwnerShell';
import { Button } from '@/src/components/ui/Button';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import type {
  ProjectAppeal,
  ProjectLevelChangeLog,
  ProjectOwnerConsensus,
} from '@/src/lib/project-appeals/types';
import {
  formatAppealErrorMessage,
  formatLevel,
  isAppealPending,
  PROJECT_APPEAL_MAX_COUNT,
} from '@/src/lib/project-appeals/utils';
import {
  createProjectOwnerAppeal,
  getProjectOwnerConsensus,
  getProjectOwnerProject,
  listProjectOwnerAppeals,
  listProjectOwnerLevelHistory,
  loadProjectOwnerReferenceData,
} from '../api';
import { ProjectOwnerProjectInfoPanel } from '../components/ProjectOwnerProjectInfoPanel';
import type {
  CreateProjectAppealInput,
  ProjectOwnerProject,
  ProjectOwnerReferenceData,
} from '../types';
import {
  buildProjectOwnerLookupMaps,
  createEmptyProjectOwnerLookupMaps,
} from '../utils';

type ProjectOwnerReviewResultPageProps = {
  projectId: string;
};

export function ProjectOwnerReviewResultPage({
  projectId,
}: ProjectOwnerReviewResultPageProps) {
  const [appeals, setAppeals] = useState<ProjectAppeal[]>([]);
  const [appealsError, setAppealsError] = useState<string | null>(null);
  const [consensus, setConsensus] = useState<ProjectOwnerConsensus | null>(null);
  const [consensusError, setConsensusError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creatingAppeal, setCreatingAppeal] = useState(false);
  const [history, setHistory] = useState<ProjectLevelChangeLog[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectOwnerProject | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
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
  const pendingAppeal = appeals.find(isAppealPending) ?? null;
  const createDisabledReason = getCreateAppealDisabledReason({
    appealCount: appeals.length,
    consensus,
    pendingAppeal,
    project,
  });
  const canCreateAppeal = !createDisabledReason;

  async function loadPage() {
    setLoading(true);
    setProjectError(null);
    setConsensusError(null);
    setHistoryError(null);
    setAppealsError(null);
    setReferenceDataError(null);

    const [
      projectResult,
      consensusResult,
      historyResult,
      appealsResult,
      referenceResult,
    ] = await Promise.allSettled([
      getProjectOwnerProject(projectId),
      getProjectOwnerConsensus(projectId),
      listProjectOwnerLevelHistory(projectId),
      listProjectOwnerAppeals(projectId),
      loadProjectOwnerReferenceData(),
    ]);

    if (projectResult.status === 'fulfilled') {
      setProject(projectResult.value);
    } else {
      setProject(null);
      setProjectError(getErrorMessage(projectResult.reason));
    }

    if (consensusResult.status === 'fulfilled') {
      setConsensus(consensusResult.value);
    } else {
      setConsensus(null);

      if (
        isApiError(consensusResult.reason) &&
        consensusResult.reason.status === 404
      ) {
        setConsensusError(null);
      } else {
        setConsensusError(formatAppealErrorMessage(consensusResult.reason));
      }
    }

    if (historyResult.status === 'fulfilled') {
      setHistory(historyResult.value);
    } else {
      setHistory([]);
      setHistoryError(formatAppealErrorMessage(historyResult.reason));
    }

    if (appealsResult.status === 'fulfilled') {
      setAppeals(appealsResult.value);
    } else {
      setAppeals([]);
      setAppealsError(formatAppealErrorMessage(appealsResult.reason));
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceData(null);
      setReferenceDataError(getErrorMessage(referenceResult.reason));
    }

    setLoading(false);
  }

  async function reloadAppealsAndHistory() {
    const [appealsResponse, historyResponse, projectResponse] =
      await Promise.all([
        listProjectOwnerAppeals(projectId),
        listProjectOwnerLevelHistory(projectId),
        getProjectOwnerProject(projectId),
      ]);

    setAppeals(appealsResponse);
    setHistory(historyResponse);
    setProject(projectResponse);
  }

  async function handleCreateAppeal(input: CreateProjectAppealInput) {
    setCreatingAppeal(true);
    setCreateError(null);
    setNotice(null);

    try {
      const created = await createProjectOwnerAppeal(input);
      setNotice(`申诉已提交：第 ${created.appealNo} 次申诉。`);
      setCreateDialogOpen(false);
      await reloadAppealsAndHistory();
      return created;
    } catch (error) {
      const message = formatAppealErrorMessage(error);
      setCreateError(message);
      throw new Error(message);
    } finally {
      setCreatingAppeal(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [projectId]);

  return (
    <ProjectOwnerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Review Result</div>
          <h1>{project?.name ?? '评审结果与申诉'}</h1>
          <p>查看已确认合议结果、最终等级、等级变更历史和本人申诉记录。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/project-owner/projects/${projectId}`}
          >
            返回项目详情
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href="/project-owner/projects"
          >
            返回我的项目
          </Link>
        </div>
      </div>

      <ErrorAlert message={projectError} />
      {referenceDataError ? (
        <ErrorAlert
          message={`基础数据加载失败，部分等级或名称将使用原始值展示：${referenceDataError}`}
        />
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <LoadingState text="正在加载评审结果与申诉..." />
      ) : project ? (
        <div className="grid gap-5">
          <ProjectOwnerProjectInfoPanel
            lookupMaps={lookupMaps}
            project={project}
          />

          <ConsensusResultPanel
            consensus={consensus}
            consensusError={consensusError}
            finalLevel={project.finalLevel}
            levelLabelByValue={lookupMaps.reviewLevelLabelByValue}
          />

          <section className="panel">
            <div className="panel-body">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-black text-slate-950">
                    发起申诉
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    每个项目最多申诉 {PROJECT_APPEAL_MAX_COUNT} 次；存在未处理申诉时不能再次提交。
                  </p>
                </div>
                <Button
                  disabled={!canCreateAppeal || creatingAppeal}
                  onClick={() => {
                    setCreateError(null);
                    setCreateDialogOpen(true);
                  }}
                  title={createDisabledReason ?? undefined}
                  variant="primary"
                >
                  发起申诉
                </Button>
              </div>
              {createDisabledReason ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  {createDisabledReason}
                </div>
              ) : (
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-sm font-semibold text-cyan-700">
                  当前项目满足前端发起条件；后端仍会最终校验权限、合议状态、最终等级、次数和未处理申诉。
                </div>
              )}
            </div>
          </section>

          <LevelHistoryPanel
            error={historyError}
            history={history}
            levelLabelByValue={lookupMaps.reviewLevelLabelByValue}
          />

          <AppealListPanel
            appeals={appeals}
            detailHref={(appeal) =>
              `/project-owner/projects/${projectId}/appeals/${appeal.id}`
            }
            error={appealsError}
            levelLabelByValue={lookupMaps.reviewLevelLabelByValue}
          />
        </div>
      ) : null}

      <ProjectOwnerCreateAppealDialog
        canCreate={canCreateAppeal}
        disabledReason={createDisabledReason}
        error={createError}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateAppeal}
        open={createDialogOpen}
        projectId={projectId}
        submitting={creatingAppeal}
      />
    </ProjectOwnerShell>
  );
}

function ConsensusResultPanel({
  consensus,
  consensusError,
  finalLevel,
  levelLabelByValue,
}: {
  consensus: ProjectOwnerConsensus | null;
  consensusError: string | null;
  finalLevel?: string;
  levelLabelByValue: Map<string, string>;
}) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              已确认合议结果
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              只有 confirmed 合议结果可用于项目负责人查看和发起申诉。
            </p>
          </div>
          <Badge tone={consensus ? 'success' : 'muted'}>
            {consensus ? '已确认' : '暂无已确认'}
          </Badge>
        </div>

        <ErrorAlert message={consensusError} />
        {consensus ? (
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-4">
              <InfoTile
                label="最终等级"
                value={formatLevel(finalLevel || consensus.finalLevel, levelLabelByValue)}
              />
              <InfoTile label="最终分数" value={formatScore(consensus.finalScore)} />
              <InfoTile
                label="确认时间"
                value={formatDateTime(consensus.confirmedAt)}
              />
              <InfoTile
                label="专家提交"
                value={`${consensus.expertReviewStats.submittedCount} / ${consensus.expertReviewStats.expertCount}`}
              />
              <InfoTile
                label="平均分"
                value={formatScore(consensus.expertReviewStats.averageScore)}
              />
              <InfoTile
                label="最高分"
                value={formatScore(consensus.expertReviewStats.maxScore)}
              />
              <InfoTile
                label="最低分"
                value={formatScore(consensus.expertReviewStats.minScore)}
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-xs font-bold text-slate-500">合议意见</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {consensus.finalOpinion || '暂无合议意见。'}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            暂无已确认合议结果。
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

function formatScore(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

function getCreateAppealDisabledReason({
  appealCount,
  consensus,
  pendingAppeal,
  project,
}: {
  appealCount: number;
  consensus: ProjectOwnerConsensus | null;
  pendingAppeal: ProjectAppeal | null;
  project: ProjectOwnerProject | null;
}): string | null {
  if (!project) {
    return '项目详情不可用，暂不能发起申诉。';
  }

  if (!consensus) {
    return '暂无已确认合议结果，暂不能发起申诉。';
  }

  if (!project.finalLevel) {
    return '项目尚无最终等级，暂不能发起申诉。';
  }

  if (appealCount >= PROJECT_APPEAL_MAX_COUNT) {
    return '该项目申诉次数已达 3 次上限。';
  }

  if (pendingAppeal) {
    return '该项目存在未处理申诉，处理完成前不能再次提交。';
  }

  return null;
}

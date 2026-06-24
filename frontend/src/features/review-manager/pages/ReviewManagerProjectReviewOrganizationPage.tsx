'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ReviewManagerShell } from '@/src/components/layout/ReviewManagerShell';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  getExpertAssignmentLockMessage,
  getExpertAssignmentLockReasons,
} from '@/src/lib/project-review/expert-assignment-lock';
import { getProjectConsensus, getReviewManagerProjectSummary, loadReviewManagerReferenceData } from '../api';
import { ReviewManagerExpertAssignmentsPanel } from '../components/ReviewManagerExpertAssignmentsPanel';
import { ReviewManagerProjectMaterialsPanel } from '../components/ReviewManagerProjectMaterialsPanel';
import { ReviewManagerScheduleForm } from '../components/ReviewManagerScheduleForm';
import type {
  ConsensusReviewResponse,
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
  formatScore,
  getReviewSchemeTotalScore,
} from '../utils';

type ReviewManagerProjectReviewOrganizationPageProps = {
  projectId: string;
};

export function ReviewManagerProjectReviewOrganizationPage({
  projectId,
}: ReviewManagerProjectReviewOrganizationPageProps) {
  const [consensus, setConsensus] = useState<ConsensusReviewResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
  const lockReasons = useMemo(
    () =>
      project
        ? getExpertAssignmentLockReasons({
            finalLevel: project.finalLevel,
            hasConsensus: Boolean(consensus),
            originalLevel: project.originalLevel,
            reviewTime: project.reviewTime,
          })
        : [],
    [consensus, project],
  );
  const locked = lockReasons.length > 0;
  const lockMessage = getExpertAssignmentLockMessage(lockReasons);

  async function loadPage() {
    setLoading(true);
    setError(null);

    const [projectResult, referenceResult, consensusResult] =
      await Promise.allSettled([
        getReviewManagerProjectSummary(projectId),
        loadReviewManagerReferenceData(),
        getProjectConsensus(projectId),
      ]);

    if (projectResult.status === 'fulfilled') {
      setProject(projectResult.value);
      if (!projectResult.value) {
        setError('项目摘要不可用或无权限。');
      }
    } else {
      setProject(null);
      setError(formatReviewManagerErrorMessage(projectResult.reason));
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
      setReferenceDataError(null);
    } else {
      setReferenceData(null);
      setReferenceDataError(
        formatReviewManagerErrorMessage(referenceResult.reason),
      );
    }

    setConsensus(
      consensusResult.status === 'fulfilled' ? consensusResult.value : null,
    );
    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, [projectId]);

  function handleScheduleSaved(updated: ReviewManagerProjectListItem) {
    setProject(updated);
  }

  return (
    <ReviewManagerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Review Organization</div>
          <h1>{project?.name ?? '评审组织'}</h1>
          <p>评审前组织项目材料、评审安排和专家名单。</p>
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
            进入合议处理
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href="/review-manager/projects"
          >
            返回负责项目
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} />
      {referenceDataError ? (
        <ErrorAlert
          message={`基础数据加载失败，部分名称将使用短 ID 兜底：${referenceDataError}`}
        />
      ) : null}

      {loading ? (
        <LoadingState text="正在加载评审组织信息..." />
      ) : project ? (
        <div className="grid gap-5">
          <ReviewOrganizationSummary project={project} lookupMaps={lookupMaps} />
          <ReviewAssignmentReadonly project={project} lookupMaps={lookupMaps} />
          <ReviewManagerScheduleForm
            onSaved={handleScheduleSaved}
            project={project}
          />
          <ReviewManagerProjectMaterialsPanel
            materialTypeNameById={lookupMaps.dictionaryNameById}
            projectId={projectId}
          />
          <ReviewManagerExpertAssignmentsPanel
            disciplineNameById={lookupMaps.treeNameById}
            locked={locked}
            lockMessage={lockMessage}
            lockReasons={lockReasons}
            onChanged={loadPage}
            organizationNameById={lookupMaps.organizationNameById}
            projectId={projectId}
          />
        </div>
      ) : null}
    </ReviewManagerShell>
  );
}

function ReviewOrganizationSummary({
  lookupMaps,
  project,
}: {
  lookupMaps: ReviewManagerLookupMaps;
  project: ReviewManagerProjectListItem;
}) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">基础信息</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              项目摘要通过负责项目列表大页查询后前端匹配。
            </p>
          </div>
          <Badge tone="primary">{project.projectNo}</Badge>
        </div>
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
            label="项目状态"
            value={formatLookupName(
              project.statusId,
              lookupMaps.dictionaryNameById,
              '未知状态',
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
          <InfoTile
            label="学科"
            value={formatNames(
              project.disciplineIds,
              lookupMaps.treeNameById,
              '未知学科',
            )}
          />
          <InfoTile label="评审时间" value={formatDateTime(project.reviewTime)} />
          <InfoTile
            label="评审地点"
            value={displayValue(project.reviewLocation)}
          />
          <InfoTile
            label="会议链接"
            value={displayValue(project.meetingUrl)}
          />
          <InfoTile
            label="评分方案总分"
            value={formatScore(
              getReviewSchemeTotalScore(project.reviewSchemeSnapshot),
              '暂无',
            )}
          />
        </div>
      </div>
    </section>
  );
}

function ReviewAssignmentReadonly({
  lookupMaps,
  project,
}: {
  lookupMaps: ReviewManagerLookupMaps;
  project: ReviewManagerProjectListItem;
}) {
  return (
    <section className="panel">
      <div className="panel-body">
        <h2 className="m-0 text-lg font-black text-slate-950">评审分配</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          评审负责人只能查看负责人和评审方案，不能变更该治理分配。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoTile
            label="评审负责人"
            value={formatLookupName(
              project.reviewManagerId,
              lookupMaps.userNameById,
              '未知评审负责人',
            )}
          />
          <InfoTile
            label="评审方案"
            value={formatLookupName(
              project.reviewSchemeId,
              lookupMaps.reviewSchemeNameById,
              '未知评审方案',
            )}
          />
        </div>
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

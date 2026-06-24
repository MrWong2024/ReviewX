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
  getProjectConsensus,
  getProjectReviewSummary,
  getReviewManagerProjectSummary,
  listReviewManagerAssignedProjectExperts,
  loadReviewManagerReferenceData,
} from '../api';
import type {
  ConsensusReviewResponse,
  ReviewManagerLookupMaps,
  ReviewManagerProjectListItem,
  ReviewManagerReferenceData,
  ReviewSummaryResponse,
} from '../types';
import {
  buildReviewManagerLookupMaps,
  createEmptyReviewManagerLookupMaps,
  formatLookupName,
  formatNames,
  formatReviewManagerErrorMessage,
  getReviewSchemeTotalScore,
} from '../utils';

type ReviewManagerProjectOverviewPageProps = {
  projectId: string;
};

export function ReviewManagerProjectOverviewPage({
  projectId,
}: ReviewManagerProjectOverviewPageProps) {
  const [assignedExpertCount, setAssignedExpertCount] = useState<number | null>(
    null,
  );
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
  const [reviewSummary, setReviewSummary] =
    useState<ReviewSummaryResponse | null>(null);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildReviewManagerLookupMaps(referenceData)
        : createEmptyReviewManagerLookupMaps(),
    [referenceData],
  );

  async function loadPage() {
    setLoading(true);
    setError(null);

    const [projectResult, referenceResult, expertsResult, summaryResult, consensusResult] =
      await Promise.allSettled([
        getReviewManagerProjectSummary(projectId),
        loadReviewManagerReferenceData(),
        listReviewManagerAssignedProjectExperts(projectId),
        getProjectReviewSummary(projectId),
        getProjectConsensus(projectId),
      ]);

    if (projectResult.status === 'fulfilled') {
      setProject(projectResult.value);
    } else {
      setProject(null);
      setError(formatReviewManagerErrorMessage(projectResult.reason));
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    }

    setAssignedExpertCount(
      expertsResult.status === 'fulfilled' ? expertsResult.value.length : null,
    );
    setReviewSummary(
      summaryResult.status === 'fulfilled' ? summaryResult.value : null,
    );
    setConsensus(
      consensusResult.status === 'fulfilled' ? consensusResult.value : null,
    );
    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, [projectId]);

  return (
    <ReviewManagerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Project Workspace</div>
          <h1>{project?.name ?? '项目工作台'}</h1>
          <p>从这里进入评审前组织工作或评审后合议处理。</p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50"
          href="/review-manager/projects"
        >
          返回负责项目
        </Link>
      </div>

      <ErrorAlert message={error} />
      {loading ? (
        <LoadingState text="正在加载项目工作台..." />
      ) : (
        <div className="grid gap-5">
          <ProjectOverviewSummary
            assignedExpertCount={assignedExpertCount}
            consensus={consensus}
            lookupMaps={lookupMaps}
            project={project}
            reviewSummary={reviewSummary}
          />
          <div className="grid gap-5 lg:grid-cols-3">
            <WorkspaceEntry
              description="维护评审时间、地点、会议链接，查看项目材料，并执行专家追加、替换和移除。"
              href={`/review-manager/projects/${projectId}/review-organization`}
              label="进入评审组织"
              title="评审组织"
            />
            <WorkspaceEntry
              description="查看专家评分、退回评分、查看汇总，生成合议草稿并确认最终结论。"
              href={`/review-manager/projects/${projectId}/consensus`}
              label="进入合议处理"
              title="合议处理"
            />
            <WorkspaceEntry
              description="查看项目申诉列表、申诉详情和附件，并处理待处理申诉。"
              href={`/review-manager/projects/${projectId}/appeals`}
              label="进入申诉处理"
              title="申诉处理"
            />
          </div>
        </div>
      )}
    </ReviewManagerShell>
  );
}

function ProjectOverviewSummary({
  assignedExpertCount,
  consensus,
  lookupMaps,
  project,
  reviewSummary,
}: {
  assignedExpertCount: number | null;
  consensus: ConsensusReviewResponse | null;
  lookupMaps: ReviewManagerLookupMaps;
  project: ReviewManagerProjectListItem | null;
  reviewSummary: ReviewSummaryResponse | null;
}) {
  if (!project) {
    return (
      <section className="panel">
        <div className="panel-body">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            项目摘要不可用或无权限。
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">项目摘要</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              当前页面只展示摘要和工作入口，不承载复杂业务表单。
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
            label="评审方案"
            value={formatLookupName(
              project.reviewSchemeId,
              lookupMaps.reviewSchemeNameById,
              '未知评审方案',
            )}
          />
          <InfoTile label="评审时间" value={formatDateTime(project.reviewTime)} />
          <InfoTile
            label="评审地点"
            value={displayValue(project.reviewLocation)}
          />
          <InfoTile
            label="专家数量"
            value={
              assignedExpertCount === null ? '-' : `${assignedExpertCount} 名`
            }
          />
          <InfoTile
            label="评分提交"
            value={
              reviewSummary
                ? `${reviewSummary.submittedExpertCount} / ${reviewSummary.assignedExpertCount}`
                : '-'
            }
          />
          <InfoTile
            label="合议状态"
            value={formatConsensusStatus(consensus)}
          />
          <InfoTile
            label="评分总分"
            value={String(
              getReviewSchemeTotalScore(project.reviewSchemeSnapshot) ?? '-',
            )}
          />
          <InfoTile label="最终等级" value={displayValue(project.finalLevel)} />
        </div>
      </div>
    </section>
  );
}

function WorkspaceEntry({
  description,
  href,
  label,
  title,
}: {
  description: string;
  href: string;
  label: string;
  title: string;
}) {
  return (
    <section className="panel">
      <div className="panel-body">
        <h2 className="m-0 text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
          {description}
        </p>
        <Link
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
          href={href}
        >
          {label}
        </Link>
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

function formatConsensusStatus(consensus: ConsensusReviewResponse | null): string {
  if (!consensus) {
    return '暂无合议记录';
  }

  if (consensus.status === 'confirmed') {
    return '已确认';
  }

  if (consensus.status === 'draft') {
    return '草稿';
  }

  return consensus.status;
}

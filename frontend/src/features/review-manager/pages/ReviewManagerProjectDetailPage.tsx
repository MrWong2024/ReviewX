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
  confirmProjectConsensus,
  generateProjectConsensusDraft,
  getProjectConsensus,
  getProjectExpertReview,
  getProjectReviewSummary,
  getReviewManagerProjectSummary,
  listProjectExpertReviews,
  loadReviewManagerReferenceData,
  returnProjectExpertReview,
} from '../api';
import { ConsensusReviewPanel } from '../components/ConsensusReviewPanel';
import { ReturnExpertReviewModal } from '../components/ReturnExpertReviewModal';
import { ReviewManagerExpertReviewDetailModal } from '../components/ReviewManagerExpertReviewDetailModal';
import { ReviewManagerExpertReviewsPanel } from '../components/ReviewManagerExpertReviewsPanel';
import { ReviewSummaryPanel } from '../components/ReviewSummaryPanel';
import type {
  ConfirmConsensusReviewPayload,
  ConsensusReviewResponse,
  ExpertReviewDetail,
  ExpertReviewListItem,
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
  formatScore,
  getReviewSchemeTotalScore,
  isConfirmedConsensusError,
  isDraftAlreadyExistsError,
} from '../utils';

type ReviewManagerProjectDetailPageProps = {
  projectId: string;
};

export function ReviewManagerProjectDetailPage({
  projectId,
}: ReviewManagerProjectDetailPageProps) {
  const [confirmingConsensus, setConfirmingConsensus] = useState(false);
  const [consensus, setConsensus] = useState<ConsensusReviewResponse | null>(
    null,
  );
  const [consensusError, setConsensusError] = useState<string | null>(null);
  const [consensusLoading, setConsensusLoading] = useState(true);
  const [expertReviewDetail, setExpertReviewDetail] =
    useState<ExpertReviewDetail | null>(null);
  const [expertReviewDetailError, setExpertReviewDetailError] = useState<
    string | null
  >(null);
  const [expertReviewDetailLoading, setExpertReviewDetailLoading] =
    useState(false);
  const [expertReviewDetailOpen, setExpertReviewDetailOpen] = useState(false);
  const [expertReviews, setExpertReviews] = useState<ExpertReviewListItem[]>(
    [],
  );
  const [expertReviewsError, setExpertReviewsError] = useState<string | null>(
    null,
  );
  const [expertReviewsLoading, setExpertReviewsLoading] = useState(true);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [projectSummary, setProjectSummary] =
    useState<ReviewManagerProjectListItem | null>(null);
  const [projectSummaryError, setProjectSummaryError] = useState<string | null>(
    null,
  );
  const [projectSummaryLoading, setProjectSummaryLoading] = useState(true);
  const [referenceData, setReferenceData] =
    useState<ReviewManagerReferenceData | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(
    null,
  );
  const [returnError, setReturnError] = useState<string | null>(null);
  const [returnTarget, setReturnTarget] = useState<ExpertReviewListItem | null>(
    null,
  );
  const [returningReview, setReturningReview] = useState(false);
  const [reviewSummary, setReviewSummary] =
    useState<ReviewSummaryResponse | null>(null);
  const [reviewSummaryError, setReviewSummaryError] = useState<string | null>(
    null,
  );
  const [reviewSummaryLoading, setReviewSummaryLoading] = useState(true);
  const [selectedExpertReview, setSelectedExpertReview] =
    useState<ExpertReviewListItem | null>(null);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildReviewManagerLookupMaps(referenceData)
        : createEmptyReviewManagerLookupMaps(),
    [referenceData],
  );
  const reviewSchemeTotalScore =
    consensus?.reviewSchemeSnapshot.totalScore ??
    getReviewSchemeTotalScore(projectSummary?.reviewSchemeSnapshot) ??
    expertReviewDetail?.reviewSchemeSnapshot.totalScore ??
    null;

  async function loadProjectSummary() {
    setProjectSummaryLoading(true);
    setProjectSummaryError(null);

    try {
      const summary = await getReviewManagerProjectSummary(projectId);
      setProjectSummary(summary);
      setProjectSummaryError(
        summary ? null : '项目摘要不可用或无权限。',
      );
    } catch (error) {
      setProjectSummary(null);
      setProjectSummaryError(formatReviewManagerErrorMessage(error));
    } finally {
      setProjectSummaryLoading(false);
    }
  }

  async function loadExpertReviews() {
    setExpertReviewsLoading(true);
    setExpertReviewsError(null);

    try {
      setExpertReviews(await listProjectExpertReviews(projectId));
    } catch (error) {
      setExpertReviews([]);
      setExpertReviewsError(formatReviewManagerErrorMessage(error));
    } finally {
      setExpertReviewsLoading(false);
    }
  }

  async function loadReviewSummary() {
    setReviewSummaryLoading(true);
    setReviewSummaryError(null);

    try {
      setReviewSummary(await getProjectReviewSummary(projectId));
    } catch (error) {
      setReviewSummary(null);
      setReviewSummaryError(formatReviewManagerErrorMessage(error));
    } finally {
      setReviewSummaryLoading(false);
    }
  }

  async function loadConsensus() {
    setConsensusLoading(true);
    setConsensusError(null);

    try {
      setConsensus(await getProjectConsensus(projectId));
    } catch (error) {
      setConsensus(null);
      setConsensusError(formatReviewManagerErrorMessage(error));
    } finally {
      setConsensusLoading(false);
    }
  }

  async function loadReferenceData() {
    try {
      setReferenceData(await loadReviewManagerReferenceData());
      setReferenceDataError(null);
    } catch (error) {
      setReferenceData(null);
      setReferenceDataError(formatReviewManagerErrorMessage(error));
    }
  }

  async function loadExpertReviewDetail(item: ExpertReviewListItem) {
    setSelectedExpertReview(item);
    setExpertReviewDetailOpen(true);
    setExpertReviewDetailLoading(true);
    setExpertReviewDetailError(null);
    setExpertReviewDetail(null);

    try {
      setExpertReviewDetail(
        await getProjectExpertReview(projectId, item.expert.id),
      );
    } catch (error) {
      setExpertReviewDetailError(formatReviewManagerErrorMessage(error));
    } finally {
      setExpertReviewDetailLoading(false);
    }
  }

  async function reloadSelectedExpertReviewDetail() {
    if (!selectedExpertReview) {
      return;
    }

    try {
      setExpertReviewDetail(
        await getProjectExpertReview(projectId, selectedExpertReview.expert.id),
      );
      setExpertReviewDetailError(null);
    } catch (error) {
      setExpertReviewDetailError(formatReviewManagerErrorMessage(error));
    }
  }

  async function handleReturnReview(returnReason: string) {
    if (!returnTarget) {
      return;
    }

    setReturningReview(true);
    setReturnError(null);
    setNotice(null);

    try {
      await returnProjectExpertReview(
        projectId,
        returnTarget.expert.id,
        returnReason,
      );
      setNotice('专家评分已退回。');
      setReturnTarget(null);
      await Promise.all([
        loadExpertReviews(),
        loadReviewSummary(),
        loadConsensus(),
        selectedExpertReview?.expert.id === returnTarget.expert.id
          ? reloadSelectedExpertReviewDetail()
          : Promise.resolve(),
      ]);
    } catch (error) {
      setReturnError(formatReviewManagerErrorMessage(error));
    } finally {
      setReturningReview(false);
    }
  }

  async function handleGenerateDraft() {
    setGeneratingDraft(true);
    setConsensusError(null);
    setNotice(null);

    try {
      await generateProjectConsensusDraft(projectId);
      setNotice('合议草稿已生成。');
      await Promise.all([loadConsensus(), loadReviewSummary()]);
    } catch (error) {
      if (isDraftAlreadyExistsError(error)) {
        const confirmed = window.confirm(
          '当前项目已存在合议草稿，确认覆盖并重新生成吗？',
        );

        if (confirmed) {
          try {
            await generateProjectConsensusDraft(projectId, { force: true });
            setNotice('合议草稿已覆盖生成。');
            await Promise.all([loadConsensus(), loadReviewSummary()]);
          } catch (forceError) {
            setConsensusError(formatReviewManagerErrorMessage(forceError));
          }
        }
      } else if (isConfirmedConsensusError(error)) {
        setConsensusError(
          '已确认的合议不能覆盖草稿。可在确认表单中重新确认最终结论。',
        );
      } else {
        setConsensusError(formatReviewManagerErrorMessage(error));
      }
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function handleConfirmConsensus(
    payload: ConfirmConsensusReviewPayload,
  ) {
    setConfirmingConsensus(true);
    setConsensusError(null);
    setNotice(null);

    try {
      await confirmProjectConsensus(projectId, payload);
      setNotice('最终合议已确认。');
      await Promise.all([loadConsensus(), loadProjectSummary()]);
    } catch (error) {
      setConsensusError(formatReviewManagerErrorMessage(error));
    } finally {
      setConfirmingConsensus(false);
    }
  }

  useEffect(() => {
    void Promise.all([
      loadProjectSummary(),
      loadExpertReviews(),
      loadReviewSummary(),
      loadConsensus(),
      loadReferenceData(),
    ]);
  }, [projectId]);

  return (
    <ReviewManagerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Consensus Workspace</div>
          <h1>{projectSummary?.name ?? '项目合议详情'}</h1>
          <p>查看专家评分、评分汇总和合议记录，并确认最终合议结论。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {reviewSummary ? (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
              已提交 {reviewSummary.submittedExpertCount} /{' '}
              {reviewSummary.assignedExpertCount}
            </span>
          ) : null}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/review-manager/projects/${projectId}`}
          >
            返回项目总览
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/review-manager/projects/${projectId}/review-organization`}
          >
            进入评审组织
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href={`/review-manager/projects/${projectId}/appeals`}
          >
            查看申诉
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href="/review-manager/projects"
          >
            返回项目列表
          </Link>
        </div>
      </div>

      {referenceDataError ? (
        <ErrorAlert
          message={`基础数据加载失败，部分名称将使用短 ID 兜底：${referenceDataError}`}
        />
      ) : null}
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-5">
        <ProjectSummaryCard
          error={projectSummaryError}
          loading={projectSummaryLoading}
          lookupMaps={lookupMaps}
          project={projectSummary}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <ReviewManagerExpertReviewsPanel
            error={expertReviewsError}
            items={expertReviews}
            loading={expertReviewsLoading}
            lookupMaps={lookupMaps}
            onReturnReview={(item) => {
              setReturnError(null);
              setReturnTarget(item);
            }}
            onSelectReview={(item) => void loadExpertReviewDetail(item)}
            selectedExpertUserId={selectedExpertReview?.expert.id}
          />
          <ReviewSummaryPanel
            error={reviewSummaryError}
            loading={reviewSummaryLoading}
            summary={reviewSummary}
          />
        </div>

        <ConsensusReviewPanel
          confirming={confirmingConsensus}
          consensus={consensus}
          error={consensusError}
          generating={generatingDraft}
          loading={consensusLoading}
          lookupMaps={lookupMaps}
          onConfirm={handleConfirmConsensus}
          onGenerateDraft={handleGenerateDraft}
          referenceData={referenceData}
          reviewSchemeTotalScore={reviewSchemeTotalScore}
        />
      </div>

      <ReviewManagerExpertReviewDetailModal
        detail={expertReviewDetail}
        error={expertReviewDetailError}
        expertReview={selectedExpertReview}
        loading={expertReviewDetailLoading}
        lookupMaps={lookupMaps}
        onClose={() => setExpertReviewDetailOpen(false)}
        open={expertReviewDetailOpen}
      />
      <ReturnExpertReviewModal
        error={returnError}
        expertReview={returnTarget}
        onClose={() => setReturnTarget(null)}
        onSubmit={handleReturnReview}
        open={Boolean(returnTarget)}
        submitting={returningReview}
      />
    </ReviewManagerShell>
  );
}

function ProjectSummaryCard({
  error,
  loading,
  lookupMaps,
  project,
}: {
  error?: string | null;
  loading: boolean;
  lookupMaps: ReviewManagerLookupMaps;
  project: ReviewManagerProjectListItem | null;
}) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              项目摘要
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              当前无项目详情接口，摘要通过负责项目列表大页查询后前端匹配。
            </p>
          </div>
          {project ? <Badge tone="primary">{project.projectNo}</Badge> : null}
        </div>
        {loading ? (
          <LoadingState text="正在加载项目摘要..." />
        ) : project ? (
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
              label="评分方案总分"
              value={formatScore(
                getReviewSchemeTotalScore(project.reviewSchemeSnapshot),
                '暂无',
              )}
            />
            <InfoTile label="最终等级" value={displayValue(project.finalLevel)} />
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

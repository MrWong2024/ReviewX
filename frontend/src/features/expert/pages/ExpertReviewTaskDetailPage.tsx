'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ExpertShell } from '@/src/components/layout/ExpertShell';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import {
  deleteExpertReviewDraft,
  getExpertReviewTask,
  listExpertProjectMaterials,
  loadExpertReferenceData,
  saveExpertReviewDraft,
  submitExpertReview,
} from '../api';
import { ExpertMaterialsPanel } from '../components/ExpertMaterialsPanel';
import { ExpertProjectInfoPanel } from '../components/ExpertProjectInfoPanel';
import { ExpertReviewForm } from '../components/ExpertReviewForm';
import { ExpertTaskStatusBadge } from '../components/ExpertTaskStatusBadge';
import type {
  ExpertMaterial,
  ExpertReferenceData,
  ExpertReviewTaskDetail,
  SaveExpertReviewInput,
} from '../types';
import {
  buildExpertLookupMaps,
  createEmptyExpertLookupMaps,
  formatExpertErrorMessage,
  formatScore,
  isBeforeReviewTime,
  REVIEW_NOT_STARTED_HINT,
} from '../utils';

type ExpertReviewTaskDetailPageProps = {
  projectId: string;
};

type ExpertReviewTaskDetailError = {
  hint?: string;
  message: string;
  title: string;
};

const PROJECT_REVIEW_SCHEME_MISSING = 'PROJECT_REVIEW_SCHEME_MISSING';
const REVIEW_SCHEME_MISSING_MESSAGE =
  '项目尚未分配评审方案，暂不能评分。';
const REVIEW_SCHEME_MISSING_HINT =
  '请等待评审负责人或管理员完成评审方案配置。';

export function ExpertReviewTaskDetailPage({
  projectId,
}: ExpertReviewTaskDetailPageProps) {
  const [detail, setDetail] = useState<ExpertReviewTaskDetail | null>(null);
  const [error, setError] = useState<ExpertReviewTaskDetailError | null>(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<ExpertMaterial[]>([]);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [referenceData, setReferenceData] =
    useState<ExpertReferenceData | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(
    null,
  );
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildExpertLookupMaps(referenceData)
        : createEmptyExpertLookupMaps(),
    [referenceData],
  );
  const disableSubmitReason =
    detail && isBeforeReviewTime(detail.project.reviewTime)
      ? REVIEW_NOT_STARTED_HINT
      : null;

  async function loadInitialData() {
    setLoading(true);
    setMaterialsLoading(true);
    setError(null);
    setMaterialsError(null);
    setReferenceDataError(null);

    const [detailResult, materialsResult, referenceResult] =
      await Promise.allSettled([
        getExpertReviewTask(projectId),
        listExpertProjectMaterials(projectId),
        loadExpertReferenceData(),
      ]);

    if (detailResult.status === 'fulfilled') {
      setDetail(detailResult.value);
    } else {
      setDetail(null);
      setError(
        createExpertReviewTaskDetailError(
          '任务详情加载失败',
          detailResult.reason,
        ),
      );
    }

    if (materialsResult.status === 'fulfilled') {
      setMaterials(materialsResult.value);
    } else {
      setMaterials([]);
      setMaterialsError(
        `项目材料加载失败。${formatExpertReviewTaskError(
          materialsResult.reason,
        )}`,
      );
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceDataError(formatExpertReviewTaskError(referenceResult.reason));
    }

    setLoading(false);
    setMaterialsLoading(false);
  }

  async function refreshDetailAndMaterials() {
    const [detailResult, materialsResult] = await Promise.allSettled([
      getExpertReviewTask(projectId),
      listExpertProjectMaterials(projectId),
    ]);

    if (detailResult.status === 'fulfilled') {
      setDetail(detailResult.value);
      setError(null);
    } else {
      setError(
        createExpertReviewTaskDetailError(
          '任务详情刷新失败',
          detailResult.reason,
        ),
      );
    }

    if (materialsResult.status === 'fulfilled') {
      setMaterials(materialsResult.value);
      setMaterialsError(null);
    } else {
      setMaterialsError(
        `项目材料刷新失败。${formatExpertReviewTaskError(
          materialsResult.reason,
        )}`,
      );
    }
  }

  async function handleSaveDraft(input: SaveExpertReviewInput) {
    setSaving(true);
    setNotice(null);
    setOperationError(null);

    try {
      await saveExpertReviewDraft(projectId, input);
      setNotice('评分草稿已保存');
      await refreshDetailAndMaterials();
    } catch (error) {
      setOperationError(formatExpertReviewTaskError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitReview(input: SaveExpertReviewInput) {
    setSubmitting(true);
    setNotice(null);
    setOperationError(null);

    try {
      await submitExpertReview(projectId, input);
      setNotice('评分已提交');
      await refreshDetailAndMaterials();
    } catch (error) {
      setOperationError(formatExpertReviewTaskError(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDraft() {
    setDeletingDraft(true);
    setNotice(null);
    setOperationError(null);

    try {
      await deleteExpertReviewDraft(projectId);
      setNotice('评分草稿已删除。');
      await refreshDetailAndMaterials();
    } catch (error) {
      setOperationError(formatExpertReviewTaskError(error));
      throw error;
    } finally {
      setDeletingDraft(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, [projectId]);

  return (
    <ExpertShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Review Task Detail</div>
          <h1>{detail?.project.name ?? '评审任务详情'}</h1>
          <p>查看项目详情、评审安排、已提交材料，并完成专家评分。</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {detail ? <ExpertTaskStatusBadge status={detail.review.status} /> : null}
          {detail ? (
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
              {formatScore(detail.review.totalScore)} /{' '}
              {formatScore(detail.reviewSchemeSnapshot.totalScore)}
            </span>
          ) : null}
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href="/expert/review-tasks"
          >
            返回任务列表
          </Link>
        </div>
      </div>

      <ExpertReviewTaskDetailErrorAlert error={error} />

      {loading ? (
        <section className="panel">
          <LoadingState text="正在加载评审任务详情..." />
        </section>
      ) : detail ? (
        <div className="grid gap-5">
          {referenceDataError ? (
            <ErrorAlert
              message={`基础数据加载失败，部分名称将使用短 ID 兜底：${referenceDataError}`}
            />
          ) : null}
          {notice ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
              {notice}
            </div>
          ) : null}

          <ExpertProjectInfoPanel
            lookupMaps={lookupMaps}
            materialCount={materials.length}
            project={detail.project}
          />

          <ExpertMaterialsPanel
            loading={materialsLoading}
            materialTypeNameById={lookupMaps.materialTypeNameById}
            materials={materials}
            materialsError={materialsError}
            projectId={detail.project.id}
          />

          <ExpertReviewForm
            deletingDraft={deletingDraft}
            disableSubmitReason={disableSubmitReason}
            error={operationError}
            onDeleteDraft={handleDeleteDraft}
            onSaveDraft={handleSaveDraft}
            onSubmitReview={handleSubmitReview}
            review={detail.review}
            reviewSchemeSnapshot={detail.reviewSchemeSnapshot}
            saving={saving}
            submitting={submitting}
          />
        </div>
      ) : null}
    </ExpertShell>
  );
}

function ExpertReviewTaskDetailErrorAlert({
  error,
}: {
  error?: ExpertReviewTaskDetailError | null;
}) {
  if (!error) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
      <div className="font-bold">{error.title}</div>
      <div className="mt-1">{error.message}</div>
      {error.hint ? (
        <div className="mt-1 text-red-600">{error.hint}</div>
      ) : null}
    </div>
  );
}

function createExpertReviewTaskDetailError(
  title: string,
  error: unknown,
): ExpertReviewTaskDetailError {
  return {
    title,
    message: formatExpertReviewTaskError(error),
    hint: isProjectReviewSchemeMissingError(error)
      ? REVIEW_SCHEME_MISSING_HINT
      : undefined,
  };
}

function formatExpertReviewTaskError(error: unknown): string {
  if (isApiError(error)) {
    if (isProjectReviewSchemeMissingError(error)) {
      return REVIEW_SCHEME_MISSING_MESSAGE;
    }

    if (error.status === 409) {
      if (
        error.code === 'REVIEW_NOT_STARTED' ||
        error.message.includes('评审尚未开始')
      ) {
        return '评审尚未开始，暂不能提交评分。';
      }

      if (
        error.code === 'EXPERT_REVIEW_DRAFT_NOT_DELETABLE' ||
        error.message.includes('只有未提交的评分草稿可以删除')
      ) {
        return '只有未提交的评分草稿可以删除。';
      }

      if (
        error.message.includes('Submitted expert review cannot be modified') ||
        error.message.includes('Expert review has already been submitted')
      ) {
        return '评分已提交，不能修改。';
      }

      return getErrorMessage(error);
    }
  }

  return formatExpertErrorMessage(error);
}

function isProjectReviewSchemeMissingError(error: unknown): boolean {
  return (
    isApiError(error) &&
    (error.code === PROJECT_REVIEW_SCHEME_MISSING ||
      error.message.includes(REVIEW_SCHEME_MISSING_MESSAGE))
  );
}

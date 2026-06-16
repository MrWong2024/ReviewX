'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ExpertShell } from '@/src/components/layout/ExpertShell';
import {
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

export function ExpertReviewTaskDetailPage({
  projectId,
}: ExpertReviewTaskDetailPageProps) {
  const [detail, setDetail] = useState<ExpertReviewTaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setError(`任务详情加载失败。${formatExpertErrorMessage(detailResult.reason)}`);
    }

    if (materialsResult.status === 'fulfilled') {
      setMaterials(materialsResult.value);
    } else {
      setMaterials([]);
      setMaterialsError(
        `项目材料加载失败。${formatExpertErrorMessage(materialsResult.reason)}`,
      );
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceDataError(formatExpertErrorMessage(referenceResult.reason));
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
      setError(`任务详情刷新失败。${formatExpertErrorMessage(detailResult.reason)}`);
    }

    if (materialsResult.status === 'fulfilled') {
      setMaterials(materialsResult.value);
      setMaterialsError(null);
    } else {
      setMaterialsError(
        `项目材料刷新失败。${formatExpertErrorMessage(materialsResult.reason)}`,
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
      setOperationError(formatExpertErrorMessage(error));
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
      setOperationError(formatExpertErrorMessage(error));
    } finally {
      setSubmitting(false);
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

      <ErrorAlert message={error} />

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
            disableSubmitReason={disableSubmitReason}
            error={operationError}
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

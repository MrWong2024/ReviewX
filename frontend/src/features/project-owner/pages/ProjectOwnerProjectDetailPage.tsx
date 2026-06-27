'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ProjectOwnerShell } from '@/src/components/layout/ProjectOwnerShell';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import {
  getProjectOwnerConsensus,
  getProjectOwnerProject,
  listProjectOwnerMaterials,
  loadProjectOwnerReferenceData,
  submitProjectOwnerMaterials,
} from '../api';
import { FollowUpNeedsPanel } from '../components/FollowUpNeedsPanel';
import { MaterialListPanel } from '../components/MaterialListPanel';
import { MaterialUploadPanel } from '../components/MaterialUploadPanel';
import { ProjectOwnerProjectInfoPanel } from '../components/ProjectOwnerProjectInfoPanel';
import type {
  ProjectMaterial,
  ProjectOwnerConsensus,
  ProjectOwnerReferenceData,
  ProjectOwnerProject,
  SubmitProjectMaterialsResult,
} from '../types';
import {
  buildProjectOwnerLookupMaps,
  canSubmitMaterial,
  createEmptyProjectOwnerLookupMaps,
  formatSubmitSkippedReason,
  getProjectOwnerContentLockedErrorMessage,
  isProjectOwnerContentLocked,
  isProjectOwnerContentLockedError,
  PROJECT_OWNER_CONTENT_LOCKED_MESSAGE,
  shortId,
} from '../utils';

type ProjectOwnerProjectDetailPageProps = {
  projectId: string;
};

export function ProjectOwnerProjectDetailPage({
  projectId,
}: ProjectOwnerProjectDetailPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [materialFilter, setMaterialFilter] = useState('');
  const [materials, setMaterials] = useState<ProjectMaterial[]>([]);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [project, setProject] = useState<ProjectOwnerProject | null>(null);
  const [confirmedConsensus, setConfirmedConsensus] =
    useState<ProjectOwnerConsensus | null>(null);
  const [consensusStatusError, setConsensusStatusError] = useState<
    string | null
  >(null);
  const [referenceData, setReferenceData] =
    useState<ProjectOwnerReferenceData | null>(null);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(
    null,
  );
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingMaterials, setSubmittingMaterials] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [submitSkipped, setSubmitSkipped] = useState<
    SubmitProjectMaterialsResult['skipped']
  >([]);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildProjectOwnerLookupMaps(referenceData)
        : createEmptyProjectOwnerLookupMaps(),
    [referenceData],
  );
  const materialTypes = referenceData?.materialTypes ?? [];
  const ownerContentLocked = isProjectOwnerContentLocked(
    project,
    confirmedConsensus,
  );
  const ownerContentLockedMessage = PROJECT_OWNER_CONTENT_LOCKED_MESSAGE;
  const materialTypesError = referenceDataError
    ? `基础数据加载失败：${referenceDataError}`
    : null;
  const materialStatusStats = useMemo(() => {
    const draftCount = materials.filter(
      (material) => material.status === 'draft',
    ).length;
    const legacyActiveCount = materials.filter(
      (material) => material.status === 'active',
    ).length;
    const submittedCount = materials.filter(
      (material) => material.status === 'submitted',
    ).length;
    const submittableCount = materials.filter(canSubmitMaterial).length;

    return {
      draftCount,
      legacyActiveCount,
      submittedCount,
      submittableCount,
      totalCount: materials.length,
    };
  }, [materials]);

  async function loadProject() {
    setLoading(true);
    setError(null);

    try {
      setProject(await getProjectOwnerProject(projectId));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function loadMaterials() {
    setMaterialsLoading(true);
    setMaterialsError(null);

    try {
      setMaterials(await listProjectOwnerMaterials(projectId));
    } catch (loadError) {
      setMaterialsError(getErrorMessage(loadError));
    } finally {
      setMaterialsLoading(false);
    }
  }

  async function loadConfirmedConsensus() {
    setConsensusStatusError(null);

    try {
      setConfirmedConsensus(await getProjectOwnerConsensus(projectId));
    } catch (loadError) {
      setConfirmedConsensus(null);

      if (isApiError(loadError) && loadError.status === 404) {
        return;
      }

      setConsensusStatusError(getErrorMessage(loadError));
    }
  }

  async function loadInitialData() {
    setLoading(true);
    setMaterialsLoading(true);
    setError(null);
    setMaterialsError(null);
    setConfirmedConsensus(null);
    setConsensusStatusError(null);
    setReferenceData(null);
    setReferenceDataError(null);

    const [projectResult, materialsResult, consensusResult, referenceResult] =
      await Promise.allSettled([
        getProjectOwnerProject(projectId),
        listProjectOwnerMaterials(projectId),
        getProjectOwnerConsensus(projectId),
        loadProjectOwnerReferenceData(),
      ]);

    if (projectResult.status === 'fulfilled') {
      setProject(projectResult.value);
    } else {
      setProject(null);
      setError(getErrorMessage(projectResult.reason));
    }

    if (materialsResult.status === 'fulfilled') {
      setMaterials(materialsResult.value);
    } else {
      setMaterials([]);
      setMaterialsError(getErrorMessage(materialsResult.reason));
    }

    if (consensusResult.status === 'fulfilled') {
      setConfirmedConsensus(consensusResult.value);
    } else if (
      isApiError(consensusResult.reason) &&
      consensusResult.reason.status === 404
    ) {
      setConfirmedConsensus(null);
      setConsensusStatusError(null);
    } else {
      setConfirmedConsensus(null);
      setConsensusStatusError(getErrorMessage(consensusResult.reason));
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceDataError(getErrorMessage(referenceResult.reason));
    }

    setLoading(false);
    setMaterialsLoading(false);
  }

  async function refreshAfterMaterialChange() {
    await Promise.all([loadProject(), loadMaterials(), loadConfirmedConsensus()]);
  }

  function handleSubmitAllDraftMaterials() {
    setSubmitError(null);

    if (ownerContentLocked) {
      setSubmitError(ownerContentLockedMessage);
      return;
    }

    if (materialStatusStats.submittableCount === 0) {
      setSubmitError('当前没有可提交的草稿材料。');
      return;
    }

    setSubmitConfirmOpen(true);
  }

  async function handleConfirmSubmitMaterials() {
    setSubmittingMaterials(true);
    setSubmitError(null);
    setSubmitNotice(null);
    setSubmitSkipped([]);

    if (ownerContentLocked) {
      setSubmitConfirmOpen(false);
      setSubmitError(ownerContentLockedMessage);
      setSubmittingMaterials(false);
      return;
    }

    try {
      const result = await submitProjectOwnerMaterials(projectId, {});
      setSubmitNotice(formatSubmitResultNotice(result));
      setSubmitSkipped(result.skipped);
      setSubmitConfirmOpen(false);
      await refreshAfterMaterialChange();
    } catch (error) {
      setSubmitConfirmOpen(false);
      setSubmitError(
        isProjectOwnerContentLockedError(error)
          ? getProjectOwnerContentLockedErrorMessage(error)
          : `提交评审材料失败，请稍后重试。${getErrorMessage(error)}`,
      );

      if (isProjectOwnerContentLockedError(error)) {
        await refreshAfterMaterialChange();
      }
    } finally {
      setSubmittingMaterials(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, [projectId]);

  return (
    <ProjectOwnerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Project Detail</div>
          <h1>{project?.name ?? '项目详情'}</h1>
          <p>
            查看项目基础信息、评审安排、后续推进需求，并管理本项目材料。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
            href={`/project-owner/projects/${projectId}/review-result`}
          >
            查看评审结果与申诉
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
            href="/project-owner/projects"
          >
            返回我的项目
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} />

      {loading ? (
        <section className="panel">
          <LoadingState text="正在加载项目详情..." />
        </section>
      ) : project ? (
        <div className="grid gap-5">
          {referenceDataError ? (
            <ErrorAlert
              message={`基础数据加载失败，部分名称将使用短 ID 兜底：${referenceDataError}`}
            />
          ) : null}
          {consensusStatusError ? (
            <ErrorAlert
              message={`评审结果确认状态加载失败，写操作仍以后端校验为准：${consensusStatusError}`}
            />
          ) : null}
          {ownerContentLocked ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800 shadow-sm">
              {ownerContentLockedMessage}
            </div>
          ) : null}

          <ProjectOwnerProjectInfoPanel
            lookupMaps={lookupMaps}
            project={project}
          />

          <FollowUpNeedsPanel
            locked={ownerContentLocked}
            lockedMessage={ownerContentLockedMessage}
            onSaved={setProject}
            project={project}
          />

          <section className="panel" id="materials">
            <div className="panel-body">
              <div className="mb-4">
                <h2 className="m-0 text-lg font-black text-slate-950">
                  材料管理
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  上传材料默认为草稿，提交评审后评审负责人和专家可见，项目负责人不能再删除。
                </p>
              </div>
              <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="m-0 text-base font-black text-slate-950">
                      提交评审材料
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                      提交后，评审负责人和专家将可以查看这些材料；已提交材料项目负责人不能再删除。
                    </p>
                  </div>
                  <Button
                    disabled={
                      submittingMaterials ||
                      materialsLoading ||
                      ownerContentLocked ||
                      materialStatusStats.submittableCount === 0
                    }
                    onClick={handleSubmitAllDraftMaterials}
                    title={
                      ownerContentLocked
                        ? '评审结果已确认'
                        : materialStatusStats.submittableCount === 0
                        ? '当前没有可提交的草稿材料。'
                        : undefined
                    }
                    variant="primary"
                  >
                    {submittingMaterials
                      ? '提交中...'
                      : '提交全部草稿材料'}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="muted">
                    总材料 {materialStatusStats.totalCount}
                  </Badge>
                  <Badge tone="warning">
                    草稿 {materialStatusStats.draftCount}
                  </Badge>
                  <Badge tone="success">
                    已提交 {materialStatusStats.submittedCount}
                  </Badge>
                  {materialStatusStats.legacyActiveCount > 0 ? (
                    <Badge tone="primary">
                      历史草稿 {materialStatusStats.legacyActiveCount}
                    </Badge>
                  ) : null}
                </div>

                <ErrorAlert message={submitError} />
                {submitNotice ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700 shadow-sm">
                    {submitNotice}
                  </div>
                ) : null}
                {submitSkipped.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 shadow-sm">
                    <div className="font-bold">部分材料未提交</div>
                    <ul className="mt-2 grid gap-1">
                      {submitSkipped.map((item) => (
                        <li key={`${item.materialId}-${item.reason}`}>
                          <span className="font-semibold">
                            {formatSkippedMaterialName(
                              item.materialId,
                              materials,
                            )}
                          </span>
                          ：{formatSubmitSkippedReason(item.reason)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <MaterialUploadPanel
                locked={ownerContentLocked}
                lockedMessage={ownerContentLockedMessage}
                materialTypes={materialTypes}
                materialTypesError={materialTypesError}
                onUploaded={() => {
                  void refreshAfterMaterialChange();
                }}
                projectId={project.id}
              />

              <div className="mt-5">
                <ErrorAlert message={materialsError} />
                <MaterialListPanel
                  locked={ownerContentLocked}
                  lockedMessage={ownerContentLockedMessage}
                  loading={materialsLoading}
                  materialTypeNameById={lookupMaps.materialTypeNameById}
                  materialTypes={materialTypes}
                  materials={materials}
                  onChanged={refreshAfterMaterialChange}
                  onFilterChange={setMaterialFilter}
                  projectId={project.id}
                  selectedMaterialTypeId={materialFilter}
                />
              </div>

              <ConfirmDialog
                confirmLabel="提交评审材料"
                description="提交后，评审负责人和专家将可以查看所选材料；已提交材料项目负责人不能再删除。如需删除已提交材料，请联系管理员处理。"
                loading={submittingMaterials}
                onCancel={() => setSubmitConfirmOpen(false)}
                onConfirm={handleConfirmSubmitMaterials}
                open={submitConfirmOpen && !ownerContentLocked}
                title="确认提交评审材料？"
              />
            </div>
          </section>
        </div>
      ) : null}
    </ProjectOwnerShell>
  );
}

function formatSubmitResultNotice(
  result: SubmitProjectMaterialsResult,
): string {
  const visibilityNotice =
    result.submittedCount > 0 ? '评审组现在可以查看已提交材料。' : '';

  return `提交完成：新提交 ${result.submittedCount} 个，已提交 ${result.alreadySubmittedCount} 个，跳过 ${result.skippedCount} 个。${visibilityNotice}`;
}

function formatSkippedMaterialName(
  materialId: string,
  materials: ProjectMaterial[],
): string {
  const material = materials.find((item) => item.id === materialId);

  if (material) {
    return material.originalFilename;
  }

  return `材料 ${shortId(materialId)}`;
}

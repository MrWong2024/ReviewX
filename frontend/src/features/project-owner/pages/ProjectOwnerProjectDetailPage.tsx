'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ProjectOwnerShell } from '@/src/components/layout/ProjectOwnerShell';
import { getErrorMessage } from '@/src/lib/api/errors';
import {
  getProjectOwnerProject,
  listProjectOwnerMaterials,
  loadProjectOwnerReferenceData,
} from '../api';
import { FollowUpNeedsPanel } from '../components/FollowUpNeedsPanel';
import { MaterialListPanel } from '../components/MaterialListPanel';
import { MaterialUploadPanel } from '../components/MaterialUploadPanel';
import { ProjectOwnerProjectInfoPanel } from '../components/ProjectOwnerProjectInfoPanel';
import type {
  ProjectMaterial,
  ProjectOwnerReferenceData,
  ProjectOwnerProject,
} from '../types';
import {
  buildProjectOwnerLookupMaps,
  createEmptyProjectOwnerLookupMaps,
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
  const materialTypes = referenceData?.materialTypes ?? [];
  const materialTypesError = referenceDataError
    ? `基础数据加载失败：${referenceDataError}`
    : null;

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

  async function loadInitialData() {
    setLoading(true);
    setMaterialsLoading(true);
    setError(null);
    setMaterialsError(null);
    setReferenceData(null);
    setReferenceDataError(null);

    const [projectResult, materialsResult, referenceResult] =
      await Promise.allSettled([
        getProjectOwnerProject(projectId),
        listProjectOwnerMaterials(projectId),
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

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
    } else {
      setReferenceDataError(getErrorMessage(referenceResult.reason));
    }

    setLoading(false);
    setMaterialsLoading(false);
  }

  async function refreshAfterMaterialChange() {
    await Promise.all([loadProject(), loadMaterials()]);
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
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white/[0.85] px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
          href="/project-owner/projects"
        >
          返回我的项目
        </Link>
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

          <ProjectOwnerProjectInfoPanel
            lookupMaps={lookupMaps}
            project={project}
          />

          <FollowUpNeedsPanel onSaved={setProject} project={project} />

          <section className="panel" id="materials">
            <div className="panel-body">
              <div className="mb-4">
                <h2 className="m-0 text-lg font-black text-slate-950">
                  材料管理
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  按材料类型查看、下载和删除已上传材料。
                </p>
              </div>

              <MaterialUploadPanel
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
            </div>
          </section>
        </div>
      ) : null}
    </ProjectOwnerShell>
  );
}

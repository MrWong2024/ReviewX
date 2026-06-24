'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { getErrorMessage } from '@/src/lib/api/errors';
import { getProjectOrganizationStatus } from '@/src/lib/labels/project-review-organization-labels';
import {
  getExpertAssignmentLockMessage,
  getExpertAssignmentLockReasons,
} from '@/src/lib/project-review/expert-assignment-lock';
import { AdminProjectMaterialsCard } from '../components/project-review-organization/AdminProjectMaterialsCard';
import { AssignedExpertsPanel } from '../components/project-review-organization/AssignedExpertsPanel';
import { ExpertCandidatesPanel } from '../components/project-review-organization/ExpertCandidatesPanel';
import { ProjectSchedulePanel } from '../components/project-review-organization/ProjectSchedulePanel';
import { ReviewAssignmentModal } from '../components/project-review-organization/ReviewAssignmentModal';
import {
  getProject,
  listAssignedProjectExperts,
  listBatches,
  listDictionaries,
  listOrganizations,
  listReviewSchemes,
  listTreeDictionaries,
  listUsers,
} from '../api';
import type {
  AdminUser,
  Batch,
  Dictionary,
  ExpertBasic,
  Organization,
  Project,
  ReviewScheme,
  TreeDictionary,
} from '../types';

type ProjectReviewOrganizationPageProps = {
  projectId: string;
};

export function ProjectReviewOrganizationPage({
  projectId,
}: ProjectReviewOrganizationPageProps) {
  const [assignedExperts, setAssignedExperts] = useState<ExpertBasic[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expertsError, setExpertsError] = useState<string | null>(null);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [reviewManagers, setReviewManagers] = useState<AdminUser[]>([]);
  const [reviewSchemes, setReviewSchemes] = useState<ReviewScheme[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [treeDictionaries, setTreeDictionaries] = useState<TreeDictionary[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const batchNameById = useMemo(
    () => new Map(batches.map((item) => [item.id, item.name])),
    [batches],
  );
  const dictionaryNameById = useMemo(
    () => new Map(dictionaries.map((item) => [item.id, item.name])),
    [dictionaries],
  );
  const organizationNameById = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations],
  );
  const schemeNameById = useMemo(
    () => new Map(reviewSchemes.map((item) => [item.id, item.name])),
    [reviewSchemes],
  );
  const treeNameById = useMemo(
    () =>
      new Map(
        treeDictionaries.map((item) => [
          item.id,
          item.fullName || item.name,
        ]),
      ),
    [treeDictionaries],
  );
  const userNameById = useMemo(
    () =>
      new Map(
        users.map((user) => [user.id, `${user.name}（${user.phone}）`]),
      ),
    [users],
  );
  const expertAssignmentLockReasons = useMemo(
    () =>
      project
        ? getExpertAssignmentLockReasons({
            finalLevel: project.finalLevel,
            hasExpertReviewRecord: assignedExperts.some(
              (expert) => expert.hasReviewRecord,
            ),
            originalLevel: project.originalLevel,
            reviewTime: project.reviewTime,
          })
        : [],
    [assignedExperts, project],
  );
  const expertAssignmentLocked = expertAssignmentLockReasons.length > 0;
  const expertAssignmentLockMessage = getExpertAssignmentLockMessage(
    expertAssignmentLockReasons,
  );

  useEffect(() => {
    loadPage();
  }, [projectId]);

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      const [
        projectResponse,
        batchResponse,
        statusResponse,
        organizationResponse,
        projectTypeResponse,
        disciplineResponse,
        departmentResponse,
        managerResponse,
        userResponse,
        schemeResponse,
      ] = await Promise.all([
        getProject(projectId),
        listBatches({ page: 1, pageSize: 1000 }),
        listDictionaries({ dictType: 'project_status' }),
        listOrganizations({ page: 1, pageSize: 1000 }),
        listTreeDictionaries({ treeType: 'project_type' }),
        listTreeDictionaries({ treeType: 'discipline' }),
        listTreeDictionaries({ treeType: 'department' }),
        listUsers({
          isActive: true,
          page: 1,
          pageSize: 1000,
          role: 'review_manager',
        }),
        listUsers({ page: 1, pageSize: 1000 }),
        listReviewSchemes(),
      ]);

      setProject(projectResponse);
      setBatches(batchResponse.items);
      setDictionaries(statusResponse);
      setOrganizations(organizationResponse.items);
      setTreeDictionaries([
        ...projectTypeResponse,
        ...disciplineResponse,
        ...departmentResponse,
      ]);
      setReviewManagers(managerResponse.items);
      setUsers(userResponse.items);
      setReviewSchemes(schemeResponse);
      await loadAssignedExperts();
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignedExperts() {
    setExpertsLoading(true);
    setExpertsError(null);

    try {
      const response = await listAssignedProjectExperts(projectId);
      setAssignedExperts(response);
    } catch (loadError) {
      setAssignedExperts([]);
      setExpertsError(getErrorMessage(loadError));
    } finally {
      setExpertsLoading(false);
    }
  }

  function handleAssignmentSaved(updated: Project) {
    setProject(updated);
    setShowAssignmentModal(false);
    setNotice('已保存分配。');
  }

  if (loading) {
    return <LoadingState text="正在加载项目评审组织信息..." />;
  }

  if (!project) {
    return (
      <>
        <div className="page-title">
          <div>
            <h1>项目评审组织</h1>
            <p>项目不存在或当前账号无法访问。</p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50"
            href="/admin/projects"
          >
            返回项目列表
          </Link>
        </div>
        <ErrorAlert message={error ?? '项目不存在。'} />
      </>
    );
  }

  const organizationStatus = getProjectOrganizationStatus(project);

  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">Review Organization</div>
          <h1>{project.projectNo}</h1>
          <p>{project.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={organizationStatus.tone}>
            {organizationStatus.label}
          </Badge>
          <Link
            className="inline-flex min-h-10 items-center rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow-md"
            href={`/admin/projects/${project.id}/appeals`}
          >
            查看申诉
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50"
            href="/admin/projects"
          >
            返回项目列表
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} />
      {notice ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-5">
        <section className="panel">
          <div className="panel-body">
            <h2 className="m-0 text-lg font-bold text-slate-950">基础信息</h2>
            <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
              <InfoItem
                label="批次"
                value={batchNameById.get(project.batchId) ?? project.batchId}
              />
              <InfoItem
                label="项目类型"
                value={formatOptionalName(project.projectTypeId, treeNameById)}
              />
              <InfoItem
                label="项目状态"
                value={formatOptionalName(project.statusId, dictionaryNameById)}
              />
              <InfoItem
                label="承担单位"
                value={formatOptionalName(
                  project.leadOrganizationId,
                  organizationNameById,
                )}
              />
              <InfoItem
                label="合作单位"
                value={formatNames(
                  project.cooperationOrganizationIds,
                  organizationNameById,
                )}
              />
              <InfoItem
                label="学科"
                value={formatNames(project.disciplineIds, treeNameById)}
              />
              <InfoItem
                label="项目负责人"
                value={formatOptionalName(project.ownerUserId, userNameById)}
              />
              <InfoItem
                label="受理处室"
                value={formatOptionalName(project.departmentId, treeNameById)}
              />
              <InfoItem
                label="总经费"
                value={formatFunding(project.totalFunding)}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-body">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-lg font-bold text-slate-950">评审分配</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  分配评审方案时，后端会生成评审方案快照，后续评分按快照执行。
                </p>
              </div>
              <Button
                onClick={() => {
                  setNotice(null);
                  setShowAssignmentModal(true);
                }}
                variant="secondary"
              >
                修改分配
              </Button>
            </div>
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              <InfoItem
                label="评审负责人"
                value={formatOptionalName(project.reviewManagerId, userNameById)}
              />
              <InfoItem
                label="评审方案"
                value={formatOptionalName(project.reviewSchemeId, schemeNameById)}
              />
            </div>
          </div>
        </section>

        <ProjectSchedulePanel onSaved={setProject} project={project} />

        <AdminProjectMaterialsCard
          projectId={project.id}
          userNameById={userNameById}
        />

        {expertsError ? <ErrorAlert message={expertsError} /> : null}
        <AssignedExpertsPanel
          disciplineNameById={treeNameById}
          experts={assignedExperts}
          locked={expertAssignmentLocked}
          lockMessage={expertAssignmentLockMessage}
          lockReasons={expertAssignmentLockReasons}
          loading={expertsLoading}
          onChanged={loadAssignedExperts}
          organizationNameById={organizationNameById}
          projectId={project.id}
        />
        <ExpertCandidatesPanel
          disciplineNameById={treeNameById}
          locked={expertAssignmentLocked}
          lockMessage={expertAssignmentLockMessage}
          lockReasons={expertAssignmentLockReasons}
          onChanged={loadAssignedExperts}
          organizationNameById={organizationNameById}
          projectId={project.id}
        />
      </div>

      <ReviewAssignmentModal
        onClose={() => setShowAssignmentModal(false)}
        onSaved={handleAssignmentSaved}
        open={showAssignmentModal}
        project={project}
        reviewManagers={reviewManagers}
        reviewSchemes={reviewSchemes}
      />
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold leading-6 text-slate-800">
        {value}
      </div>
    </div>
  );
}

function formatOptionalName(
  id: string | null | undefined,
  nameById: Map<string, string>,
): string {
  if (!id) {
    return '-';
  }

  return nameById.get(id) ?? id;
}

function formatNames(ids: string[], nameById: Map<string, string>): string {
  if (ids.length === 0) {
    return '-';
  }

  return ids.map((id) => nameById.get(id) ?? id).join('、');
}

function formatFunding(value?: number | null): string {
  if (value === undefined || value === null) {
    return '-';
  }

  return `${value.toLocaleString('zh-CN')} 万元`;
}

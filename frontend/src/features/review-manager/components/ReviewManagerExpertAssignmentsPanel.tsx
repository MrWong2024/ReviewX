'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Pagination } from '@/src/components/ui/Pagination';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import { formatExpertFailureReasons } from '@/src/lib/labels/project-review-organization-labels';
import {
  appendReviewManagerProjectExperts,
  listReviewManagerAssignedProjectExperts,
  listReviewManagerProjectExpertCandidates,
  removeReviewManagerProjectExpert,
  replaceReviewManagerProjectExperts,
} from '../api';
import type {
  AppendReviewManagerProjectExpertsResult,
  ReviewManagerAssignedExpert,
  ReviewManagerExpertCandidate,
  ReviewManagerExpertCandidatePage,
} from '../types';
import { formatNames } from '../utils';

type CandidateAction = 'append' | 'replace';

type ReviewManagerExpertAssignmentsPanelProps = {
  disciplineNameById: Map<string, string>;
  onChanged: () => Promise<void> | void;
  organizationNameById: Map<string, string>;
  projectId: string;
};

const PAGE_SIZE = 10;
const ASSIGNMENT_HAS_REVIEW_RECORD_CODE =
  'EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD';

export function ReviewManagerExpertAssignmentsPanel({
  disciplineNameById,
  onChanged,
  organizationNameById,
  projectId,
}: ReviewManagerExpertAssignmentsPanelProps) {
  const [assignedExperts, setAssignedExperts] = useState<
    ReviewManagerAssignedExpert[]
  >([]);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [candidates, setCandidates] = useState<ReviewManagerExpertCandidatePage>(
    {
      items: [],
      page: 1,
      pageSize: PAGE_SIZE,
      total: 0,
    },
  );
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<CandidateAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] =
    useState<ReviewManagerAssignedExpert | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const candidateNameById = useMemo(
    () =>
      new Map(
        candidates.items.map((candidate) => [
          candidate.id,
          `${candidate.name}（${candidate.phone}）`,
        ]),
      ),
    [candidates.items],
  );

  useEffect(() => {
    void Promise.all([loadAssignedExperts(), loadCandidates(1, '')]);
  }, [projectId]);

  async function loadAssignedExperts() {
    setAssignedLoading(true);
    setError(null);

    try {
      setAssignedExperts(await listReviewManagerAssignedProjectExperts(projectId));
    } catch (loadError) {
      setAssignedExperts([]);
      setError(getErrorMessage(loadError));
    } finally {
      setAssignedLoading(false);
    }
  }

  async function loadCandidates(
    nextPage = candidates.page,
    nextKeyword = keyword,
  ) {
    setCandidatesLoading(true);
    setError(null);

    try {
      const response = await listReviewManagerProjectExpertCandidates(
        projectId,
        {
          keyword: nextKeyword.trim(),
          page: nextPage,
          pageSize: PAGE_SIZE,
        },
      );
      setCandidates(response);
      setSelectedIds([]);
    } catch (loadError) {
      setCandidates({
        items: [],
        page: nextPage,
        pageSize: PAGE_SIZE,
        total: 0,
      });
      setError(getErrorMessage(loadError));
    } finally {
      setCandidatesLoading(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadCandidates(1, keyword);
  }

  function toggleCandidate(candidateId: string) {
    setSelectedIds((current) =>
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId],
    );
  }

  function openConfirm(action: CandidateAction) {
    if (selectedIds.length === 0) {
      setError('请先选择候选专家。');
      return;
    }

    setError(null);
    setConfirmAction(action);
  }

  async function reloadAuthoritativeData() {
    await Promise.all([
      loadAssignedExperts(),
      loadCandidates(candidates.page, keyword),
      Promise.resolve(onChanged()),
    ]);
  }

  async function handleConfirmCandidateAction() {
    if (!confirmAction) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (confirmAction === 'append') {
        const result = await appendReviewManagerProjectExperts(projectId, {
          expertUserIds: selectedIds,
        });
        setNotice(formatAppendNotice(result, candidateNameById));
      } else {
        const result = await replaceReviewManagerProjectExperts(projectId, {
          expertUserIds: selectedIds,
        });
        setNotice(
          `已替换专家名单，当前已分配 ${result.assignedExperts.length} 名专家；新增或恢复 ${result.addedOrRestoredCount} 名，移除 ${result.removedCount} 名。`,
        );
      }

      setConfirmAction(null);
      await reloadAuthoritativeData();
    } catch (submitError) {
      setError(formatAssignmentSubmitError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await removeReviewManagerProjectExpert(
        projectId,
        removeTarget.id,
      );
      setNotice(
        result.removed
          ? `已移除专家：${removeTarget.name}。`
          : result.alreadyRemoved
            ? `专家 ${removeTarget.name} 已处于移除状态。`
            : `专家 ${removeTarget.name} 当前不在专家名单中。`,
      );
      setRemoveTarget(null);
      await reloadAuthoritativeData();
    } catch (removeError) {
      setError(formatAssignmentSubmitError(removeError));
    } finally {
      setSubmitting(false);
    }
  }

  const assignedColumns: DataColumn<ReviewManagerAssignedExpert>[] = [
    { key: 'name', render: (item) => item.name, title: '姓名' },
    { key: 'phone', render: (item) => item.phone, title: '手机号' },
    {
      key: 'organizations',
      render: (item) =>
        formatNames(item.organizationIds, organizationNameById, '未知单位'),
      title: '单位',
    },
    {
      key: 'disciplines',
      render: (item) =>
        formatNames(item.disciplineIds, disciplineNameById, '未知学科'),
      title: '学科',
    },
    {
      key: 'reviewStatus',
      render: (item) => <ReviewStatusBadge expert={item} />,
      title: '评分记录',
    },
    {
      key: 'actions',
      render: (item) => (
        <Button
          disabled={submitting || Boolean(item.hasReviewRecord)}
          onClick={() => setRemoveTarget(item)}
          size="sm"
          title={
            item.hasReviewRecord ? '已产生评分记录，不能移除' : '移除专家'
          }
          variant="danger"
        >
          移除
        </Button>
      ),
      title: '操作',
    },
  ];

  const candidateColumns: DataColumn<ReviewManagerExpertCandidate>[] = [
    {
      key: 'select',
      render: (item) => (
        <input
          aria-label={`选择候选专家 ${item.name}`}
          checked={selected.has(item.id)}
          className="h-4 w-4 accent-cyan-700"
          onChange={() => toggleCandidate(item.id)}
          type="checkbox"
        />
      ),
      title: '选择',
    },
    { key: 'name', render: (item) => item.name, title: '姓名' },
    { key: 'phone', render: (item) => item.phone, title: '手机号' },
    {
      key: 'organizations',
      render: (item) =>
        formatNames(item.organizationIds, organizationNameById, '未知单位'),
      title: '单位',
    },
    {
      key: 'disciplines',
      render: (item) =>
        formatNames(item.disciplineIds, disciplineNameById, '未知学科'),
      title: '学科',
    },
    {
      key: 'assigned',
      render: (item) =>
        item.assigned ? (
          <Badge tone="success">已分配</Badge>
        ) : (
          <Badge tone="muted">未分配</Badge>
        ),
      title: '分配状态',
    },
  ];

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              评审组织 / 专家分配
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              候选专家由后端按项目学科匹配，并自动回避承担单位和合作单位。
            </p>
          </div>
          <div className="table-actions">
            <Button
              disabled={selectedIds.length === 0 || submitting}
              onClick={() => openConfirm('append')}
              variant="secondary"
            >
              追加到当前专家名单
            </Button>
            <Button
              disabled={selectedIds.length === 0 || submitting}
              onClick={() => openConfirm('replace')}
              variant="primary"
            >
              用选中专家替换当前名单
            </Button>
          </div>
        </div>

        <ErrorAlert message={error} />
        {notice ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold leading-6 text-emerald-700">
            {notice}
          </div>
        ) : null}

        <div className="grid gap-5">
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="m-0 text-base font-black text-slate-950">
                当前专家名单
              </h3>
              <Badge tone="primary">{assignedExperts.length} 名专家</Badge>
            </div>
            {assignedLoading ? (
              <LoadingState text="正在加载已分配专家..." />
            ) : assignedExperts.length === 0 ? (
              <EmptyState text="当前项目尚未分配专家。" />
            ) : (
              <DataTable
                columns={assignedColumns}
                getRowKey={(item) => item.id}
                items={assignedExperts}
              />
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="m-0 text-base font-black text-slate-950">
                候选专家
              </h3>
              <Badge tone="muted">已选 {selectedIds.length} 名</Badge>
            </div>
            <form className="toolbar" onSubmit={handleSearch}>
              <div className="toolbar-left">
                <Input
                  id="review-manager-expert-candidate-keyword"
                  label="候选专家关键词"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="姓名或手机号"
                  value={keyword}
                />
                <Button
                  disabled={candidatesLoading}
                  type="submit"
                  variant="secondary"
                >
                  搜索候选
                </Button>
              </div>
            </form>
            {candidatesLoading ? (
              <LoadingState text="正在加载候选专家..." />
            ) : candidates.items.length === 0 ? (
              <EmptyState text={getCandidateEmptyText(candidates.reason)} />
            ) : (
              <>
                <DataTable
                  columns={candidateColumns}
                  getRowKey={(item) => item.id}
                  items={candidates.items}
                />
                <Pagination
                  onPageChange={(nextPage) =>
                    void loadCandidates(nextPage, keyword)
                  }
                  page={candidates.page}
                  pageSize={candidates.pageSize}
                  total={candidates.total}
                />
              </>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        confirmLabel={confirmAction === 'replace' ? '确认替换' : '确认追加'}
        description={
          confirmAction === 'replace'
            ? `当前专家名单将被替换为本次选中的 ${selectedIds.length} 名专家；未被选中的原专家会被移除；已产生评分记录的专家不能被移除，后端会拒绝。后端会再次校验学科匹配和单位回避规则。`
            : `保留当前已分配专家，并新增本次选中的 ${selectedIds.length} 名候选专家。后端会再次校验学科匹配和单位回避规则。`
        }
        loading={submitting}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmCandidateAction}
        open={Boolean(confirmAction)}
        title={confirmAction === 'replace' ? '替换专家名单' : '追加专家'}
      />
      <ConfirmDialog
        confirmLabel="确认移除"
        description={
          removeTarget
            ? `确认从当前专家名单中移除 ${removeTarget.name}？只有未产生评分记录的专家可以移除，后端会再次校验。`
            : ''
        }
        loading={submitting}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        open={Boolean(removeTarget)}
        title="移除专家"
      />
    </section>
  );
}

function ReviewStatusBadge({
  expert,
}: {
  expert: ReviewManagerAssignedExpert;
}) {
  if (!expert.hasReviewRecord) {
    return <Badge tone="muted">无评分记录</Badge>;
  }

  switch (expert.reviewStatus) {
    case 'draft':
      return <Badge tone="warning">草稿</Badge>;
    case 'submitted':
      return <Badge tone="success">已提交</Badge>;
    case 'returned':
      return <Badge tone="danger">已退回</Badge>;
    default:
      return <Badge tone="primary">已有评分记录</Badge>;
  }
}

function getCandidateEmptyText(reason?: string): string {
  if (reason === 'project_discipline_missing') {
    return '项目尚未维护学科，无法按学科筛选专家。';
  }

  return '暂无符合学科与回避规则的候选专家。';
}

function formatAppendNotice(
  result: AppendReviewManagerProjectExpertsResult,
  candidateNameById: Map<string, string>,
): string {
  const base = `已追加专家：成功 ${result.successCount} 名，失败 ${result.failedCount} 名。`;

  if (result.failures.length === 0) {
    return base;
  }

  const details = result.failures
    .map(
      (failure) =>
        `${candidateNameById.get(failure.expertUserId) ?? failure.expertUserId}：${formatExpertFailureReasons(
          failure.reasons,
        )}`,
    )
    .join('；');

  return `${base}${details}`;
}

function formatAssignmentSubmitError(error: unknown): string {
  if (
    isApiError(error) &&
    error.status === 409 &&
    (error.code === ASSIGNMENT_HAS_REVIEW_RECORD_CODE ||
      error.message.includes('已产生评分记录'))
  ) {
    return '部分已分配专家已产生评分记录，不能被替换或移除。';
  }

  return getErrorMessage(error);
}

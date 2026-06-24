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
  type ExpertAssignmentLockReason,
  getExpertAssignmentLockMessage,
  isExpertAssignmentLockedError,
} from '@/src/lib/project-review/expert-assignment-lock';
import {
  appendProjectExperts,
  listProjectExpertCandidates,
  replaceProjectExperts,
} from '../../api';
import type {
  AppendExpertsResult,
  ExpertBasic,
  ExpertCandidatePage,
} from '../../types/project-review-organization';

type CandidateAction = 'append' | 'replace';

type ExpertCandidatesPanelProps = {
  disciplineNameById: Map<string, string>;
  locked?: boolean;
  lockMessage?: string;
  lockReasons?: ExpertAssignmentLockReason[];
  onChanged: () => void;
  organizationNameById: Map<string, string>;
  projectId: string;
};

const PAGE_SIZE = 10;
const ASSIGNMENT_HAS_REVIEW_RECORD_CODE =
  'EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD';

export function ExpertCandidatesPanel({
  disciplineNameById,
  locked = false,
  lockMessage,
  lockReasons = [],
  onChanged,
  organizationNameById,
  projectId,
}: ExpertCandidatesPanelProps) {
  const [candidates, setCandidates] = useState<ExpertCandidatePage>({
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const [confirmAction, setConfirmAction] = useState<CandidateAction | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const effectiveLockMessage =
    lockMessage || getExpertAssignmentLockMessage(lockReasons);
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
    loadCandidates(1, '');
  }, [projectId]);

  async function loadCandidates(nextPage = candidates.page, nextKeyword = keyword) {
    setLoading(true);
    setError(null);

    try {
      const response = await listProjectExpertCandidates(projectId, {
        keyword: nextKeyword.trim(),
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setCandidates(response);
      setSelectedIds([]);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadCandidates(1, keyword);
  }

  function toggleCandidate(candidateId: string) {
    if (locked) {
      return;
    }

    if (selected.has(candidateId)) {
      setSelectedIds(selectedIds.filter((id) => id !== candidateId));
      return;
    }

    setSelectedIds([...selectedIds, candidateId]);
  }

  function openConfirm(action: CandidateAction) {
    if (locked) {
      setError(effectiveLockMessage || '专家名单已锁定，不能继续调整。');
      return;
    }

    if (selectedIds.length === 0) {
      setError('请先选择候选专家。');
      return;
    }

    setError(null);
    setConfirmAction(action);
  }

  async function handleConfirm() {
    if (!confirmAction) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      if (confirmAction === 'append') {
        const result = await appendProjectExperts(projectId, {
          expertUserIds: selectedIds,
        });
        setNotice(formatAppendNotice(result, candidateNameById));
      } else {
        const result = await replaceProjectExperts(projectId, {
          expertUserIds: selectedIds,
        });
        setNotice(
          `已替换专家，当前已分配 ${result.assignedExperts.length} 名专家；新增或恢复 ${result.addedOrRestoredCount} 名，移除 ${result.removedCount} 名。`,
        );
      }

      setConfirmAction(null);
      onChanged();
      await loadCandidates(candidates.page, keyword);
    } catch (submitError) {
      setError(formatCandidateSubmitError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<ExpertBasic>[] = [
    {
      key: 'select',
      render: (item) => (
        <input
          checked={selected.has(item.id)}
          className="h-4 w-4 accent-cyan-700"
          disabled={locked}
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
      render: (item) => formatNames(item.organizationIds, organizationNameById),
      title: '单位',
    },
    {
      key: 'disciplines',
      render: (item) => formatNames(item.disciplineIds, disciplineNameById),
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
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-bold text-slate-950">专家候选</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              候选专家由后端按项目学科匹配，并自动回避承担单位和合作单位。
            </p>
          </div>
          <div className="table-actions">
            <Button
              disabled={locked || selectedIds.length === 0 || submitting}
              onClick={() => openConfirm('append')}
              variant="secondary"
            >
              追加到当前专家名单
            </Button>
            <Button
              disabled={locked || selectedIds.length === 0 || submitting}
              onClick={() => openConfirm('replace')}
              variant="primary"
            >
              用选中专家替换当前名单
            </Button>
          </div>
        </div>
        <form className="toolbar" onSubmit={handleSearch}>
          <div className="toolbar-left">
            <Input
              id="expert-candidate-keyword"
              label="候选专家关键词"
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="姓名或手机号"
              value={keyword}
            />
            <Button disabled={loading} type="submit" variant="secondary">
              搜索候选
            </Button>
          </div>
        </form>
        <ErrorAlert message={error} />
        {locked ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-800">
            {effectiveLockMessage || '专家名单已锁定，不能继续调整。'}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold leading-6 text-emerald-700">
            {notice}
          </div>
        ) : null}
        {loading ? (
          <LoadingState text="正在加载候选专家..." />
        ) : candidates.items.length === 0 ? (
          <EmptyState text={getEmptyText(candidates.reason)} />
        ) : (
          <>
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              items={candidates.items}
            />
            <Pagination
              onPageChange={(nextPage) => loadCandidates(nextPage, keyword)}
              page={candidates.page}
              pageSize={candidates.pageSize}
              total={candidates.total}
            />
          </>
        )}
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
        onConfirm={handleConfirm}
        open={Boolean(confirmAction)}
        title={confirmAction === 'replace' ? '替换专家' : '追加专家'}
      />
    </section>
  );
}

function formatNames(ids: string[], nameById: Map<string, string>): string {
  if (ids.length === 0) {
    return '-';
  }

  return ids.map((id) => nameById.get(id) ?? id).join('、');
}

function getEmptyText(reason?: string): string {
  if (reason === 'project_discipline_missing') {
    return '项目尚未维护学科，无法按学科筛选专家。请先修正项目学科。';
  }

  return '暂无符合学科与回避规则的候选专家。';
}

function formatAppendNotice(
  result: AppendExpertsResult,
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

function formatCandidateSubmitError(error: unknown): string {
  if (isExpertAssignmentLockedError(error)) {
    return '专家名单已锁定，不能继续调整。';
  }

  if (
    isApiError(error) &&
    error.status === 409 &&
    (error.code === ASSIGNMENT_HAS_REVIEW_RECORD_CODE ||
      error.message.includes('已产生评分记录'))
  ) {
    return '部分已分配专家已产生评分记录，不能被替换移除。';
  }

  return getErrorMessage(error);
}

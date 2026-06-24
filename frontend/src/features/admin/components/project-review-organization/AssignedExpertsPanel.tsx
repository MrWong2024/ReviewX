'use client';

import { useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import {
  type ExpertAssignmentLockReason,
  getExpertAssignmentLockMessage,
  isExpertAssignmentLockedError,
} from '@/src/lib/project-review/expert-assignment-lock';
import { removeProjectExpert } from '../../api';
import type {
  ExpertBasic,
  ExpertReviewStatus,
} from '../../types/project-review-organization';

type AssignedExpertsPanelProps = {
  disciplineNameById: Map<string, string>;
  experts: ExpertBasic[];
  locked?: boolean;
  lockMessage?: string;
  lockReasons?: ExpertAssignmentLockReason[];
  loading: boolean;
  onChanged: () => void;
  organizationNameById: Map<string, string>;
  projectId: string;
};

const ASSIGNMENT_HAS_REVIEW_RECORD_CODE =
  'EXPERT_ASSIGNMENT_HAS_REVIEW_RECORD';
const ASSIGNMENT_HAS_REVIEW_RECORD_MESSAGE =
  '该专家已产生评分记录，不能移除。';

export function AssignedExpertsPanel({
  disciplineNameById,
  experts,
  locked = false,
  lockMessage,
  lockReasons = [],
  loading,
  onChanged,
  organizationNameById,
  projectId,
}: AssignedExpertsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ExpertBasic | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const effectiveLockMessage =
    lockMessage || getExpertAssignmentLockMessage(lockReasons);

  async function handleRemove() {
    if (!removeTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await removeProjectExpert(projectId, removeTarget.id);
      setNotice(
        result.alreadyRemoved ? '专家已移除。' : '已移除专家分配。',
      );
      setRemoveTarget(null);
      onChanged();
    } catch (removeError) {
      setError(formatRemoveExpertError(removeError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<ExpertBasic>[] = [
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
      key: 'reviewStatus',
      render: (item) => (
        <Badge tone={getReviewStatusTone(item.reviewStatus)}>
          {getReviewStatusLabel(item.reviewStatus)}
        </Badge>
      ),
      title: '评分状态',
    },
    {
      key: 'actions',
      render: (item) => {
        const operationLocked = locked || item.hasReviewRecord === true;

        return (
          <div className="flex flex-col items-start gap-1">
            <Button
              disabled={operationLocked}
              onClick={() => {
                if (operationLocked) {
                  return;
                }

                setError(null);
                setNotice(null);
                setRemoveTarget(item);
              }}
              size="sm"
              title={
                locked
                  ? '专家名单已锁定，不能移除'
                  : item.hasReviewRecord
                    ? ASSIGNMENT_HAS_REVIEW_RECORD_MESSAGE
                    : undefined
              }
              variant="danger"
            >
              移除
            </Button>
            {operationLocked ? (
              <span className="text-xs font-semibold text-slate-500">
                {locked ? '专家名单已锁定' : '已有评分记录，不能移除'}
              </span>
            ) : null}
          </div>
        );
      },
      title: '操作',
    },
  ];

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4">
          <h2 className="m-0 text-lg font-bold text-slate-950">已分配专家</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            当前项目已分配的专家来自后端分配记录。已产生评分记录的专家不能移除；如仅误保存草稿，应由专家本人先删除草稿。
          </p>
        </div>
        <ErrorAlert message={error} />
        {locked ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-800">
            {effectiveLockMessage || '专家名单已锁定，不能继续调整。'}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {notice}
          </div>
        ) : null}
        {loading ? (
          <LoadingState text="正在加载已分配专家..." />
        ) : experts.length === 0 ? (
          <EmptyState text="当前项目尚未分配专家。" />
        ) : (
          <DataTable
            columns={columns}
            getRowKey={(item) => item.id}
            items={experts}
          />
        )}
      </div>
      <ConfirmDialog
        confirmLabel="确认移除"
        description={
          removeTarget
            ? `确定移除该专家分配吗？仅未产生评分记录的专家可移除；移除后将删除专家分配记录。专家：${removeTarget.name}（${removeTarget.phone}）`
            : ''
        }
        loading={submitting}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        open={Boolean(removeTarget)}
        title="移除已分配专家"
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

function getReviewStatusLabel(status?: ExpertReviewStatus | null): string {
  if (status === 'draft') {
    return '草稿';
  }

  if (status === 'submitted') {
    return '已提交';
  }

  if (status === 'returned') {
    return '已退回';
  }

  return '未开始';
}

function getReviewStatusTone(
  status?: ExpertReviewStatus | null,
): 'danger' | 'success' | 'muted' | 'warning' {
  if (status === 'draft') {
    return 'warning';
  }

  if (status === 'submitted') {
    return 'success';
  }

  if (status === 'returned') {
    return 'danger';
  }

  return 'muted';
}

function formatRemoveExpertError(error: unknown): string {
  if (isExpertAssignmentLockedError(error)) {
    return '专家名单已锁定，不能继续调整。';
  }

  if (
    isApiError(error) &&
    error.status === 409 &&
    (error.code === ASSIGNMENT_HAS_REVIEW_RECORD_CODE ||
      error.message.includes('已产生评分记录'))
  ) {
    return ASSIGNMENT_HAS_REVIEW_RECORD_MESSAGE;
  }

  return getErrorMessage(error);
}

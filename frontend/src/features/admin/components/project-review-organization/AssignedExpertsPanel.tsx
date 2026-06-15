'use client';

import { useState } from 'react';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { getErrorMessage } from '@/src/lib/api/errors';
import { removeProjectExpert } from '../../api';
import type { ExpertBasic } from '../../types/project-review-organization';

type AssignedExpertsPanelProps = {
  disciplineNameById: Map<string, string>;
  experts: ExpertBasic[];
  loading: boolean;
  onChanged: () => void;
  organizationNameById: Map<string, string>;
  projectId: string;
};

export function AssignedExpertsPanel({
  disciplineNameById,
  experts,
  loading,
  onChanged,
  organizationNameById,
  projectId,
}: AssignedExpertsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ExpertBasic | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRemove() {
    if (!removeTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const result = await removeProjectExpert(projectId, removeTarget.id);
      setNotice(result.alreadyRemoved ? '专家已移除。' : '已移除专家。');
      setRemoveTarget(null);
      onChanged();
    } catch (removeError) {
      setError(getErrorMessage(removeError));
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
      key: 'actions',
      render: (item) => (
        <Button
          onClick={() => {
            setError(null);
            setNotice(null);
            setRemoveTarget(item);
          }}
          size="sm"
          variant="danger"
        >
          移除
        </Button>
      ),
      title: '操作',
    },
  ];

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4">
          <h2 className="m-0 text-lg font-bold text-slate-950">已分配专家</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            当前项目已分配的专家来自后端分配记录。
          </p>
        </div>
        <ErrorAlert message={error} />
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
            ? `确认从当前项目移除专家 ${removeTarget.name}（${removeTarget.phone}）？`
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

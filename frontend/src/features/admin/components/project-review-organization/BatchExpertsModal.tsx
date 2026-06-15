'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Modal } from '@/src/components/ui/Modal';
import { MultiSelect, type MultiSelectOption } from '@/src/components/ui/MultiSelect';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatExpertFailureReasons } from '@/src/lib/labels/project-review-organization-labels';
import { batchUpdateProjectExperts, listUsers } from '../../api';
import type { AdminUser, Project } from '../../types';
import type {
  BatchProjectExpertsInput,
  BatchProjectExpertsResult,
} from '../../types/project-review-organization';

type BatchExpertsModalProps = {
  disciplineNameById: Map<string, string>;
  onClose: () => void;
  onCompleted: () => void;
  open: boolean;
  organizationNameById: Map<string, string>;
  projects: Project[];
};

export function BatchExpertsModal({
  disciplineNameById,
  onClose,
  onCompleted,
  open,
  organizationNameById,
  projects,
}: BatchExpertsModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expertUserIds, setExpertUserIds] = useState<string[]>([]);
  const [experts, setExperts] = useState<AdminUser[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);
  const [mode, setMode] = useState<BatchProjectExpertsInput['mode']>('append');
  const [result, setResult] = useState<BatchProjectExpertsResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const projectLabelById = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.id,
          `${project.projectNo} ${project.name}`,
        ]),
      ),
    [projects],
  );

  const expertOptions = useMemo<MultiSelectOption[]>(
    () =>
      experts.map((expert) => ({
        description: [
          formatNames(expert.organizationIds, organizationNameById, '单位'),
          formatNames(expert.disciplineIds, disciplineNameById, '学科'),
        ].join('；'),
        label: `${expert.name}（${expert.phone}）`,
        value: expert.id,
      })),
    [disciplineNameById, experts, organizationNameById],
  );

  async function loadExperts() {
    setLoadingExperts(true);

    try {
      const response = await listUsers({
        isActive: true,
        page: 1,
        pageSize: 1000,
        role: 'expert',
      });
      setExperts(response.items);
    } catch (loadError) {
      setExperts([]);
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingExperts(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    setExpertUserIds([]);
    setMode('append');
    setResult(null);
    setError(null);
    loadExperts();
  }, [open]);

  function handleClose() {
    if (submitting) {
      return;
    }

    setConfirmOpen(false);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (projects.length === 0) {
      setError('请先选择项目。');
      return;
    }

    if (expertUserIds.length === 0) {
      setError('请选择至少一名专家。');
      return;
    }

    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await batchUpdateProjectExperts({
        expertUserIds,
        mode,
        projectIds: projects.map((project) => project.id),
      });
      setResult(response);
      setConfirmOpen(false);
      onCompleted();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        footer={
          <>
            <Button disabled={submitting} onClick={handleClose}>
              关闭
            </Button>
            <Button
              disabled={submitting || loadingExperts}
              form="batch-experts-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '提交中...' : '批量设置专家'}
            </Button>
          </>
        }
        onClose={handleClose}
        open={open}
        title="批量设置专家"
      >
        <form className="form-stack" id="batch-experts-form" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm leading-6 text-cyan-800">
            已选择 {projects.length}{' '}
            个项目。此处专家列表来自 active expert 用户；批量提交后，后端仍会逐项目校验学科匹配，并自动回避承担单位和合作单位。
          </div>
          <Select
            id="batch-experts-mode"
            label="设置模式"
            onChange={(event) =>
              setMode(event.target.value as BatchProjectExpertsInput['mode'])
            }
            value={mode}
          >
            <option value="append">追加到现有专家</option>
            <option value="replace">替换为所选专家</option>
          </Select>
          <MultiSelect
            disabled={loadingExperts}
            emptyText={loadingExperts ? '正在加载专家...' : '暂无 active expert 用户'}
            id="batch-experts-users"
            label="专家"
            onChange={setExpertUserIds}
            options={expertOptions}
            placeholder="请选择专家"
            value={expertUserIds}
          />
          {result ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              <div className="font-bold text-slate-900">
                批量专家设置完成：成功 {result.successCount} 个，失败{' '}
                {result.failedCount} 个。
              </div>
              {result.results.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {result.results.map((item) => (
                    <div
                      className={[
                        'rounded-md border px-3 py-2',
                        item.success
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-amber-200 bg-amber-50 text-amber-800',
                      ].join(' ')}
                      key={item.projectId}
                    >
                      <div className="font-semibold">
                        {projectLabelById.get(item.projectId) ?? item.projectId}
                      </div>
                      {item.success ? (
                        <div>
                          已分配 {item.assignedCount ?? 0} 名专家；移除{' '}
                          {item.removedCount ?? 0} 名。
                        </div>
                      ) : (
                        <div>
                          {item.message ??
                            item.failures
                              ?.map(
                                (failure) =>
                                  `${failure.expertUserId}：${formatExpertFailureReasons(
                                    failure.reasons,
                                  )}`,
                              )
                              .join('；') ??
                            '设置失败'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
      </Modal>
      <ConfirmDialog
        confirmLabel="确认设置专家"
        description={`即将以 ${mode === 'append' ? '追加' : '替换'} 模式为 ${projects.length} 个项目批量设置 ${expertUserIds.length} 名专家。后端会逐项目校验学科匹配和单位回避规则。`}
        loading={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        open={confirmOpen}
        title="确认批量设置专家"
      />
    </>
  );
}

function formatNames(
  ids: string[],
  nameById: Map<string, string>,
  fallbackLabel: string,
): string {
  if (ids.length === 0) {
    return `${fallbackLabel}：-`;
  }

  return `${fallbackLabel}：${ids.map((id) => nameById.get(id) ?? id).join('、')}`;
}

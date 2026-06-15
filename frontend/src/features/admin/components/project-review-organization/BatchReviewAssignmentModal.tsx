'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Modal } from '@/src/components/ui/Modal';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import { batchUpdateProjectReviewAssignment } from '../../api';
import type { AdminUser, Project, ReviewScheme } from '../../types';
import type {
  BatchReviewAssignmentResult,
  BatchUpdateReviewAssignmentInput,
} from '../../types/project-review-organization';

type BatchReviewAssignmentForm = {
  reviewManagerId: string;
  reviewSchemeId: string;
};

type BatchReviewAssignmentModalProps = {
  onClose: () => void;
  onCompleted: () => void;
  open: boolean;
  projects: Project[];
  reviewManagers: AdminUser[];
  reviewSchemes: ReviewScheme[];
};

const EMPTY_FORM: BatchReviewAssignmentForm = {
  reviewManagerId: '',
  reviewSchemeId: '',
};

export function BatchReviewAssignmentModal({
  onClose,
  onCompleted,
  open,
  projects,
  reviewManagers,
  reviewSchemes,
}: BatchReviewAssignmentModalProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BatchReviewAssignmentForm>(EMPTY_FORM);
  const [result, setResult] = useState<BatchReviewAssignmentResult | null>(null);
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

  function handleClose() {
    if (submitting) {
      return;
    }

    setForm(EMPTY_FORM);
    setError(null);
    setResult(null);
    setConfirmOpen(false);
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (projects.length === 0) {
      setError('请先选择项目。');
      return;
    }

    if (!form.reviewManagerId && !form.reviewSchemeId) {
      setError('请选择评审负责人或评审方案后再提交。');
      return;
    }

    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    const input: BatchUpdateReviewAssignmentInput = {
      projectIds: projects.map((project) => project.id),
    };

    if (form.reviewManagerId) {
      input.reviewManagerId = form.reviewManagerId;
    }

    if (form.reviewSchemeId) {
      input.reviewSchemeId = form.reviewSchemeId;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await batchUpdateProjectReviewAssignment(input);
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
              disabled={submitting}
              form="batch-review-assignment-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '提交中...' : '批量提交'}
            </Button>
          </>
        }
        onClose={handleClose}
        open={open}
        title="批量分配负责人/方案"
      >
        <form
          className="form-stack"
          id="batch-review-assignment-form"
          onSubmit={handleSubmit}
        >
          <ErrorAlert message={error} />
          <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-800">
            已选择 {projects.length} 个项目。批量操作提交前会再次确认。
          </div>
          <div className="grid-2">
            <Select
              id="batch-review-assignment-manager"
              label="评审负责人"
              onChange={(event) =>
                setForm({ ...form, reviewManagerId: event.target.value })
              }
              value={form.reviewManagerId}
            >
              <option value="">不批量设置负责人</option>
              {reviewManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}（{manager.phone}）
                </option>
              ))}
            </Select>
            <Select
              description="批量分配评审方案时，后端会为每个成功项目生成方案快照。"
              id="batch-review-assignment-scheme"
              label="评审方案"
              onChange={(event) =>
                setForm({ ...form, reviewSchemeId: event.target.value })
              }
              value={form.reviewSchemeId}
            >
              <option value="">不批量设置方案</option>
              {reviewSchemes.map((scheme) => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.name}
                </option>
              ))}
            </Select>
          </div>
          {result ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              <div className="font-bold text-slate-900">
                批量分配完成：成功 {result.successCount} 个，失败{' '}
                {result.failedCount} 个。
              </div>
              {result.failures.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {result.failures.map((failure) => (
                    <div
                      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800"
                      key={`${failure.projectId}-${failure.statusCode}`}
                    >
                      <div className="font-semibold">
                        {projectLabelById.get(failure.projectId) ??
                          failure.projectId}
                      </div>
                      <div>{failure.message}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
      </Modal>
      <ConfirmDialog
        confirmLabel="确认批量分配"
        description={`即将对 ${projects.length} 个项目批量设置评审负责人或评审方案。提交后后端会逐项目处理，部分失败会返回明细。`}
        loading={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        open={confirmOpen}
        title="确认批量分配"
      />
    </>
  );
}

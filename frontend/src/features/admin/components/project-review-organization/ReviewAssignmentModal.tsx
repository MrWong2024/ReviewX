'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import { updateProjectReviewAssignment } from '../../api';
import type { AdminUser, Project, ReviewScheme } from '../../types';
import type { UpdateReviewAssignmentInput } from '../../types/project-review-organization';

type ReviewAssignmentForm = {
  reviewManagerId: string;
  reviewSchemeId: string;
};

type ReviewAssignmentModalProps = {
  onClose: () => void;
  onSaved: (project: Project) => void;
  open: boolean;
  project: Project | null;
  reviewManagers: AdminUser[];
  reviewSchemes: ReviewScheme[];
};

const EMPTY_FORM: ReviewAssignmentForm = {
  reviewManagerId: '',
  reviewSchemeId: '',
};

export function ReviewAssignmentModal({
  onClose,
  onSaved,
  open,
  project,
  reviewManagers,
  reviewSchemes,
}: ReviewAssignmentModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewAssignmentForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !project) {
      return;
    }

    setForm({
      reviewManagerId: project.reviewManagerId ?? '',
      reviewSchemeId: project.reviewSchemeId ?? '',
    });
    setError(null);
  }, [open, project]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const input: UpdateReviewAssignmentInput = {};

    if (form.reviewManagerId) {
      input.reviewManagerId = form.reviewManagerId;
    }

    if (form.reviewSchemeId) {
      input.reviewSchemeId = form.reviewSchemeId;
    }

    if (!input.reviewManagerId && !input.reviewSchemeId) {
      setError('请选择评审负责人或评审方案后再保存。');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updated = await updateProjectReviewAssignment(project.id, input);
      onSaved(updated);
    } catch (submitError) {
      setError(getReviewAssignmentErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={submitting} onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={submitting}
            form="review-assignment-form"
            type="submit"
            variant="primary"
          >
            {submitting ? '保存中...' : '保存分配'}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      title="分配评审负责人/方案"
    >
      <form
        className="form-stack"
        id="review-assignment-form"
        onSubmit={handleSubmit}
      >
        <ErrorAlert message={error} />
        {project ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">项目编号：</span>
              {project.projectNo}
            </div>
            <div>
              <span className="font-semibold text-slate-800">项目名称：</span>
              {project.name}
            </div>
          </div>
        ) : null}
        <div className="grid-2">
          <Select
            id="review-assignment-manager"
            label="评审负责人"
            onChange={(event) =>
              setForm({ ...form, reviewManagerId: event.target.value })
            }
            value={form.reviewManagerId}
          >
            <option value="">不修改负责人</option>
            {reviewManagers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}（{manager.phone}）
              </option>
            ))}
          </Select>
          <Select
            description="分配评审方案时，后端会生成评审方案快照，后续评分按快照执行。"
            id="review-assignment-scheme"
            label="评审方案"
            onChange={(event) =>
              setForm({ ...form, reviewSchemeId: event.target.value })
            }
            value={form.reviewSchemeId}
          >
            <option value="">不修改方案</option>
            {reviewSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </Select>
        </div>
      </form>
    </Modal>
  );
}

function getReviewAssignmentErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);

  if (message.includes('review_manager')) {
    return '评审负责人必须是启用状态且具有评审负责人角色的用户。';
  }

  if (message.includes('review scheme') || message.includes('Review scheme')) {
    return '评审方案必须是启用状态的有效方案。';
  }

  return message;
}

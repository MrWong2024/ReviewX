'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { getErrorMessage } from '@/src/lib/api/errors';
import { updateReviewManagerProjectSchedule } from '../api';
import type {
  ReviewManagerProjectListItem,
  ReviewManagerProjectSchedulePayload,
} from '../types';

type ReviewManagerScheduleFormProps = {
  onSaved: (project: ReviewManagerProjectListItem) => void;
  project: ReviewManagerProjectListItem;
};

type ScheduleFormState = {
  meetingUrl: string;
  reviewLocation: string;
  reviewTime: string;
};

export function ReviewManagerScheduleForm({
  onSaved,
  project,
}: ReviewManagerScheduleFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(() =>
    createFormState(project),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(createFormState(project));
  }, [project]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: ReviewManagerProjectSchedulePayload = {
      meetingUrl: form.meetingUrl.trim(),
      reviewLocation: form.reviewLocation.trim(),
    };

    if (form.reviewTime) {
      payload.reviewTime = new Date(form.reviewTime).toISOString();
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const updated = await updateReviewManagerProjectSchedule(
        project.id,
        payload,
      );
      setNotice('已保存评审安排。');
      onSaved(updated);
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">评审安排</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              当前仅保存评审时间、地点和会议链接，不接腾讯会议 API。
            </p>
          </div>
          {project.meetingUrl ? (
            <a
              className="inline-flex min-h-10 items-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
              href={project.meetingUrl}
              rel="noreferrer"
              target="_blank"
            >
              打开会议链接
            </a>
          ) : null}
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          <ErrorAlert message={error} />
          {notice ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {notice}
            </div>
          ) : null}
          <div className="grid-3">
            <Input
              id="review-manager-review-time"
              label="评审时间"
              onChange={(event) =>
                setForm({ ...form, reviewTime: event.target.value })
              }
              type="datetime-local"
              value={form.reviewTime}
            />
            <Input
              id="review-manager-review-location"
              label="评审地点"
              maxLength={200}
              onChange={(event) =>
                setForm({ ...form, reviewLocation: event.target.value })
              }
              placeholder="例如：科技局 305 会议室"
              value={form.reviewLocation}
            />
            <Input
              id="review-manager-meeting-url"
              label="会议链接"
              maxLength={500}
              onChange={(event) =>
                setForm({ ...form, meetingUrl: event.target.value })
              }
              placeholder="https://meeting.tencent.com/..."
              type="url"
              value={form.meetingUrl}
            />
          </div>
          <div>
            <Button disabled={submitting} type="submit" variant="primary">
              {submitting ? '保存中...' : '保存评审安排'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function createFormState(
  project: ReviewManagerProjectListItem,
): ScheduleFormState {
  return {
    meetingUrl: project.meetingUrl ?? '',
    reviewLocation: project.reviewLocation ?? '',
    reviewTime: toDateTimeLocalValue(project.reviewTime),
  };
}

function toDateTimeLocalValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

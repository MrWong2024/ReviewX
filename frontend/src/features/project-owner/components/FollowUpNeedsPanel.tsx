'use client';

import { useEffect, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Textarea } from '@/src/components/ui/Textarea';
import { updateProjectOwnerFollowUpNeeds } from '../api';
import type { ProjectOwnerProject } from '../types';
import {
  FOLLOW_UP_NEEDS_MAX_LENGTH,
  getProjectOwnerContentLockedErrorMessage,
  PROJECT_OWNER_CONTENT_LOCKED_MESSAGE,
} from '../utils';

type FollowUpNeedsPanelProps = {
  locked?: boolean;
  lockedMessage?: string;
  onSaved: (project: ProjectOwnerProject) => void;
  project: ProjectOwnerProject;
};

export function FollowUpNeedsPanel({
  locked = false,
  lockedMessage = PROJECT_OWNER_CONTENT_LOCKED_MESSAGE,
  onSaved,
  project,
}: FollowUpNeedsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(project.followUpNeeds ?? '');

  useEffect(() => {
    setValue(project.followUpNeeds ?? '');
  }, [project.followUpNeeds]);

  async function handleSave() {
    setError(null);
    setNotice(null);

    if (locked) {
      setError(lockedMessage);
      return;
    }

    if (value.length > FOLLOW_UP_NEEDS_MAX_LENGTH) {
      setError(`后续推进需求最多 ${FOLLOW_UP_NEEDS_MAX_LENGTH} 字。`);
      return;
    }

    setSaving(true);

    try {
      const updated = await updateProjectOwnerFollowUpNeeds(project.id, {
        followUpNeeds: value,
      });
      setNotice('后续推进需求已保存。');
      onSaved(updated);
    } catch (saveError) {
      setError(getProjectOwnerContentLockedErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const tooLong = value.length > FOLLOW_UP_NEEDS_MAX_LENGTH;

  return (
    <section className="panel">
      <div className="panel-body">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-lg font-black text-slate-950">
              项目后续推进需求
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              可填写项目后续资金、试点、成果转化或协同支持需求，需点击保存后提交。
            </p>
          </div>
          <div
            className={[
              'text-xs font-bold',
              tooLong ? 'text-red-600' : 'text-slate-500',
            ].join(' ')}
          >
            {value.length} / {FOLLOW_UP_NEEDS_MAX_LENGTH}
          </div>
        </div>

        <ErrorAlert message={error} />
        {locked ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800 shadow-sm">
            {lockedMessage}
          </div>
        ) : null}
        {notice ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
            {notice}
          </div>
        ) : null}

        <Textarea
          error={tooLong ? '内容超过最大长度' : undefined}
          disabled={locked}
          id="project-owner-follow-up-needs"
          maxLength={FOLLOW_UP_NEEDS_MAX_LENGTH + 200}
          onChange={(event) => {
            if (!locked) {
              setValue(event.target.value);
            }
          }}
          placeholder="填写项目后续推进需求。留空并保存可清空该字段。"
          value={value}
        />
        {!locked ? (
          <div className="mt-4 flex justify-end">
            <Button
              disabled={saving || tooLong}
              onClick={handleSave}
              variant="primary"
            >
              {saving ? '保存中...' : '保存后续推进需求'}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

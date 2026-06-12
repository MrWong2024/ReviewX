'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Modal } from '@/src/components/ui/Modal';
import { Textarea } from '@/src/components/ui/Textarea';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  createBatch,
  deleteBatch,
  listBatches,
  updateBatch,
} from '../api';
import { emptyToUndefined, toOptionalNumber } from '../form-utils';
import type { Batch, BatchFormInput } from '../types';

type BatchFormState = {
  description: string;
  isActive: boolean;
  name: string;
  year: string;
};

const EMPTY_FORM: BatchFormState = {
  description: '',
  isActive: true,
  name: '',
  year: '',
};

export function BatchesPage() {
  const [confirmTarget, setConfirmTarget] = useState<Batch | null>(null);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<BatchFormState>(EMPTY_FORM);
  const [items, setItems] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await listBatches();
      setItems(response.items);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(batch: Batch) {
    setEditing(batch);
    setForm({
      description: batch.description ?? '',
      isActive: batch.isActive,
      name: batch.name,
      year: batch.year?.toString() ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: BatchFormInput = {
      description: emptyToUndefined(form.description),
      isActive: form.isActive,
      name: form.name.trim(),
      year: toOptionalNumber(form.year),
    };

    try {
      if (editing) {
        await updateBatch(editing.id, payload);
      } else {
        await createBatch(payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirmTarget) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await deleteBatch(confirmTarget.id);
      setConfirmTarget(null);
      await loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<Batch>[] = [
    { key: 'name', render: (item) => item.name, title: '批次名称' },
    { key: 'year', render: (item) => displayValue(item.year), title: '年份' },
    {
      key: 'description',
      render: (item) => displayValue(item.description),
      title: '说明',
    },
    {
      key: 'isActive',
      render: (item) => (
        <Badge tone={item.isActive ? 'success' : 'muted'}>
          {statusText(item.isActive)}
        </Badge>
      ),
      title: '状态',
    },
    {
      key: 'updatedAt',
      render: (item) => formatDateTime(item.updatedAt),
      title: '更新时间',
    },
    {
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Button onClick={() => openEdit(item)} size="small" variant="ghost">
            编辑
          </Button>
          <Button
            disabled={!item.isActive}
            onClick={() => setConfirmTarget(item)}
            size="small"
            variant="danger"
          >
            停用
          </Button>
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>批次管理</h1>
          <p>维护项目评审批次，删除操作按后端语义停用。</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增批次
        </Button>
      </div>

      <ErrorAlert message={error} />

      <section className="panel">
        {loading ? (
          <LoadingState />
        ) : (
          <DataTable columns={columns} getRowKey={(item) => item.id} items={items} />
        )}
      </section>

      <Modal
        footer={
          <>
            <Button disabled={submitting} onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              disabled={submitting}
              form="batch-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={editing ? '编辑批次' : '新增批次'}
      >
        <form className="form-stack" id="batch-form" onSubmit={handleSubmit}>
          <Input
            id="batch-name"
            label="批次名称"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            value={form.name}
          />
          <Input
            id="batch-year"
            label="年份"
            min="1900"
            onChange={(event) => setForm({ ...form, year: event.target.value })}
            type="number"
            value={form.year}
          />
          <Textarea
            id="batch-description"
            label="说明"
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            value={form.description}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              checked={form.isActive}
              className="h-4 w-4 accent-cyan-700"
              onChange={(event) =>
                setForm({ ...form, isActive: event.target.checked })
              }
              type="checkbox"
            />
            启用
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="停用"
        description={`确认停用批次“${confirmTarget?.name ?? ''}”？`}
        loading={submitting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(confirmTarget)}
      />
    </>
  );
}

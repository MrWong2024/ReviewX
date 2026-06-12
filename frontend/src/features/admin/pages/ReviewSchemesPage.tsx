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
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  createReviewScheme,
  deleteReviewScheme,
  listReviewSchemes,
  updateReviewScheme,
} from '../api';
import { emptyToUndefined, toNumber } from '../form-utils';
import type {
  ReviewScheme,
  ReviewSchemeFormInput,
  ReviewSchemeItem,
} from '../types';

type SchemeItemForm = {
  maxScore: string;
  name: string;
  scoringGuide: string;
  sortOrder: string;
  suggestionRequiredThresholdRatio: string;
};

type SchemeFormState = {
  description: string;
  isActive: boolean;
  items: SchemeItemForm[];
  name: string;
};

const EMPTY_ITEM: SchemeItemForm = {
  maxScore: '100',
  name: '',
  scoringGuide: '',
  sortOrder: '0',
  suggestionRequiredThresholdRatio: '0.8',
};

const EMPTY_FORM: SchemeFormState = {
  description: '',
  isActive: true,
  items: [{ ...EMPTY_ITEM }],
  name: '',
};

export function ReviewSchemesPage() {
  const [confirmTarget, setConfirmTarget] = useState<ReviewScheme | null>(null);
  const [editing, setEditing] = useState<ReviewScheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SchemeFormState>(EMPTY_FORM);
  const [items, setItems] = useState<ReviewScheme[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await listReviewSchemes({ keyword: keyword.trim() });
      setItems(response);
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

  function openEdit(item: ReviewScheme) {
    setEditing(item);
    setForm({
      description: item.description ?? '',
      isActive: item.isActive,
      items: item.items.map(toItemForm),
      name: item.name,
    });
    setModalOpen(true);
  }

  function updateItem(index: number, patch: Partial<SchemeItemForm>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function removeItem(index: number) {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const normalizedItems = form.items.map(toItemPayload);
    const payload: ReviewSchemeFormInput = {
      description: emptyToUndefined(form.description),
      isActive: form.isActive,
      items: normalizedItems,
      name: form.name.trim(),
    };

    try {
      if (editing) {
        await updateReviewScheme(editing.id, payload);
      } else {
        await createReviewScheme(payload);
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
      await deleteReviewScheme(confirmTarget.id);
      setConfirmTarget(null);
      await loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<ReviewScheme>[] = [
    { key: 'name', render: (item) => item.name, title: '方案名称' },
    {
      key: 'description',
      render: (item) => displayValue(item.description),
      title: '说明',
    },
    { key: 'totalScore', render: (item) => item.totalScore, title: '总分' },
    {
      key: 'items',
      render: (item) => item.items.map((scoreItem) => scoreItem.name).join('、'),
      title: '评分项',
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
      key: 'actions',
      render: (item) => (
        <div className="table-actions">
          <Button onClick={() => openEdit(item)} size="small">
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
          <h1>评审方案管理</h1>
          <p>维护评分项，totalScore 由后端按评分项自动计算。</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增方案
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            id="scheme-keyword"
            label="关键词"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="方案名称或说明"
            value={keyword}
          />
          <Button onClick={loadData} variant="secondary">
            搜索
          </Button>
        </div>
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
              form="review-scheme-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={editing ? '编辑评审方案' : '新增评审方案'}
      >
        <form
          className="form-stack"
          id="review-scheme-form"
          onSubmit={handleSubmit}
        >
          <Input
            id="scheme-name"
            label="方案名称"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            value={form.name}
          />
          <Textarea
            id="scheme-description"
            label="说明"
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            value={form.description}
          />
          <div className="form-section">
            <div className="toolbar">
              <strong>评分项</strong>
              <Button
                onClick={() =>
                  setForm({
                    ...form,
                    items: [...form.items, { ...EMPTY_ITEM }],
                  })
                }
                size="small"
                variant="secondary"
              >
                添加评分项
              </Button>
            </div>
            <div className="form-stack">
              {form.items.map((item, index) => (
                <div className="score-item" key={`${index}-${item.name}`}>
                  <div className="grid-2">
                    <Input
                      id={`score-name-${index}`}
                      label="评分项名称"
                      onChange={(event) =>
                        updateItem(index, { name: event.target.value })
                      }
                      required
                      value={item.name}
                    />
                    <Input
                      id={`score-max-${index}`}
                      label="满分"
                      min="1"
                      onChange={(event) =>
                        updateItem(index, { maxScore: event.target.value })
                      }
                      required
                      type="number"
                      value={item.maxScore}
                    />
                  </div>
                  <div className="grid-2">
                    <Input
                      id={`score-sort-${index}`}
                      label="排序"
                      min="0"
                      onChange={(event) =>
                        updateItem(index, { sortOrder: event.target.value })
                      }
                      type="number"
                      value={item.sortOrder}
                    />
                    <Input
                      id={`score-threshold-${index}`}
                      label="建议阈值比例"
                      max="1"
                      min="0"
                      onChange={(event) =>
                        updateItem(index, {
                          suggestionRequiredThresholdRatio: event.target.value,
                        })
                      }
                      step="0.01"
                      type="number"
                      value={item.suggestionRequiredThresholdRatio}
                    />
                  </div>
                  <Textarea
                    id={`score-guide-${index}`}
                    label="评分说明"
                    onChange={(event) =>
                      updateItem(index, { scoringGuide: event.target.value })
                    }
                    value={item.scoringGuide}
                  />
                  <Button
                    disabled={form.items.length === 1}
                    onClick={() => removeItem(index)}
                    size="small"
                    variant="danger"
                  >
                    删除评分项
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <label>
            <input
              checked={form.isActive}
              onChange={(event) =>
                setForm({ ...form, isActive: event.target.checked })
              }
              type="checkbox"
            />{' '}
            启用
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="停用"
        description={`确认停用评审方案“${confirmTarget?.name ?? ''}”？`}
        loading={submitting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(confirmTarget)}
      />
    </>
  );
}

function toItemForm(item: ReviewSchemeItem): SchemeItemForm {
  return {
    maxScore: item.maxScore.toString(),
    name: item.name,
    scoringGuide: item.scoringGuide ?? '',
    sortOrder: item.sortOrder.toString(),
    suggestionRequiredThresholdRatio:
      item.suggestionRequiredThresholdRatio.toString(),
  };
}

function toItemPayload(item: SchemeItemForm): ReviewSchemeItem {
  return {
    maxScore: toNumber(item.maxScore, 0),
    name: item.name.trim(),
    scoringGuide: emptyToUndefined(item.scoringGuide),
    sortOrder: toNumber(item.sortOrder, 0),
    suggestionRequiredThresholdRatio: toNumber(
      item.suggestionRequiredThresholdRatio,
      0.8,
    ),
  };
}

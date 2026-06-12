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
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { getErrorMessage } from '@/src/lib/api/errors';
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  createDictionary,
  deleteDictionary,
  listDictionaries,
  updateDictionary,
} from '../api';
import { emptyToUndefined, toNumber } from '../form-utils';
import type { Dictionary, DictionaryFormInput } from '../types';

type DictionaryFormState = {
  code: string;
  description: string;
  dictType: string;
  isActive: boolean;
  name: string;
  sortOrder: string;
};

const DICT_TYPES = ['project_status', 'material_type', 'review_level'];

const EMPTY_FORM: DictionaryFormState = {
  code: '',
  description: '',
  dictType: 'project_status',
  isActive: true,
  name: '',
  sortOrder: '0',
};

export function DictionariesPage() {
  const [confirmTarget, setConfirmTarget] = useState<Dictionary | null>(null);
  const [dictType, setDictType] = useState('project_status');
  const [editing, setEditing] = useState<Dictionary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DictionaryFormState>(EMPTY_FORM);
  const [items, setItems] = useState<Dictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadData(nextDictType = dictType) {
    setLoading(true);
    setError(null);

    try {
      const response = await listDictionaries({ dictType: nextDictType });
      setItems(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(dictType);
  }, [dictType]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, dictType });
    setModalOpen(true);
  }

  function openEdit(item: Dictionary) {
    setEditing(item);
    setForm({
      code: item.code,
      description: item.description ?? '',
      dictType: item.dictType,
      isActive: item.isActive,
      name: item.name,
      sortOrder: item.sortOrder.toString(),
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: DictionaryFormInput = {
      code: form.code.trim(),
      description: emptyToUndefined(form.description),
      dictType: form.dictType.trim(),
      isActive: form.isActive,
      name: form.name.trim(),
      sortOrder: toNumber(form.sortOrder, 0),
    };

    try {
      if (editing) {
        await updateDictionary(editing.id, payload);
      } else {
        await createDictionary(payload);
      }

      setModalOpen(false);
      setDictType(payload.dictType);
      await loadData(payload.dictType);
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
      await deleteDictionary(confirmTarget.id);
      setConfirmTarget(null);
      await loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<Dictionary>[] = [
    { key: 'dictType', render: (item) => item.dictType, title: 'dictType' },
    { key: 'code', render: (item) => item.code, title: 'code' },
    { key: 'name', render: (item) => item.name, title: '名称' },
    {
      key: 'description',
      render: (item) => displayValue(item.description),
      title: '说明',
    },
    { key: 'sortOrder', render: (item) => item.sortOrder, title: '排序' },
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
          <h1>普通字典管理</h1>
          <p>维护 project_status、material_type、review_level 等普通字典。</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增字典
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Select
            id="dict-type-filter"
            label="dictType 过滤"
            onChange={(event) => setDictType(event.target.value)}
            value={dictType}
          >
            {DICT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            id="dict-type-custom"
            label="自定义 dictType"
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value) {
                setDictType(value);
              }
            }}
            placeholder="输入后离开输入框"
          />
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
              form="dictionary-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={editing ? '编辑字典' : '新增字典'}
      >
        <form className="form-stack" id="dictionary-form" onSubmit={handleSubmit}>
          <Input
            id="dictionary-dict-type"
            label="dictType"
            onChange={(event) =>
              setForm({ ...form, dictType: event.target.value })
            }
            required
            value={form.dictType}
          />
          <div className="grid-2">
            <Input
              id="dictionary-code"
              label="code"
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              required
              value={form.code}
            />
            <Input
              id="dictionary-name"
              label="名称"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              value={form.name}
            />
          </div>
          <Input
            id="dictionary-sort"
            label="排序"
            min="0"
            onChange={(event) =>
              setForm({ ...form, sortOrder: event.target.value })
            }
            type="number"
            value={form.sortOrder}
          />
          <Textarea
            id="dictionary-description"
            label="说明"
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            value={form.description}
          />
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
        description={`确认停用字典“${confirmTarget?.name ?? ''}”？`}
        loading={submitting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(confirmTarget)}
      />
    </>
  );
}

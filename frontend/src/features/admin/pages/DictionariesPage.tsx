'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
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
import { dictionaryTypeLabel } from '@/src/lib/labels/dictionary-labels';
import { getErrorMessage } from '@/src/lib/api/errors';
import { statusText } from '@/src/lib/format/value';
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
  dictType: SupportedDictionaryType;
  isActive: boolean;
  name: string;
  sortOrder: string;
};

const DICTIONARY_TYPE_OPTIONS = [
  { label: '项目状态', value: 'project_status' },
  { label: '材料类型', value: 'material_type' },
  { label: '评审等级', value: 'review_level' },
] as const;

type SupportedDictionaryType = (typeof DICTIONARY_TYPE_OPTIONS)[number]['value'];

const EMPTY_FORM: DictionaryFormState = {
  code: '',
  description: '',
  dictType: 'project_status',
  isActive: true,
  name: '',
  sortOrder: '0',
};

function normalizeDictionaryType(value: string): SupportedDictionaryType {
  return DICTIONARY_TYPE_OPTIONS.some((option) => option.value === value)
    ? (value as SupportedDictionaryType)
    : 'project_status';
}

function emptyFormFor(dictType: SupportedDictionaryType): DictionaryFormState {
  return {
    ...EMPTY_FORM,
    dictType,
  };
}

export function DictionariesPage() {
  const [confirmTarget, setConfirmTarget] = useState<Dictionary | null>(null);
  const [editing, setEditing] = useState<Dictionary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DictionaryFormState>(EMPTY_FORM);
  const [items, setItems] = useState<Dictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDictType, setSelectedDictType] =
    useState<SupportedDictionaryType>('project_status');
  const [submitting, setSubmitting] = useState(false);

  const selectedDictTypeLabel = dictionaryTypeLabel(selectedDictType);

  const loadData = useCallback(async (dictType: SupportedDictionaryType) => {
    setLoading(true);
    setError(null);

    try {
      const response = await listDictionaries({ dictType });
      setItems(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(selectedDictType);
  }, [loadData, selectedDictType]);

  function openCreate() {
    setEditing(null);
    setForm(emptyFormFor(selectedDictType));
    setModalOpen(true);
  }

  function openEdit(item: Dictionary) {
    setEditing(item);
    setForm({
      code: item.code,
      description: item.description ?? '',
      dictType: normalizeDictionaryType(item.dictType),
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

    const resolvedDictType = editing
      ? normalizeDictionaryType(editing.dictType)
      : selectedDictType;

    const payload: DictionaryFormInput = {
      code: form.code.trim(),
      description: emptyToUndefined(form.description),
      dictType: resolvedDictType,
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
      await loadData(resolvedDictType);
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
      await loadData(selectedDictType);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<Dictionary>[] = [
    {
      key: 'code',
      render: (item) => <span className="code">{item.code}</span>,
      title: '编码',
    },
    { key: 'name', render: (item) => item.name, title: '名称' },
    {
      key: 'dictType',
      render: (item) => dictionaryTypeLabel(item.dictType),
      title: '字典类型',
    },
    { key: 'sortOrder', render: (item) => item.sortOrder, title: '显示顺序' },
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
          <Button onClick={() => openEdit(item)} size="sm" variant="ghost">
            编辑
          </Button>
          <Button
            disabled={!item.isActive}
            onClick={() => setConfirmTarget(item)}
            size="sm"
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
          <p>
            普通字典类型由系统固定，管理员只维护对应类型下的字典项，包括项目状态、材料类型和评审等级。
          </p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增{selectedDictTypeLabel}
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Select
            id="dict-type-filter"
            label="字典类型筛选"
            onChange={(event) =>
              setSelectedDictType(normalizeDictionaryType(event.target.value))
            }
            value={selectedDictType}
          >
            {DICTIONARY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <ErrorAlert message={error} />

      <section className="panel">
        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            emptyText={`暂无${selectedDictTypeLabel}字典项。`}
            getRowKey={(item) => item.id}
            items={items}
          />
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
        title={
          editing
            ? `编辑${dictionaryTypeLabel(form.dictType)}`
            : `新增${selectedDictTypeLabel}`
        }
      >
        <form className="form-stack" id="dictionary-form" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-xs font-semibold text-slate-500">字典类型</div>
            <div className="mt-1 text-sm font-bold text-slate-900">
              {dictionaryTypeLabel(form.dictType)}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              类型由系统固定，新增时跟随当前筛选，编辑时不可修改。
            </p>
          </div>
          <div className="grid-2">
            <Input
              hint="用于系统识别，建议使用英文、数字或下划线，创建后不建议频繁修改。"
              id="dictionary-code"
              label="编码"
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              required
              value={form.code}
            />
            <Input
              id="dictionary-name"
              label="名称"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              reserveDescription
              value={form.name}
            />
          </div>
          <Input
            id="dictionary-sort"
            label="显示顺序"
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
        description={`确认停用字典“${confirmTarget?.name ?? ''}”？`}
        loading={submitting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(confirmTarget)}
      />
    </>
  );
}

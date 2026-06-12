'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import {
  dictionaryTypeLabel,
  PRESET_DICTIONARY_TYPES,
} from '@/src/lib/labels/dictionary-labels';
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
  customDictType: string;
  description: string;
  dictType: string;
  isActive: boolean;
  name: string;
  sortOrder: string;
};

const CUSTOM_DICT_TYPE = '__custom__';
const CUSTOM_DICT_FILTER = '__custom_filter__';

const EMPTY_FORM: DictionaryFormState = {
  code: '',
  customDictType: '',
  description: '',
  dictType: 'project_status',
  isActive: true,
  name: '',
  sortOrder: '0',
};

export function DictionariesPage() {
  const [confirmTarget, setConfirmTarget] = useState<Dictionary | null>(null);
  const [dictTypeFilter, setDictTypeFilter] = useState('');
  const [editing, setEditing] = useState<Dictionary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DictionaryFormState>(EMPTY_FORM);
  const [items, setItems] = useState<Dictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const customTypes = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.dictType)
          .filter((type) => !PRESET_DICTIONARY_TYPES.includes(type as never)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!dictTypeFilter) {
      return items;
    }

    if (dictTypeFilter === CUSTOM_DICT_FILTER) {
      return items.filter(
        (item) =>
          !PRESET_DICTIONARY_TYPES.includes(item.dictType as never),
      );
    }

    return items.filter((item) => item.dictType === dictTypeFilter);
  }, [dictTypeFilter, items]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await listDictionaries();
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
    const presetType = PRESET_DICTIONARY_TYPES.includes(
      dictTypeFilter as never,
    )
      ? dictTypeFilter
      : 'project_status';

    setEditing(null);
    setForm({ ...EMPTY_FORM, dictType: presetType });
    setModalOpen(true);
  }

  function openEdit(item: Dictionary) {
    const isPreset = PRESET_DICTIONARY_TYPES.includes(item.dictType as never);

    setEditing(item);
    setForm({
      code: item.code,
      customDictType: isPreset ? '' : item.dictType,
      description: item.description ?? '',
      dictType: isPreset ? item.dictType : CUSTOM_DICT_TYPE,
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

    const resolvedDictType =
      form.dictType === CUSTOM_DICT_TYPE
        ? form.customDictType.trim()
        : form.dictType.trim();

    if (!resolvedDictType) {
      setSubmitting(false);
      setError('请输入自定义类型标识。');
      return;
    }

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
      setDictTypeFilter(payload.dictType);
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
          <p>维护项目状态、材料类型、评审等级等普通字典，支持新增自定义类型。</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增字典
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Select
            id="dict-type-filter"
            label="字典类型筛选"
            onChange={(event) => setDictTypeFilter(event.target.value)}
            value={dictTypeFilter}
          >
            <option value="">全部</option>
            {PRESET_DICTIONARY_TYPES.map((type) => (
              <option key={type} value={type}>
                {dictionaryTypeLabel(type)}
              </option>
            ))}
            <option value={CUSTOM_DICT_FILTER}>自定义类型</option>
            {customTypes.map((type) => (
              <option key={type} value={type}>
                {dictionaryTypeLabel(type)}
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
            getRowKey={(item) => item.id}
            items={filteredItems}
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
        title={editing ? '编辑字典' : '新增字典'}
      >
        <form className="form-stack" id="dictionary-form" onSubmit={handleSubmit}>
          <Select
            id="dictionary-dict-type"
            label="字典类型"
            onChange={(event) =>
              setForm({
                ...form,
                dictType: event.target.value,
                customDictType:
                  event.target.value === CUSTOM_DICT_TYPE
                    ? form.customDictType
                    : '',
              })
            }
            value={form.dictType}
          >
            {PRESET_DICTIONARY_TYPES.map((type) => (
              <option key={type} value={type}>
                {dictionaryTypeLabel(type)}
              </option>
            ))}
            <option value={CUSTOM_DICT_TYPE}>自定义类型</option>
          </Select>
          {form.dictType === CUSTOM_DICT_TYPE ? (
            <Input
              hint="用于系统识别，建议使用英文、数字、下划线或中划线。"
              id="dictionary-custom-dict-type"
              label="自定义类型标识"
              onChange={(event) =>
                setForm({ ...form, customDictType: event.target.value })
              }
              placeholder="例如 custom_type"
              required
              value={form.customDictType}
            />
          ) : null}
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

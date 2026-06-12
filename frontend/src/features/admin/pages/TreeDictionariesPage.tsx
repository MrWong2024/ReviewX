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
import { getErrorMessage } from '@/src/lib/api/errors';
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  createTreeDictionary,
  deleteTreeDictionary,
  listTreeDictionaries,
  updateTreeDictionary,
} from '../api';
import { emptyToNull, emptyToUndefined, toNumber } from '../form-utils';
import type { TreeDictionary, TreeDictionaryFormInput } from '../types';

type TreeFormState = {
  code: string;
  fullName: string;
  isActive: boolean;
  name: string;
  parentId: string;
  sortOrder: string;
  treeType: string;
};

const TREE_TYPES = [
  'project_type',
  'discipline',
  'department',
  'administrative_division',
  'region',
];

const EMPTY_FORM: TreeFormState = {
  code: '',
  fullName: '',
  isActive: true,
  name: '',
  parentId: '',
  sortOrder: '0',
  treeType: 'project_type',
};

export function TreeDictionariesPage() {
  const [confirmTarget, setConfirmTarget] = useState<TreeDictionary | null>(null);
  const [editing, setEditing] = useState<TreeDictionary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TreeFormState>(EMPTY_FORM);
  const [items, setItems] = useState<TreeDictionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [treeType, setTreeType] = useState('project_type');

  const nameById = useMemo(() => {
    return new Map(items.map((item) => [item.id, item.name]));
  }, [items]);

  const parentOptions = items.filter((item) => item.treeType === form.treeType);

  async function loadData(nextTreeType = treeType) {
    setLoading(true);
    setError(null);

    try {
      const response = await listTreeDictionaries({ treeType: nextTreeType });
      setItems(response);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(treeType);
  }, [treeType]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, treeType });
    setModalOpen(true);
  }

  function openEdit(item: TreeDictionary) {
    setEditing(item);
    setForm({
      code: item.code ?? '',
      fullName: item.fullName ?? '',
      isActive: item.isActive,
      name: item.name,
      parentId: item.parentId ?? '',
      sortOrder: item.sortOrder.toString(),
      treeType: item.treeType,
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: TreeDictionaryFormInput = {
      code: emptyToUndefined(form.code),
      fullName: emptyToUndefined(form.fullName),
      isActive: form.isActive,
      name: form.name.trim(),
      parentId: emptyToNull(form.parentId),
      sortOrder: toNumber(form.sortOrder, 0),
      treeType: form.treeType.trim(),
    };

    try {
      if (editing) {
        await updateTreeDictionary(editing.id, payload);
      } else {
        await createTreeDictionary(payload);
      }

      setModalOpen(false);
      setTreeType(payload.treeType);
      await loadData(payload.treeType);
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
      await deleteTreeDictionary(confirmTarget.id);
      setConfirmTarget(null);
      await loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<TreeDictionary>[] = [
    { key: 'treeType', render: (item) => item.treeType, title: 'treeType' },
    { key: 'name', render: (item) => item.name, title: '名称' },
    { key: 'code', render: (item) => displayValue(item.code), title: 'code' },
    {
      key: 'parent',
      render: (item) =>
        item.parentId ? nameById.get(item.parentId) ?? item.parentId : '根节点',
      title: '父节点',
    },
    { key: 'level', render: (item) => item.level, title: '层级' },
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
          <h1>树形字典管理</h1>
          <p>以平铺表格维护项目类型、学科、处室、行政区划等树形数据。</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增节点
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Select
            id="tree-type-filter"
            label="treeType 过滤"
            onChange={(event) => setTreeType(event.target.value)}
            value={treeType}
          >
            {TREE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Input
            id="tree-type-custom"
            label="自定义 treeType"
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value) {
                setTreeType(value);
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
              form="tree-dictionary-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={editing ? '编辑树节点' : '新增树节点'}
      >
        <form
          className="form-stack"
          id="tree-dictionary-form"
          onSubmit={handleSubmit}
        >
          <div className="grid-2">
            <Input
              id="tree-type"
              label="treeType"
              onChange={(event) =>
                setForm({ ...form, treeType: event.target.value, parentId: '' })
              }
              required
              value={form.treeType}
            />
            <Select
              id="tree-parent"
              label="父节点"
              onChange={(event) =>
                setForm({ ...form, parentId: event.target.value })
              }
              value={form.parentId}
            >
              <option value="">根节点</option>
              {parentOptions
                .filter((item) => item.id !== editing?.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {'--'.repeat(Math.max(0, item.level - 1))}
                    {item.name}
                  </option>
                ))}
            </Select>
          </div>
          <div className="grid-2">
            <Input
              id="tree-name"
              label="名称"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              value={form.name}
            />
            <Input
              id="tree-code"
              label="code"
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              value={form.code}
            />
          </div>
          <Input
            id="tree-sort"
            label="排序"
            min="0"
            onChange={(event) =>
              setForm({ ...form, sortOrder: event.target.value })
            }
            type="number"
            value={form.sortOrder}
          />
          <Textarea
            id="tree-full-name"
            label="全称"
            onChange={(event) =>
              setForm({ ...form, fullName: event.target.value })
            }
            value={form.fullName}
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
        description={`确认停用节点“${confirmTarget?.name ?? ''}”？如存在子节点，后端会拒绝并返回冲突错误。`}
        loading={submitting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(confirmTarget)}
      />
    </>
  );
}

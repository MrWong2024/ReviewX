'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Input } from '@/src/components/ui/Input';
import { Modal } from '@/src/components/ui/Modal';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { TreeList } from '@/src/components/ui/TreeList';
import {
  PRESET_TREE_TYPES,
  treeTypeLabel,
} from '@/src/lib/labels/dictionary-labels';
import { getErrorMessage } from '@/src/lib/api/errors';
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  flattenTree,
  flattenVisibleTree,
  treeOptionLabel,
} from '@/src/lib/tree/build-tree';
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
  const [showAllParentOptions, setShowAllParentOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [treeType, setTreeType] = useState('project_type');
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    () => new Set(),
  );

  const treeTypes = useMemo(() => {
    const existingTypes = Array.from(
      new Set(items.map((item) => item.treeType)),
    ).filter(
      (type) => type !== 'region' && !PRESET_TREE_TYPES.includes(type as never),
    );

    return [...PRESET_TREE_TYPES, ...existingTypes];
  }, [items]);

  const currentItems = useMemo(
    () => items.filter((item) => item.treeType === treeType),
    [items, treeType],
  );

  const treeRows = useMemo(
    () => flattenVisibleTree(currentItems, expandedNodeIds),
    [currentItems, expandedNodeIds],
  );

  const parentOptions = useMemo(() => {
    const candidates = items.filter((item) => item.treeType === form.treeType);
    const selectableCandidates = editing
      ? candidates.filter(
          (item) => item.id !== editing.id && !item.pathIds.includes(editing.id),
        )
      : candidates;
    const allOptions = flattenTree(selectableCandidates);

    if (showAllParentOptions) {
      return allOptions;
    }

    const firstLayerOptions = allOptions.filter(({ item }) => !item.parentId);

    if (
      !form.parentId ||
      firstLayerOptions.some(({ item }) => item.id === form.parentId)
    ) {
      return firstLayerOptions;
    }

    const selectedOption = allOptions.find(
      ({ item }) => item.id === form.parentId,
    );

    return selectedOption
      ? [...firstLayerOptions, selectedOption]
      : firstLayerOptions;
  }, [editing, form.parentId, form.treeType, items, showAllParentOptions]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await listTreeDictionaries();
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

  useEffect(() => {
    setExpandedNodeIds(new Set());
  }, [treeType]);

  function openCreateRoot() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, treeType, parentId: '' });
    setShowAllParentOptions(false);
    setModalOpen(true);
  }

  function openCreateChild(parent: TreeDictionary) {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      parentId: parent.id,
      treeType: parent.treeType,
    });
    setShowAllParentOptions(true);
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
    setShowAllParentOptions(Boolean(item.parentId));
    setModalOpen(true);
  }

  function handleFormTreeTypeChange(nextTreeType: string) {
    setForm((current) => ({
      ...current,
      parentId: '',
      treeType: nextTreeType,
    }));
    setShowAllParentOptions(false);
  }

  function handleToggleExpand(item: TreeDictionary) {
    setExpandedNodeIds((current) => {
      const next = new Set(current);

      if (next.has(item.id)) {
        next.delete(item.id);
        collectDescendantIds(currentItems, item.id).forEach((id) => {
          next.delete(id);
        });
        return next;
      }

      next.add(item.id);
      return next;
    });
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
    const parentIdToExpand =
      !editing && payload.parentId ? payload.parentId : null;

    try {
      if (editing) {
        await updateTreeDictionary(editing.id, payload);
      } else {
        await createTreeDictionary(payload);

        if (parentIdToExpand) {
          setExpandedNodeIds((current) => {
            const next = new Set(current);
            next.add(parentIdToExpand);
            return next;
          });
        }
      }

      setModalOpen(false);
      setTreeType(payload.treeType);
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
      await deleteTreeDictionary(confirmTarget.id);
      const removedIds = [
        confirmTarget.id,
        ...collectDescendantIds(currentItems, confirmTarget.id),
      ];

      setExpandedNodeIds((current) => {
        const next = new Set(current);
        removedIds.forEach((id) => {
          next.delete(id);
        });
        return next;
      });
      setConfirmTarget(null);
      await loadData();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>树形字典管理</h1>
          <p>按树形层级维护项目类型、学科、受理处室和行政区划，支持新增根节点与子节点。</p>
        </div>
        <Button onClick={openCreateRoot} variant="primary">
          新增根节点
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Select
            id="tree-type-filter"
            label="树类型筛选"
            onChange={(event) => setTreeType(event.target.value)}
            value={treeType}
          >
            {treeTypes.map((type) => (
              <option key={type} value={type}>
                {treeTypeLabel(type)}
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
          <TreeList
            emptyText="暂无节点，请先新增根节点。"
            onToggleExpand={handleToggleExpand}
            renderActions={(item) => (
              <>
                <Button
                  onClick={() => openCreateChild(item)}
                  size="sm"
                  variant="ghost"
                >
                  添加子节点
                </Button>
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
              </>
            )}
            renderMeta={(item) => (
              <div className="grid gap-1">
                <span>
                  编码：
                  <span className="code">{displayValue(item.code)}</span>
                </span>
                <span>排序：{item.sortOrder}</span>
                {item.fullName ? <span>全称：{item.fullName}</span> : null}
              </div>
            )}
            renderStatus={(item) => (
              <Badge tone={item.isActive ? 'success' : 'muted'}>
                {statusText(item.isActive)}
              </Badge>
            )}
            rows={treeRows}
            title={(item) => item.name}
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
            <Select
              id="tree-type"
              label="树类型"
              onChange={(event) =>
                handleFormTreeTypeChange(event.target.value)
              }
              value={form.treeType}
            >
              {treeTypes.map((type) => (
                <option key={type} value={type}>
                  {treeTypeLabel(type)}
                </option>
              ))}
            </Select>
            <div className="grid content-start gap-2">
              <Select
                description="默认仅显示一级节点。如需选择更深层父节点，请勾选显示全部层级。"
                id="tree-parent"
                label="父节点"
                onChange={(event) =>
                  setForm({ ...form, parentId: event.target.value })
                }
                value={form.parentId}
              >
                <option value="">不选择父节点（作为一级节点）</option>
                {parentOptions.map(({ depth, hasChildren, item }) => (
                  <option key={item.id} value={item.id}>
                    {treeOptionLabel(item.name, depth, hasChildren)}
                  </option>
                ))}
              </Select>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  checked={showAllParentOptions}
                  className="h-4 w-4 accent-cyan-700"
                  onChange={(event) =>
                    setShowAllParentOptions(event.target.checked)
                  }
                  type="checkbox"
                />
                显示全部层级
              </label>
            </div>
          </div>
          <div className="grid-2">
            <Input
              id="tree-name"
              label="名称"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              reserveDescription
              value={form.name}
            />
            <Input
              hint="用于系统识别，建议使用英文、数字或下划线，创建后不建议频繁修改。"
              id="tree-code"
              label="编码"
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
        description={`确认停用节点“${confirmTarget?.name ?? ''}”？如存在子节点，后端会拒绝并返回冲突错误。`}
        loading={submitting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(confirmTarget)}
      />
    </>
  );
}

function collectDescendantIds(
  items: TreeDictionary[],
  nodeId: string,
): string[] {
  const childrenByParentId = new Map<string, string[]>();

  items.forEach((item) => {
    if (!item.parentId) {
      return;
    }

    const children = childrenByParentId.get(item.parentId) ?? [];
    children.push(item.id);
    childrenByParentId.set(item.parentId, children);
  });

  const descendants: string[] = [];
  const stack = [...(childrenByParentId.get(nodeId) ?? [])];

  while (stack.length > 0) {
    const id = stack.pop();

    if (!id) {
      continue;
    }

    descendants.push(id);
    stack.push(...(childrenByParentId.get(id) ?? []));
  }

  return descendants;
}

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
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  flattenTree,
  treeOptionLabel,
} from '@/src/lib/tree/build-tree';
import {
  createOrganization,
  deleteOrganization,
  listOrganizations,
  listTreeDictionaries,
  updateOrganization,
} from '../api';
import { emptyToNull, emptyToUndefined } from '../form-utils';
import type {
  Organization,
  OrganizationFormInput,
  TreeDictionary,
} from '../types';

type OrganizationFormState = {
  contactName: string;
  contactPhone: string;
  isActive: boolean;
  name: string;
  regionId: string;
};

const EMPTY_FORM: OrganizationFormState = {
  contactName: '',
  contactPhone: '',
  isActive: true,
  name: '',
  regionId: '',
};

export function OrganizationsPage() {
  const [confirmTarget, setConfirmTarget] = useState<Organization | null>(null);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OrganizationFormState>(EMPTY_FORM);
  const [items, setItems] = useState<Organization[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [regions, setRegions] = useState<TreeDictionary[]>([]);
  const [regionFilter, setRegionFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  const regionNameById = useMemo(
    () =>
      new Map(
        regions.map((region) => [
          region.id,
          region.fullName || region.name,
        ]),
      ),
    [regions],
  );
  const regionOptions = useMemo(() => flattenTree(regions), [regions]);

  async function loadRegions() {
    try {
      const response = await listTreeDictionaries({
        treeType: 'administrative_division',
      });
      setRegions(response);
    } catch {
      setRegions([]);
    }
  }

  async function loadData(nextPage = page) {
    setLoading(true);
    setError(null);

    try {
      const response = await listOrganizations({
        keyword: keyword.trim(),
        page: nextPage,
        pageSize,
        regionId: regionFilter,
      });
      setItems(response.items);
      setPage(response.page);
      setTotal(response.total);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegions();
  }, []);

  useEffect(() => {
    loadData(1);
  }, [regionFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(item: Organization) {
    setEditing(item);
    setForm({
      contactName: item.contactName ?? '',
      contactPhone: item.contactPhone ?? '',
      isActive: item.isActive,
      name: item.name,
      regionId: item.regionId ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: OrganizationFormInput = {
      contactName: emptyToUndefined(form.contactName),
      contactPhone: emptyToUndefined(form.contactPhone),
      isActive: form.isActive,
      name: form.name.trim(),
      regionId: emptyToNull(form.regionId),
    };

    try {
      if (editing) {
        await updateOrganization(editing.id, payload);
      } else {
        await createOrganization(payload);
      }

      setModalOpen(false);
      await loadData(page);
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
      await deleteOrganization(confirmTarget.id);
      setConfirmTarget(null);
      await loadData(page);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<Organization>[] = [
    { key: 'name', render: (item) => item.name, title: '单位名称' },
    {
      key: 'contactName',
      render: (item) => displayValue(item.contactName),
      title: '联系人',
    },
    {
      key: 'contactPhone',
      render: (item) => displayValue(item.contactPhone),
      title: '电话',
    },
    {
      key: 'regionId',
      render: (item) =>
        item.regionId
          ? regionNameById.get(item.regionId) ?? item.regionId
          : '-',
      title: '行政区划',
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
          <h1>单位管理</h1>
          <p>维护承担单位基础信息，行政区划按树形层级选择并提交区划节点 ID。</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增单位
        </Button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            id="organization-keyword"
            label="关键词"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="单位、联系人、电话"
            value={keyword}
          />
          <Select
            hint={
              regions.length === 0
                ? '暂无行政区划数据，请先在树形字典中维护行政区划。'
                : undefined
            }
            id="organization-region-filter"
            label="行政区划"
            onChange={(event) => setRegionFilter(event.target.value)}
            value={regionFilter}
          >
            <option value="">全部</option>
            {regionOptions.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
          <Button onClick={() => loadData(1)} variant="secondary">
            搜索
          </Button>
        </div>
      </div>

      <ErrorAlert message={error} />

      <section className="panel">
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <DataTable columns={columns} getRowKey={(item) => item.id} items={items} />
            <Pagination
              onPageChange={(nextPage) => loadData(nextPage)}
              page={page}
              pageSize={pageSize}
              total={total}
            />
          </>
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
              form="organization-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={editing ? '编辑单位' : '新增单位'}
      >
        <form className="form-stack" id="organization-form" onSubmit={handleSubmit}>
          <Input
            id="organization-name"
            label="单位名称"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            value={form.name}
          />
          <div className="grid-2">
            <Input
              id="organization-contact-name"
              label="联系人"
              onChange={(event) =>
                setForm({ ...form, contactName: event.target.value })
              }
              value={form.contactName}
            />
            <Input
              id="organization-contact-phone"
              label="电话"
              onChange={(event) =>
                setForm({ ...form, contactPhone: event.target.value })
              }
              value={form.contactPhone}
            />
          </div>
          <Select
            disabled={regions.length === 0}
            hint={
              regions.length === 0
                ? '暂无行政区划数据，请先在树形字典中维护行政区划；当前可不选择。'
                : undefined
            }
            id="organization-region"
            label="行政区划"
            onChange={(event) => setForm({ ...form, regionId: event.target.value })}
            value={form.regionId}
          >
            <option value="">不选择</option>
            {regionOptions.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
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
        description={`确认停用单位“${confirmTarget?.name ?? ''}”？`}
        loading={submitting}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
        open={Boolean(confirmTarget)}
      />
    </>
  );
}

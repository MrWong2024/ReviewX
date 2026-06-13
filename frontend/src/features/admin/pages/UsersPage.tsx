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
import { MultiSelect, type MultiSelectOption } from '@/src/components/ui/MultiSelect';
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import {
  TreeMultiSelect,
  type TreeMultiSelectOption,
} from '@/src/components/ui/TreeMultiSelect';
import { useAuth } from '@/src/features/auth/AuthProvider';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
} from '@/src/lib/labels/role-labels';
import { flattenTree } from '@/src/lib/tree/build-tree';
import { listOrganizations, listTreeDictionaries } from '../api';
import {
  createUser,
  resetUserPassword,
  updateUser,
  updateUserStatus,
  listUsers,
} from '../api/users';
import { emptyToUndefined } from '../form-utils';
import type { Organization, TreeDictionary } from '../types';
import type {
  AdminUser,
  CreateAdminUserInput,
  ListUsersParams,
  ResetAdminUserPasswordInput,
  UpdateAdminUserInput,
  UserRole,
} from '../types/users';

type UserFilters = {
  isActive: '' | 'false' | 'true';
  keyword: string;
  role: '' | UserRole;
};

type UserFormState = {
  disciplineIds: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  name: string;
  organizationIds: string[];
  password: string;
  phone: string;
  roles: UserRole[];
};

type ResetPasswordFormState = {
  mustChangePassword: boolean;
  password: string;
};

const PAGE_SIZE = 20;

const EMPTY_FILTERS: UserFilters = {
  isActive: '',
  keyword: '',
  role: '',
};

const EMPTY_USER_FORM: UserFormState = {
  disciplineIds: [],
  isActive: true,
  mustChangePassword: true,
  name: '',
  organizationIds: [],
  password: '',
  phone: '',
  roles: [],
};

const EMPTY_RESET_FORM: ResetPasswordFormState = {
  mustChangePassword: true,
  password: '',
};

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [confirmStatusTarget, setConfirmStatusTarget] =
    useState<AdminUser | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>(EMPTY_FILTERS);
  const [form, setForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [page, setPage] = useState(1);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetForm, setResetForm] =
    useState<ResetPasswordFormState>(EMPTY_RESET_FORM);
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [treeDictionaries, setTreeDictionaries] = useState<TreeDictionary[]>([]);

  const organizationNameById = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations],
  );
  const disciplineNameById = useMemo(
    () =>
      new Map(
        treeDictionaries.map((item) => [
          item.id,
          item.fullName || item.name,
        ]),
      ),
    [treeDictionaries],
  );
  const organizationOptions = useMemo<MultiSelectOption[]>(
    () =>
      organizations.map((organization) => ({
        description: organization.isActive ? undefined : '已停用',
        label: organization.name,
        value: organization.id,
      })),
    [organizations],
  );
  const disciplineOptions = useMemo<TreeMultiSelectOption[]>(
    () =>
      flattenTree(treeDictionaries).map(({ depth, hasChildren, item }) => ({
        depth,
        description:
          item.fullName && item.fullName !== item.name
            ? item.fullName
            : item.isActive
              ? undefined
              : '已停用',
        hasChildren,
        label: item.name,
        value: item.id,
      })),
    [treeDictionaries],
  );

  async function loadOptions() {
    try {
      const [organizationResponse, disciplineResponse] = await Promise.all([
        listOrganizations({ page: 1, pageSize: 1000 }),
        listTreeDictionaries({ treeType: 'discipline' }),
      ]);

      setOrganizations(organizationResponse.items);
      setTreeDictionaries(disciplineResponse);
    } catch {
      setOrganizations([]);
      setTreeDictionaries([]);
    }
  }

  async function loadData(nextPage = page, nextFilters = filters) {
    setLoading(true);
    setError(null);

    const params: ListUsersParams = {
      keyword: nextFilters.keyword.trim(),
      page: nextPage,
      pageSize: PAGE_SIZE,
      role: nextFilters.role,
      isActive:
        nextFilters.isActive === '' ? '' : nextFilters.isActive === 'true',
    };

    try {
      const response = await listUsers(params);
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
    loadOptions();
    loadData(1, EMPTY_FILTERS);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_USER_FORM);
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(item: AdminUser) {
    setEditing(item);
    setForm({
      disciplineIds: item.disciplineIds,
      isActive: item.isActive,
      mustChangePassword: item.mustChangePassword,
      name: item.name,
      organizationIds: item.organizationIds,
      password: '',
      phone: item.phone,
      roles: item.roles,
    });
    setModalError(null);
    setModalOpen(true);
  }

  function openResetPassword(item: AdminUser) {
    setResetTarget(item);
    setResetForm(EMPTY_RESET_FORM);
    setResetError(null);
  }

  function updateFilters(nextFilters: UserFilters) {
    setFilters(nextFilters);
    void loadData(1, nextFilters);
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData(1, filters);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setModalError(null);
    setNotice(null);

    if (form.roles.length === 0) {
      setModalError('请至少选择一个用户角色。');
      setSubmitting(false);
      return;
    }

    try {
      if (editing) {
        const payload: UpdateAdminUserInput = {
          disciplineIds: form.disciplineIds,
          isActive: form.isActive,
          mustChangePassword: form.mustChangePassword,
          name: form.name.trim(),
          organizationIds: form.organizationIds,
          roles: form.roles,
        };

        await updateUser(editing.id, payload);
        setNotice('用户信息已更新。');
        setModalOpen(false);
        await loadData(page);
      } else {
        const payload: CreateAdminUserInput = {
          disciplineIds: form.disciplineIds,
          isActive: form.isActive,
          mustChangePassword: form.mustChangePassword,
          name: form.name.trim(),
          organizationIds: form.organizationIds,
          password: emptyToUndefined(form.password),
          phone: form.phone.trim(),
          roles: form.roles,
        };

        await createUser(payload);
        setNotice('用户已创建。');
        setModalOpen(false);
        await loadData(1);
      }
    } catch (submitError) {
      setModalError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(target: AdminUser, isActive: boolean) {
    if (target.id === currentUser?.id && !isActive) {
      setError('不能停用当前登录管理员。');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await updateUserStatus(target.id, { isActive });
      setConfirmStatusTarget(null);
      setNotice(isActive ? '用户已启用。' : '用户已停用。');
      await loadData(page);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resetTarget) {
      return;
    }

    setSubmitting(true);
    setResetError(null);
    setNotice(null);

    const payload: ResetAdminUserPasswordInput = {
      mustChangePassword: resetForm.mustChangePassword,
      password: emptyToUndefined(resetForm.password),
    };

    try {
      await resetUserPassword(resetTarget.id, payload);
      setResetTarget(null);
      setNotice(
        payload.password
          ? '密码已重置。'
          : '密码已重置，已重置为该用户手机号。',
      );
      await loadData(page);
    } catch (resetPasswordError) {
      setResetError(getErrorMessage(resetPasswordError));
    } finally {
      setSubmitting(false);
    }
  }

  const columns: DataColumn<AdminUser>[] = [
    {
      key: 'name',
      render: (item) => <span className="font-semibold text-slate-900">{item.name}</span>,
      title: '姓名',
    },
    { key: 'phone', render: (item) => item.phone, title: '手机号' },
    {
      key: 'roles',
      render: (item) => (
        <div className="flex flex-wrap gap-1.5">
          {item.roles.map((role) => (
            <Badge key={role} tone={roleTone(role)}>
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        </div>
      ),
      title: '角色',
    },
    {
      key: 'organizationIds',
      render: (item) => renderNameList(item.organizationIds, organizationNameById),
      title: '关联单位',
    },
    {
      key: 'disciplineIds',
      render: (item) => renderNameList(item.disciplineIds, disciplineNameById),
      title: '关联学科',
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
      key: 'mustChangePassword',
      render: (item) => (
        <Badge tone={item.mustChangePassword ? 'warning' : 'muted'}>
          {item.mustChangePassword ? '是' : '否'}
        </Badge>
      ),
      title: '需改密',
    },
    {
      key: 'updatedAt',
      render: (item) => formatDateTime(item.updatedAt),
      title: '更新时间',
    },
    {
      key: 'actions',
      render: (item) => {
        const isCurrentUser = item.id === currentUser?.id;
        const disableSelfStop = isCurrentUser && item.isActive;

        return (
          <div className="table-actions">
            <Button onClick={() => openEdit(item)} size="sm" variant="ghost">
              编辑
            </Button>
            <Button
              onClick={() => openResetPassword(item)}
              size="sm"
              variant="ghost"
            >
              重置密码
            </Button>
            {item.isActive ? (
              <Button
                disabled={disableSelfStop}
                onClick={() => setConfirmStatusTarget(item)}
                size="sm"
                title={disableSelfStop ? '不能停用当前登录管理员' : undefined}
                variant="danger"
              >
                停用
              </Button>
            ) : (
              <Button
                onClick={() => handleStatusChange(item, true)}
                size="sm"
                variant="secondary"
              >
                启用
              </Button>
            )}
          </div>
        );
      },
      title: '操作',
    },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>用户管理</h1>
          <p>维护管理员、甲方、评审负责人、专家和项目负责人账号，配置角色、单位和学科关联。</p>
        </div>
        <Button onClick={openCreate} variant="primary">
          新增用户
        </Button>
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="toolbar-left">
          <Input
            id="user-keyword"
            label="关键词"
            onChange={(event) =>
              setFilters({ ...filters, keyword: event.target.value })
            }
            placeholder="搜索姓名或手机号"
            value={filters.keyword}
          />
          <Select
            id="user-role-filter"
            label="角色"
            onChange={(event) =>
              updateFilters({
                ...filters,
                role: event.target.value as UserRole | '',
              })
            }
            value={filters.role}
          >
            <option value="">全部角色</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </Select>
          <Select
            id="user-status-filter"
            label="状态"
            onChange={(event) =>
              updateFilters({
                ...filters,
                isActive: event.target.value as UserFilters['isActive'],
              })
            }
            value={filters.isActive}
          >
            <option value="">全部状态</option>
            <option value="true">启用</option>
            <option value="false">停用</option>
          </Select>
          <Button type="submit" variant="secondary">
            搜索
          </Button>
        </div>
      </form>

      <ErrorAlert message={error} />
      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      <section className="panel">
        {loading ? (
          <LoadingState />
        ) : (
          <>
            <DataTable
              columns={columns}
              emptyText="暂无用户数据"
              getRowKey={(item) => item.id}
              items={items}
            />
            <Pagination
              onPageChange={(nextPage) => loadData(nextPage)}
              page={page}
              pageSize={PAGE_SIZE}
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
              form="admin-user-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '保存中...' : '保存'}
            </Button>
          </>
        }
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title={editing ? '编辑用户' : '新增用户'}
      >
        <form className="form-stack" id="admin-user-form" onSubmit={handleSubmit}>
          <ErrorAlert message={modalError} />
          <div className="grid-2">
            <Input
              id="admin-user-name"
              label="姓名"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              value={form.name}
            />
            <Input
              id="admin-user-phone"
              label="手机号"
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              readOnly={Boolean(editing)}
              required
              value={form.phone}
            />
          </div>
          {!editing ? (
            <Input
              hint="留空则由后端默认使用手机号作为初始密码。"
              id="admin-user-password"
              label="初始密码"
              minLength={6}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              placeholder="留空则默认手机号"
              type="password"
              value={form.password}
            />
          ) : null}
          <MultiSelect
            description="至少选择一个角色，提交给后端时仍使用英文角色值。"
            emptyText="暂无角色"
            id="admin-user-roles"
            label="角色"
            onChange={(nextRoles) =>
              setForm({ ...form, roles: nextRoles as UserRole[] })
            }
            options={ROLE_OPTIONS}
            placeholder="请选择用户角色"
            searchable={false}
            value={form.roles}
          />
          {editing?.id === currentUser?.id && !form.roles.includes('admin') ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              当前正在编辑登录管理员本人；移除管理员角色会由后端保护并返回冲突错误。
            </div>
          ) : null}
          <MultiSelect
            disabled={organizations.length === 0}
            emptyText="暂无单位数据，可先在单位管理中维护。"
            id="admin-user-organizations"
            label="关联单位"
            onChange={(organizationIds) => setForm({ ...form, organizationIds })}
            options={organizationOptions}
            placeholder="可不选择单位"
            value={form.organizationIds}
          />
          <TreeMultiSelect
            description="专家用户选择学科后，后续专家候选将按学科匹配。"
            disabled={treeDictionaries.length === 0}
            emptyText="暂无学科数据，请先在树形字典中维护学科。"
            id="admin-user-disciplines"
            label="关联学科"
            onChange={(disciplineIds) => setForm({ ...form, disciplineIds })}
            options={disciplineOptions}
            placeholder="可不选择学科"
            value={form.disciplineIds}
          />
          <div className="grid-2">
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
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                checked={form.mustChangePassword}
                className="h-4 w-4 accent-cyan-700"
                onChange={(event) =>
                  setForm({
                    ...form,
                    mustChangePassword: event.target.checked,
                  })
                }
                type="checkbox"
              />
              首次登录要求修改密码
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        footer={
          <>
            <Button disabled={submitting} onClick={() => setResetTarget(null)}>
              取消
            </Button>
            <Button
              disabled={submitting}
              form="reset-user-password-form"
              type="submit"
              variant="primary"
            >
              {submitting ? '重置中...' : '重置密码'}
            </Button>
          </>
        }
        onClose={() => setResetTarget(null)}
        open={Boolean(resetTarget)}
        title="重置密码"
      >
        <form
          className="form-stack"
          id="reset-user-password-form"
          onSubmit={handleResetPassword}
        >
          <ErrorAlert message={resetError} />
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm leading-6 text-slate-600">
            正在重置用户 {displayValue(resetTarget?.name)}（
            {displayValue(resetTarget?.phone)}）的密码。
          </div>
          <Input
            hint="留空则由后端重置为该用户手机号。"
            id="reset-user-password"
            label="新密码"
            minLength={6}
            onChange={(event) =>
              setResetForm({ ...resetForm, password: event.target.value })
            }
            placeholder="留空则重置为手机号"
            type="password"
            value={resetForm.password}
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              checked={resetForm.mustChangePassword}
              className="h-4 w-4 accent-cyan-700"
              onChange={(event) =>
                setResetForm({
                  ...resetForm,
                  mustChangePassword: event.target.checked,
                })
              }
              type="checkbox"
            />
            要求用户下次登录修改密码
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        confirmLabel="停用"
        description={`确认停用用户“${confirmStatusTarget?.name ?? ''}”？停用后该用户将无法继续登录。`}
        loading={submitting}
        onCancel={() => setConfirmStatusTarget(null)}
        onConfirm={() => {
          if (confirmStatusTarget) {
            void handleStatusChange(confirmStatusTarget, false);
          }
        }}
        open={Boolean(confirmStatusTarget)}
        title="停用用户"
      />
    </>
  );
}

function roleTone(role: UserRole) {
  if (role === 'admin') {
    return 'primary';
  }

  if (role === 'review_manager') {
    return 'warning';
  }

  if (role === 'expert') {
    return 'success';
  }

  return 'muted';
}

function renderNameList(ids: string[], nameById: Map<string, string>) {
  if (ids.length === 0) {
    return <span className="text-slate-400">-</span>;
  }

  const visibleIds = ids.slice(0, 3);
  const hiddenCount = ids.length - visibleIds.length;

  return (
    <div className="flex max-w-64 flex-wrap gap-1.5">
      {visibleIds.map((id) => (
        <span
          className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"
          key={id}
          title={id}
        >
          {nameById.get(id) ?? shortId(id)}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  );
}

function shortId(id: string): string {
  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

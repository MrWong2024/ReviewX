'use client';

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { FormField } from '@/src/components/ui/FormField';
import { Input } from '@/src/components/ui/Input';
import { Modal } from '@/src/components/ui/Modal';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import {
  flattenTree,
  treeOptionLabel,
} from '@/src/lib/tree/build-tree';
import { updateProject } from '../api';
import type {
  AdminUser,
  Batch,
  Dictionary,
  Organization,
  Project,
  ProjectFormInput,
  TreeDictionary,
} from '../types';

type ActiveValue = 'false' | 'true';

type ProjectEditForm = {
  allocatedFunding: string;
  batchId: string;
  cooperationOrganizationIds: string[];
  departmentId: string;
  disciplineIds: string[];
  isActive: ActiveValue;
  leadOrganizationId: string;
  name: string;
  ownerUserId: string;
  projectNo: string;
  projectTypeId: string;
  statusId: string;
  totalFunding: string;
};

type ProjectEditModalProps = {
  batches: Batch[];
  departments: TreeDictionary[];
  disciplines: TreeDictionary[];
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  organizations: Organization[];
  project: Project | null;
  projectOwners: AdminUser[];
  projectStatuses: Dictionary[];
  projectTypes: TreeDictionary[];
};

type SelectedMultiSelectItem = {
  id: string;
  label: string;
};

type NativeMultiSelectProps = {
  children: ReactNode;
  description?: string;
  emptySelectedText?: string;
  id: string;
  label: string;
  onChange: (value: string[]) => void;
  onRemoveSelected?: (id: string) => void;
  selectedItems?: SelectedMultiSelectItem[];
  selectedLabel?: string;
  value: string[];
};

type FundingParseResult =
  | {
      error: string;
      ok: false;
    }
  | {
      ok: true;
      value: number | null;
    };

const EMPTY_FORM: ProjectEditForm = {
  allocatedFunding: '',
  batchId: '',
  cooperationOrganizationIds: [],
  departmentId: '',
  disciplineIds: [],
  isActive: 'true',
  leadOrganizationId: '',
  name: '',
  ownerUserId: '',
  projectNo: '',
  projectTypeId: '',
  statusId: '',
  totalFunding: '',
};

export function ProjectEditModal({
  batches,
  departments,
  disciplines,
  onClose,
  onSaved,
  open,
  organizations,
  project,
  projectOwners,
  projectStatuses,
  projectTypes,
}: ProjectEditModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectEditForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const projectTypeOptions = useMemo(
    () => flattenTree(projectTypes),
    [projectTypes],
  );
  const disciplineOptions = useMemo(
    () => flattenTree(disciplines),
    [disciplines],
  );
  const departmentOptions = useMemo(
    () => flattenTree(departments),
    [departments],
  );
  const organizationNameById = useMemo(() => {
    const names = new Map<string, string>();

    organizations.forEach((organization) => {
      names.set(organization.id, organization.name);
    });

    return names;
  }, [organizations]);
  const disciplineNameById = useMemo(() => {
    const names = new Map<string, string>();

    disciplineOptions.forEach(({ depth, hasChildren, item }) => {
      names.set(item.id, treeOptionLabel(item.name, depth, hasChildren));
    });

    return names;
  }, [disciplineOptions]);
  const selectedCooperationOrganizations = useMemo(
    () =>
      buildSelectedItems(
        withoutLeadOrganization(
          form.cooperationOrganizationIds,
          form.leadOrganizationId,
        ),
        organizationNameById,
        '未知单位',
      ),
    [
      form.cooperationOrganizationIds,
      form.leadOrganizationId,
      organizationNameById,
    ],
  );
  const selectedDisciplines = useMemo(
    () => buildSelectedItems(form.disciplineIds, disciplineNameById, '未知学科'),
    [form.disciplineIds, disciplineNameById],
  );
  const fundingWarning = useMemo(
    () => getFundingWarning(form.totalFunding, form.allocatedFunding),
    [form.totalFunding, form.allocatedFunding],
  );

  useEffect(() => {
    if (!open || !project) {
      return;
    }

    setForm(toForm(project));
    setError(null);
    setSubmitting(false);
  }, [open, project]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }

    const projectNo = form.projectNo.trim();
    const name = form.name.trim();

    if (!projectNo) {
      setError('请填写项目编号。');
      return;
    }

    if (!name) {
      setError('请填写项目名称。');
      return;
    }

    if (!form.batchId) {
      setError('请选择批次。');
      return;
    }

    const totalFunding = parseFunding(form.totalFunding, '拨款总额');

    if (!totalFunding.ok) {
      setError(totalFunding.error);
      return;
    }

    const allocatedFunding = parseFunding(form.allocatedFunding, '已拨款');

    if (!allocatedFunding.ok) {
      setError(allocatedFunding.error);
      return;
    }

    const cooperationOrganizationIds = withoutLeadOrganization(
      form.cooperationOrganizationIds,
      form.leadOrganizationId,
    );

    const payload: ProjectFormInput = {
      allocatedFunding: allocatedFunding.value,
      batchId: form.batchId,
      cooperationOrganizationIds,
      departmentId: emptyToNull(form.departmentId),
      disciplineIds: form.disciplineIds,
      isActive: form.isActive === 'true',
      leadOrganizationId: emptyToNull(form.leadOrganizationId),
      name,
      ownerUserId: emptyToNull(form.ownerUserId),
      projectNo,
      projectTypeId: emptyToNull(form.projectTypeId),
      statusId: emptyToNull(form.statusId),
      totalFunding: totalFunding.value,
    };

    setSubmitting(true);
    setError(null);

    try {
      await updateProject(project.id, payload);
      onSaved();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function updateLeadOrganization(leadOrganizationId: string) {
    setForm((current) => ({
      ...current,
      cooperationOrganizationIds: withoutLeadOrganization(
        current.cooperationOrganizationIds,
        leadOrganizationId,
      ),
      leadOrganizationId,
    }));
  }

  function updateCooperationOrganizations(cooperationOrganizationIds: string[]) {
    setForm((current) => ({
      ...current,
      cooperationOrganizationIds: withoutLeadOrganization(
        cooperationOrganizationIds,
        current.leadOrganizationId,
      ),
    }));
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={submitting} onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={submitting}
            form="project-edit-form"
            type="submit"
            variant="primary"
          >
            {submitting ? '保存中...' : '保存'}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      size="xl"
      title="编辑项目基础信息"
    >
      <form className="form-stack" id="project-edit-form" onSubmit={handleSubmit}>
        <ErrorAlert message={error} />
        {project ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">当前项目：</span>
              {project.projectNo} / {project.name}
            </div>
            {fundingWarning ? (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
                {fundingWarning}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid-3">
          <Input
            id="project-edit-project-no"
            label="项目编号"
            onChange={(event) =>
              setForm({ ...form, projectNo: event.target.value })
            }
            required
            value={form.projectNo}
          />
          <Input
            id="project-edit-name"
            label="项目名称"
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            required
            value={form.name}
          />
          <Select
            id="project-edit-batch"
            label="批次"
            onChange={(event) =>
              setForm({ ...form, batchId: event.target.value })
            }
            required
            value={form.batchId}
          >
            <option value="">请选择批次</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid-3">
          <Select
            id="project-edit-project-type"
            label="项目类型"
            onChange={(event) =>
              setForm({ ...form, projectTypeId: event.target.value })
            }
            value={form.projectTypeId}
          >
            <option value="">不设置</option>
            {projectTypeOptions.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
          <Select
            id="project-edit-status"
            label="项目状态"
            onChange={(event) =>
              setForm({ ...form, statusId: event.target.value })
            }
            value={form.statusId}
          >
            <option value="">不设置</option>
            {projectStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-edit-owner"
            label="项目负责人"
            onChange={(event) =>
              setForm({ ...form, ownerUserId: event.target.value })
            }
            value={form.ownerUserId}
          >
            <option value="">不设置</option>
            {projectOwners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}（{owner.phone}）
              </option>
            ))}
          </Select>
        </div>

        <div className="grid-3">
          <Select
            id="project-edit-lead-organization"
            label="承担单位"
            onChange={(event) => updateLeadOrganization(event.target.value)}
            value={form.leadOrganizationId}
          >
            <option value="">不设置</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </Select>
          <Input
            id="project-edit-total-funding"
            label="拨款总额"
            min="0"
            onChange={(event) =>
              setForm({ ...form, totalFunding: event.target.value })
            }
            step="0.01"
            type="number"
            value={form.totalFunding}
          />
          <Input
            id="project-edit-allocated-funding"
            label="已拨款"
            min="0"
            onChange={(event) =>
              setForm({ ...form, allocatedFunding: event.target.value })
            }
            step="0.01"
            type="number"
            value={form.allocatedFunding}
          />
        </div>

        <div className="grid-2">
          <NativeMultiSelect
            description="按住 Ctrl / Command 可多选。"
            emptySelectedText="尚未选择合作单位"
            id="project-edit-cooperation-organizations"
            label="合作单位"
            onChange={updateCooperationOrganizations}
            onRemoveSelected={(id) =>
              setForm((current) => ({
                ...current,
                cooperationOrganizationIds: withoutLeadOrganization(
                  removeSelectedId(current.cooperationOrganizationIds, id),
                  current.leadOrganizationId,
                ),
              }))
            }
            selectedItems={selectedCooperationOrganizations}
            selectedLabel={`已选择 ${selectedCooperationOrganizations.length} 个合作单位`}
            value={form.cooperationOrganizationIds}
          >
            {organizations.map((organization) => (
              <option
                disabled={organization.id === form.leadOrganizationId}
                key={organization.id}
                value={organization.id}
              >
                {organization.name}
              </option>
            ))}
          </NativeMultiSelect>
          <NativeMultiSelect
            description="按住 Ctrl / Command 可多选。"
            emptySelectedText="尚未选择学科"
            id="project-edit-disciplines"
            label="学科"
            onChange={(disciplineIds) =>
              setForm({ ...form, disciplineIds })
            }
            onRemoveSelected={(id) =>
              setForm((current) => ({
                ...current,
                disciplineIds: removeSelectedId(current.disciplineIds, id),
              }))
            }
            selectedItems={selectedDisciplines}
            selectedLabel={`已选择 ${selectedDisciplines.length} 个学科`}
            value={form.disciplineIds}
          >
            {disciplineOptions.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </NativeMultiSelect>
        </div>

        <div className="grid-2">
          <Select
            id="project-edit-department"
            label="受理处室"
            onChange={(event) =>
              setForm({ ...form, departmentId: event.target.value })
            }
            value={form.departmentId}
          >
            <option value="">不设置</option>
            {departmentOptions.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
          <Select
            id="project-edit-active"
            label="是否启用"
            onChange={(event) =>
              setForm({
                ...form,
                isActive: toActiveValue(event.target.value),
              })
            }
            value={form.isActive}
          >
            <option value="true">启用</option>
            <option value="false">停用</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}

function NativeMultiSelect({
  children,
  description,
  emptySelectedText,
  id,
  label,
  onChange,
  onRemoveSelected,
  selectedItems,
  selectedLabel,
  value,
}: NativeMultiSelectProps) {
  return (
    <FormField description={description} id={id} label={label}>
      <select
        className="min-h-40 w-full rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm leading-6 text-slate-900 shadow-inner shadow-slate-100/70 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        id={id}
        multiple
        onChange={(event) => onChange(selectedValues(event.currentTarget))}
        value={value}
      >
        {children}
      </select>
      {selectedItems ? (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2">
          <div className="text-xs font-medium text-slate-600">
            {selectedLabel ?? `已选择 ${selectedItems.length} 项`}
          </div>
          {selectedItems.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <span
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                  key={item.id}
                >
                  <span className="min-w-0 truncate">{item.label}</span>
                  {onRemoveSelected ? (
                    <button
                      aria-label={`移除${item.label}`}
                      className="shrink-0 text-slate-400 transition hover:text-red-600"
                      onClick={() => onRemoveSelected(item.id)}
                      type="button"
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-xs text-slate-400">
              {emptySelectedText ?? '尚未选择'}
            </div>
          )}
        </div>
      ) : null}
    </FormField>
  );
}

function toForm(project: Project): ProjectEditForm {
  return {
    allocatedFunding: nullableNumberToString(project.allocatedFunding),
    batchId: project.batchId,
    cooperationOrganizationIds: withoutLeadOrganization(
      project.cooperationOrganizationIds,
      project.leadOrganizationId ?? '',
    ),
    departmentId: project.departmentId ?? '',
    disciplineIds: project.disciplineIds,
    isActive: project.isActive ? 'true' : 'false',
    leadOrganizationId: project.leadOrganizationId ?? '',
    name: project.name,
    ownerUserId: project.ownerUserId ?? '',
    projectNo: project.projectNo,
    projectTypeId: project.projectTypeId ?? '',
    statusId: project.statusId ?? '',
    totalFunding: nullableNumberToString(project.totalFunding),
  };
}

function nullableNumberToString(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function selectedValues(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions, (option) => option.value);
}

function buildSelectedItems(
  ids: string[],
  nameById: ReadonlyMap<string, string>,
  unknownPrefix: string,
): SelectedMultiSelectItem[] {
  return ids
    .filter(
      (id, index, currentIds) =>
        id !== '' && currentIds.indexOf(id) === index,
    )
    .map((id) => ({
      id,
      label: nameById.get(id) ?? `${unknownPrefix}（${shortId(id)}）`,
    }));
}

function shortId(id: string): string {
  const trimmed = id.trim();

  if (trimmed.length <= 8) {
    return trimmed;
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

function removeSelectedId(ids: string[], id: string): string[] {
  return ids.filter((currentId) => currentId !== id);
}

function withoutLeadOrganization(
  cooperationOrganizationIds: string[],
  leadOrganizationId: string,
): string[] {
  return cooperationOrganizationIds.filter(
    (id, index, ids) =>
      id !== '' && id !== leadOrganizationId && ids.indexOf(id) === index,
  );
}

function toActiveValue(value: string): ActiveValue {
  return value === 'false' ? 'false' : 'true';
}

function parseFunding(value: string, label: string): FundingParseResult {
  const trimmed = value.trim();

  if (trimmed === '') {
    return { ok: true, value: null };
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return { error: `${label}必须是有效数字。`, ok: false };
  }

  if (parsed < 0) {
    return { error: `${label}不能为负数。`, ok: false };
  }

  return { ok: true, value: parsed };
}

function getFundingWarning(
  totalFundingValue: string,
  allocatedFundingValue: string,
): string | null {
  const totalFunding = parseFunding(totalFundingValue, '拨款总额');
  const allocatedFunding = parseFunding(allocatedFundingValue, '已拨款');

  if (!totalFunding.ok || !allocatedFunding.ok) {
    return null;
  }

  if (
    totalFunding.value !== null &&
    allocatedFunding.value !== null &&
    allocatedFunding.value > totalFunding.value
  ) {
    return '已拨款大于拨款总额，请确认后再保存。';
  }

  return null;
}

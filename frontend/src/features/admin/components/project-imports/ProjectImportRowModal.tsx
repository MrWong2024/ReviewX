'use client';

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Modal } from '@/src/components/ui/Modal';
import { MultiSelect, type MultiSelectOption } from '@/src/components/ui/MultiSelect';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import {
  TreeMultiSelect,
  type TreeMultiSelectOption,
} from '@/src/components/ui/TreeMultiSelect';
import { displayValue } from '@/src/lib/format/value';
import {
  getProjectImportFieldLabel,
  getProjectImportRowStatusLabel,
  getProjectImportRowStatusTone,
} from '@/src/lib/labels/project-import-labels';
import { treeOptionLabel } from '@/src/lib/tree/build-tree';
import type {
  ProjectImportIssue,
  ProjectImportIssueCandidate,
  ProjectImportRow,
  UpdateProjectImportRowInput,
} from '../../types/project-imports';
import { ProjectImportIssueList } from './ProjectImportIssueList';

export type ProjectImportTreeSelectOption = {
  depth: number;
  disabled?: boolean;
  hasChildren: boolean;
  label: string;
  value: string;
};

type ProjectImportRowModalOptions = {
  departmentOptions: ProjectImportTreeSelectOption[];
  disciplineOptions: TreeMultiSelectOption[];
  organizationOptions: MultiSelectOption[];
  ownerOptions: MultiSelectOption[];
  projectStatusOptions: MultiSelectOption[];
  projectTypeOptions: ProjectImportTreeSelectOption[];
  regionOptions: ProjectImportTreeSelectOption[];
};

type ProjectImportRowModalNames = {
  departmentNameById: Map<string, string>;
  dictionaryNameById: Map<string, string>;
  organizationNameById: Map<string, string>;
  ownerNameById: Map<string, string>;
  regionNameById: Map<string, string>;
  treeNameById: Map<string, string>;
};

type ProjectImportRowModalProps = {
  error: string | null;
  names: ProjectImportRowModalNames;
  notice: string | null;
  onClose: () => void;
  onSave: (input: UpdateProjectImportRowInput) => Promise<void>;
  open: boolean;
  options: ProjectImportRowModalOptions;
  row: ProjectImportRow | null;
  saving: boolean;
};

type RowCorrectionForm = {
  allocatedFunding: string;
  cooperationOrganizationIds: string[];
  cooperationOrganizationNames: string;
  createOrganizationContactName: string;
  createOrganizationContactPhone: string;
  createOrganizationEnabled: boolean;
  createOrganizationName: string;
  createOrganizationRegionId: string;
  createOwnerUserDisciplineIds: string[];
  createOwnerUserEnabled: boolean;
  createOwnerUserName: string;
  createOwnerUserOrganizationIds: string[];
  createOwnerUserPhone: string;
  departmentId: string;
  departmentName: string;
  disciplineIds: string[];
  disciplineNames: string;
  leadOrganizationId: string;
  leadOrganizationName: string;
  name: string;
  organizationContactName: string;
  organizationContactPhone: string;
  ownerName: string;
  ownerPhone: string;
  ownerUserId: string;
  projectNo: string;
  projectTypeId: string;
  projectTypeName: string;
  statusId: string;
  statusName: string;
  totalFunding: string;
};

const EMPTY_FORM: RowCorrectionForm = {
  allocatedFunding: '',
  cooperationOrganizationIds: [],
  cooperationOrganizationNames: '',
  createOrganizationContactName: '',
  createOrganizationContactPhone: '',
  createOrganizationEnabled: false,
  createOrganizationName: '',
  createOrganizationRegionId: '',
  createOwnerUserDisciplineIds: [],
  createOwnerUserEnabled: false,
  createOwnerUserName: '',
  createOwnerUserOrganizationIds: [],
  createOwnerUserPhone: '',
  departmentId: '',
  departmentName: '',
  disciplineIds: [],
  disciplineNames: '',
  leadOrganizationId: '',
  leadOrganizationName: '',
  name: '',
  organizationContactName: '',
  organizationContactPhone: '',
  ownerName: '',
  ownerPhone: '',
  ownerUserId: '',
  projectNo: '',
  projectTypeId: '',
  projectTypeName: '',
  statusId: '',
  statusName: '',
  totalFunding: '',
};

export function ProjectImportRowModal({
  error,
  names,
  notice,
  onClose,
  onSave,
  open,
  options,
  row,
  saving,
}: ProjectImportRowModalProps) {
  const [clientError, setClientError] = useState<string | null>(null);
  const [form, setForm] = useState<RowCorrectionForm>(EMPTY_FORM);

  useEffect(() => {
    if (!row) {
      setForm(EMPTY_FORM);
      setClientError(null);
      return;
    }

    setForm({
      allocatedFunding: numberToInput(row.normalized.allocatedFunding),
      cooperationOrganizationIds:
        row.resolved.cooperationOrganizationIds ?? [],
      cooperationOrganizationNames: listToText(
        row.normalized.cooperationOrganizationNames,
      ),
      createOrganizationContactName:
        row.normalized.organizationContactName ?? '',
      createOrganizationContactPhone:
        row.normalized.organizationContactPhone ?? '',
      createOrganizationEnabled: false,
      createOrganizationName: row.normalized.leadOrganizationName ?? '',
      createOrganizationRegionId: '',
      createOwnerUserDisciplineIds: row.resolved.disciplineIds ?? [],
      createOwnerUserEnabled: false,
      createOwnerUserName: row.normalized.ownerName ?? '',
      createOwnerUserOrganizationIds: row.resolved.leadOrganizationId
        ? [row.resolved.leadOrganizationId]
        : [],
      createOwnerUserPhone: row.normalized.ownerPhone ?? '',
      departmentId: row.resolved.departmentId ?? '',
      departmentName: row.normalized.departmentName ?? '',
      disciplineIds: row.resolved.disciplineIds ?? [],
      disciplineNames: listToText(row.normalized.disciplineNames),
      leadOrganizationId: row.resolved.leadOrganizationId ?? '',
      leadOrganizationName: row.normalized.leadOrganizationName ?? '',
      name: row.normalized.name ?? '',
      organizationContactName: row.normalized.organizationContactName ?? '',
      organizationContactPhone: row.normalized.organizationContactPhone ?? '',
      ownerName: row.normalized.ownerName ?? '',
      ownerPhone: row.normalized.ownerPhone ?? '',
      ownerUserId: row.resolved.ownerUserId ?? '',
      projectNo: row.normalized.projectNo ?? '',
      projectTypeId: row.resolved.projectTypeId ?? '',
      projectTypeName: row.normalized.projectTypeName ?? '',
      statusId: row.resolved.statusId ?? '',
      statusName: row.normalized.statusName ?? '',
      totalFunding: numberToInput(row.normalized.totalFunding),
    });
    setClientError(null);
  }, [row]);

  const canSubmit =
    row?.status !== undefined &&
    row.status !== 'confirmed' &&
    row.status !== 'skipped';
  const rawEntries = useMemo(
    () => (row ? Object.entries(row.raw) : []),
    [row],
  );

  if (!row) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const payload = buildPayload(form);

    if ('error' in payload) {
      setClientError(payload.error);
      return;
    }

    setClientError(null);
    await onSave(payload.input);
  }

  function applyCandidate(
    issue: ProjectImportIssue,
    candidate: ProjectImportIssueCandidate,
  ) {
    setClientError(null);
    setForm((current) => {
      if (issue.code.startsWith('project_type_')) {
        return { ...current, projectTypeId: candidate.id };
      }

      if (issue.code.startsWith('status_')) {
        return { ...current, statusId: candidate.id };
      }

      if (issue.code.startsWith('owner_')) {
        return { ...current, ownerUserId: candidate.id };
      }

      if (issue.code.startsWith('lead_organization_')) {
        return { ...current, leadOrganizationId: candidate.id };
      }

      if (issue.code.startsWith('cooperation_organization_')) {
        return {
          ...current,
          cooperationOrganizationIds: appendUnique(
            current.cooperationOrganizationIds,
            candidate.id,
          ),
        };
      }

      if (issue.code.startsWith('discipline_')) {
        return {
          ...current,
          disciplineIds: appendUnique(current.disciplineIds, candidate.id),
        };
      }

      if (issue.code.startsWith('department_')) {
        return { ...current, departmentId: candidate.id };
      }

      return current;
    });
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} variant="secondary">
            关闭
          </Button>
          {canSubmit ? (
            <Button
              disabled={saving}
              form="project-import-row-form"
              type="submit"
              variant="primary"
            >
              {saving ? '保存中...' : '保存修正'}
            </Button>
          ) : null}
        </>
      }
      onClose={onClose}
      open={open}
      title={`Excel 第 ${row.rowNumber} 行导入确认`}
    >
      <form
        className="form-stack"
        id="project-import-row-form"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={getProjectImportRowStatusTone(row.status)}>
            {getProjectImportRowStatusLabel(row.status)}
          </Badge>
          {row.projectId ? (
            <span className="text-sm text-slate-500">
              已关联项目：{row.projectId}
            </span>
          ) : null}
          {row.resolved.matchedExistingProject ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
              确认后将更新已有项目
            </span>
          ) : null}
        </div>

        <ErrorAlert message={clientError ?? error} />
        {notice ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {notice}
          </div>
        ) : null}
        {!canSubmit ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {row.status === 'confirmed'
              ? '该行已确认入库，不允许再次修正或跳过。'
              : '该行已跳过，本阶段不支持恢复确认。'}
          </div>
        ) : null}

        <Section title="原始 Excel 数据">
          {rawEntries.length === 0 ? (
            <div className="text-sm text-slate-400">暂无原始数据</div>
          ) : (
            <KeyValueGrid
              entries={rawEntries.map(([key, value]) => [
                key,
                formatUnknown(value),
              ])}
            />
          )}
        </Section>

        <Section title="标准化数据">
          <KeyValueGrid
            entries={[
              ['项目编号', displayValue(row.normalized.projectNo)],
              ['项目名称', displayValue(row.normalized.name)],
              ['项目类型', displayValue(row.normalized.projectTypeName)],
              ['项目负责人', displayValue(row.normalized.ownerName)],
              ['负责人手机号', displayValue(row.normalized.ownerPhone)],
              ['承担单位', displayValue(row.normalized.leadOrganizationName)],
              ['拨款总额', displayValue(row.normalized.totalFunding)],
              ['已拨款', displayValue(row.normalized.allocatedFunding)],
              ['学科', listToDisplay(row.normalized.disciplineNames)],
              ['受理处室', displayValue(row.normalized.departmentName)],
              [
                '合作单位',
                listToDisplay(row.normalized.cooperationOrganizationNames),
              ],
              ['项目状态', displayValue(row.normalized.statusName)],
              [
                '单位联系人',
                displayValue(row.normalized.organizationContactName),
              ],
              [
                '单位联系人电话',
                displayValue(row.normalized.organizationContactPhone),
              ],
            ]}
          />
        </Section>

        <Section title="当前匹配结果">
          <KeyValueGrid
            entries={[
              [
                '已有项目',
                row.resolved.projectId
                  ? `${displayValue(row.resolved.projectId)}${
                      row.resolved.matchedExistingProject
                        ? '（确认后更新已有项目）'
                        : ''
                    }`
                  : '-',
              ],
              [
                '项目类型',
                labelById(row.resolved.projectTypeId, names.treeNameById),
              ],
              [
                '项目状态',
                labelById(row.resolved.statusId, names.dictionaryNameById),
              ],
              [
                '项目负责人',
                labelById(row.resolved.ownerUserId, names.ownerNameById),
              ],
              [
                '承担单位',
                labelById(
                  row.resolved.leadOrganizationId,
                  names.organizationNameById,
                ),
              ],
              [
                '合作单位',
                idsToLabels(
                  row.resolved.cooperationOrganizationIds,
                  names.organizationNameById,
                ),
              ],
              [
                '学科',
                idsToLabels(row.resolved.disciplineIds, names.treeNameById),
              ],
              [
                '受理处室',
                labelById(row.resolved.departmentId, names.departmentNameById),
              ],
            ]}
          />
        </Section>

        <Section title="问题列表">
          <ProjectImportIssueList
            disabled={!canSubmit || saving}
            issues={row.issues}
            onApplyCandidate={canSubmit ? applyCandidate : undefined}
          />
        </Section>

        <Section title="人工修正表单">
          <div className="grid-2">
            <Input
              disabled={!canSubmit}
              id="import-row-project-no"
              label="项目编号"
              onChange={(event) =>
                setForm({ ...form, projectNo: event.target.value })
              }
              value={form.projectNo}
            />
            <Input
              disabled={!canSubmit}
              id="import-row-project-name"
              label="项目名称"
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              value={form.name}
            />
          </div>
          <div className="grid-2">
            <Input
              disabled={!canSubmit}
              id="import-row-project-type-name"
              label="Excel 项目类型"
              onChange={(event) =>
                setForm({ ...form, projectTypeName: event.target.value })
              }
              value={form.projectTypeName}
            />
            <Select
              disabled={!canSubmit || options.projectTypeOptions.length === 0}
              hint={
                options.projectTypeOptions.length === 0
                  ? '暂无项目类型，请先到树形字典维护。'
                  : undefined
              }
              id="import-row-project-type-id"
              label="选择已有项目类型"
              onChange={(event) =>
                setForm({ ...form, projectTypeId: event.target.value })
              }
              value={form.projectTypeId}
            >
              <option value="">按 Excel 名称自动匹配</option>
              {options.projectTypeOptions.map((option) => (
                <option
                  disabled={option.disabled}
                  key={option.value}
                  value={option.value}
                >
                  {treeOptionLabel(
                    option.label,
                    option.depth,
                    option.hasChildren,
                  )}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid-2">
            <Input
              disabled={!canSubmit}
              id="import-row-status-name"
              label="Excel 项目状态"
              onChange={(event) =>
                setForm({ ...form, statusName: event.target.value })
              }
              value={form.statusName}
            />
            <Select
              disabled={!canSubmit || options.projectStatusOptions.length === 0}
              hint={
                options.projectStatusOptions.length === 0
                  ? '暂无项目状态，请先到普通字典维护。'
                  : undefined
              }
              id="import-row-status-id"
              label="选择已有项目状态"
              onChange={(event) =>
                setForm({ ...form, statusId: event.target.value })
              }
              value={form.statusId}
            >
              <option value="">按 Excel 名称自动匹配</option>
              {options.projectStatusOptions.map((option) => (
                <option
                  disabled={option.disabled}
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid-2">
            <Input
              disabled={!canSubmit}
              id="import-row-owner-name"
              label="Excel 项目负责人"
              onChange={(event) =>
                setForm({ ...form, ownerName: event.target.value })
              }
              value={form.ownerName}
            />
            <Input
              disabled={!canSubmit}
              id="import-row-owner-phone"
              label="负责人手机号"
              onChange={(event) =>
                setForm({ ...form, ownerPhone: event.target.value })
              }
              value={form.ownerPhone}
            />
          </div>
          <Select
            disabled={!canSubmit || options.ownerOptions.length === 0}
            id="import-row-owner-id"
            label="选择已有项目负责人"
            onChange={(event) =>
              setForm({ ...form, ownerUserId: event.target.value })
            }
            value={form.ownerUserId}
          >
            <option value="">按姓名或手机号自动匹配</option>
            {options.ownerOptions.map((option) => (
              <option
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                {option.description
                  ? `${option.label}（${option.description}）`
                  : option.label}
              </option>
            ))}
          </Select>
          <div className="grid-2">
            <Input
              disabled={!canSubmit}
              id="import-row-lead-organization-name"
              label="Excel 承担单位"
              onChange={(event) =>
                setForm({ ...form, leadOrganizationName: event.target.value })
              }
              value={form.leadOrganizationName}
            />
            <Select
              disabled={!canSubmit || options.organizationOptions.length === 0}
              id="import-row-lead-organization-id"
              label="选择已有承担单位"
              onChange={(event) =>
                setForm({ ...form, leadOrganizationId: event.target.value })
              }
              value={form.leadOrganizationId}
            >
              <option value="">按单位名称自动匹配</option>
              {options.organizationOptions.map((option) => (
                <option
                  disabled={option.disabled}
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <MultiSelect
            disabled={!canSubmit}
            emptyText="暂无单位数据，请先在单位管理中维护。"
            id="import-row-cooperation-ids"
            label="合作单位"
            onChange={(cooperationOrganizationIds) =>
              setForm({ ...form, cooperationOrganizationIds })
            }
            options={options.organizationOptions}
            placeholder="可不选择合作单位"
            value={form.cooperationOrganizationIds}
          />
          <div className="grid-2">
            <Textarea
              disabled={!canSubmit}
              hint="多项可用换行、逗号或顿号分隔。"
              id="import-row-cooperation-names"
              label="Excel 合作单位名称"
              onChange={(event) =>
                setForm({
                  ...form,
                  cooperationOrganizationNames: event.target.value,
                })
              }
              value={form.cooperationOrganizationNames}
            />
            <Textarea
              disabled={!canSubmit}
              hint="多项可用换行、逗号或顿号分隔。"
              id="import-row-discipline-names"
              label="Excel 学科名称"
              onChange={(event) =>
                setForm({ ...form, disciplineNames: event.target.value })
              }
              value={form.disciplineNames}
            />
          </div>
          <TreeMultiSelect
            disabled={!canSubmit}
            emptyText="暂无学科数据，请先在树形字典中维护。"
            id="import-row-discipline-ids"
            label="选择已有学科"
            onChange={(disciplineIds) => setForm({ ...form, disciplineIds })}
            options={options.disciplineOptions}
            placeholder="可不选择学科"
            value={form.disciplineIds}
          />
          <div className="grid-2">
            <Input
              disabled={!canSubmit}
              id="import-row-department-name"
              label="Excel 受理处室"
              onChange={(event) =>
                setForm({ ...form, departmentName: event.target.value })
              }
              value={form.departmentName}
            />
            <Select
              disabled={!canSubmit || options.departmentOptions.length === 0}
              hint={
                options.departmentOptions.length === 0
                  ? '暂无受理处室，请先到树形字典维护。'
                  : undefined
              }
              id="import-row-department-id"
              label="选择已有受理处室"
              onChange={(event) =>
                setForm({ ...form, departmentId: event.target.value })
              }
              value={form.departmentId}
            >
              <option value="">按 Excel 名称自动匹配</option>
              {options.departmentOptions.map((option) => (
                <option
                  disabled={option.disabled}
                  key={option.value}
                  value={option.value}
                >
                  {treeOptionLabel(
                    option.label,
                    option.depth,
                    option.hasChildren,
                  )}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid-2">
            <Input
              disabled={!canSubmit}
              id="import-row-total-funding"
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
              disabled={!canSubmit}
              id="import-row-allocated-funding"
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
            <Input
              disabled={!canSubmit}
              id="import-row-organization-contact-name"
              label="单位联系人"
              onChange={(event) =>
                setForm({
                  ...form,
                  organizationContactName: event.target.value,
                })
              }
              value={form.organizationContactName}
            />
            <Input
              disabled={!canSubmit}
              id="import-row-organization-contact-phone"
              label="单位联系人电话"
              onChange={(event) =>
                setForm({
                  ...form,
                  organizationContactPhone: event.target.value,
                })
              }
              value={form.organizationContactPhone}
            />
          </div>

          <div className="form-section">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                checked={form.createOrganizationEnabled}
                className="h-4 w-4 accent-cyan-700"
                disabled={!canSubmit}
                onChange={(event) =>
                  setForm({
                    ...form,
                    createOrganizationEnabled: event.target.checked,
                  })
                }
                type="checkbox"
              />
              创建新承担单位
            </label>
            <div className="mt-4 grid-2">
              <Input
                disabled={!canSubmit || !form.createOrganizationEnabled}
                id="import-create-organization-name"
                label="单位名称"
                onChange={(event) =>
                  setForm({
                    ...form,
                    createOrganizationName: event.target.value,
                  })
                }
                value={form.createOrganizationName}
              />
              <Select
                disabled={
                  !canSubmit ||
                  !form.createOrganizationEnabled ||
                  options.regionOptions.length === 0
                }
                hint={
                  options.regionOptions.length === 0
                    ? '暂无行政区划，请先到树形字典维护。'
                    : undefined
                }
                id="import-create-organization-region"
                label="行政区划"
                onChange={(event) =>
                  setForm({
                    ...form,
                    createOrganizationRegionId: event.target.value,
                  })
                }
                value={form.createOrganizationRegionId}
              >
                <option value="">可不选择</option>
                {options.regionOptions.map((option) => (
                  <option
                    disabled={option.disabled}
                    key={option.value}
                    value={option.value}
                  >
                    {treeOptionLabel(
                      option.label,
                      option.depth,
                      option.hasChildren,
                    )}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-4 grid-2">
              <Input
                disabled={!canSubmit || !form.createOrganizationEnabled}
                id="import-create-organization-contact-name"
                label="联系人"
                onChange={(event) =>
                  setForm({
                    ...form,
                    createOrganizationContactName: event.target.value,
                  })
                }
                value={form.createOrganizationContactName}
              />
              <Input
                disabled={!canSubmit || !form.createOrganizationEnabled}
                id="import-create-organization-contact-phone"
                label="联系电话"
                onChange={(event) =>
                  setForm({
                    ...form,
                    createOrganizationContactPhone: event.target.value,
                  })
                }
                value={form.createOrganizationContactPhone}
              />
            </div>
          </div>

          <div className="form-section">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                checked={form.createOwnerUserEnabled}
                className="h-4 w-4 accent-cyan-700"
                disabled={!canSubmit}
                onChange={(event) =>
                  setForm({
                    ...form,
                    createOwnerUserEnabled: event.target.checked,
                  })
                }
                type="checkbox"
              />
              创建新项目负责人用户
            </label>
            <div className="mt-4 grid-2">
              <Input
                disabled={!canSubmit || !form.createOwnerUserEnabled}
                id="import-create-owner-name"
                label="姓名"
                onChange={(event) =>
                  setForm({ ...form, createOwnerUserName: event.target.value })
                }
                value={form.createOwnerUserName}
              />
              <Input
                disabled={!canSubmit || !form.createOwnerUserEnabled}
                id="import-create-owner-phone"
                label="手机号"
                onChange={(event) =>
                  setForm({ ...form, createOwnerUserPhone: event.target.value })
                }
                value={form.createOwnerUserPhone}
              />
            </div>
            <div className="mt-4">
              <MultiSelect
                disabled={!canSubmit || !form.createOwnerUserEnabled}
                emptyText="暂无单位数据，请先在单位管理中维护。"
                id="import-create-owner-organizations"
                label="关联单位"
                onChange={(createOwnerUserOrganizationIds) =>
                  setForm({ ...form, createOwnerUserOrganizationIds })
                }
                options={options.organizationOptions}
                placeholder="可不选择单位"
                value={form.createOwnerUserOrganizationIds}
              />
            </div>
            <div className="mt-4">
              <TreeMultiSelect
                disabled={!canSubmit || !form.createOwnerUserEnabled}
                emptyText="暂无学科数据，请先在树形字典中维护。"
                id="import-create-owner-disciplines"
                label="关联学科"
                onChange={(createOwnerUserDisciplineIds) =>
                  setForm({ ...form, createOwnerUserDisciplineIds })
                }
                options={options.disciplineOptions}
                placeholder="可不选择学科"
                value={form.createOwnerUserDisciplineIds}
              />
            </div>
          </div>
        </Section>
      </form>
    </Modal>
  );
}

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="form-section">
      <h3 className="m-0 mb-3 text-sm font-black text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function KeyValueGrid({ entries }: { entries: Array<[string, string]> }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {entries.map(([label, value]) => (
        <div
          className="min-w-0 rounded-lg bg-white/80 px-3 py-2 ring-1 ring-slate-100"
          key={label}
        >
          <div className="text-xs font-bold text-slate-400">
            {getProjectImportFieldLabel(label)}
          </div>
          <div className="mt-1 break-words text-sm font-medium leading-6 text-slate-700">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildPayload(
  form: RowCorrectionForm,
): { error: string } | { input: UpdateProjectImportRowInput } {
  const totalFunding = parseOptionalNumber(form.totalFunding, '拨款总额');

  if ('error' in totalFunding) {
    return totalFunding;
  }

  const allocatedFunding = parseOptionalNumber(form.allocatedFunding, '已拨款');

  if ('error' in allocatedFunding) {
    return allocatedFunding;
  }

  if (
    form.createOrganizationEnabled &&
    form.createOrganizationName.trim() === ''
  ) {
    return { error: '创建新承担单位时必须填写单位名称。' };
  }

  if (
    form.createOwnerUserEnabled &&
    (form.createOwnerUserName.trim() === '' ||
      form.createOwnerUserPhone.trim() === '')
  ) {
    return { error: '创建新项目负责人用户时必须填写姓名和手机号。' };
  }

  const input: UpdateProjectImportRowInput = {
    normalized: {
      allocatedFunding: allocatedFunding.value,
      cooperationOrganizationNames: splitList(form.cooperationOrganizationNames),
      departmentName: form.departmentName.trim(),
      disciplineNames: splitList(form.disciplineNames),
      leadOrganizationName: form.leadOrganizationName.trim(),
      name: form.name.trim(),
      organizationContactName: form.organizationContactName.trim(),
      organizationContactPhone: form.organizationContactPhone.trim(),
      ownerName: form.ownerName.trim(),
      ownerPhone: form.ownerPhone.trim(),
      projectNo: form.projectNo.trim(),
      projectTypeName: form.projectTypeName.trim(),
      statusName: form.statusName.trim(),
      totalFunding: totalFunding.value,
    },
    resolved: {
      cooperationOrganizationIds: form.cooperationOrganizationIds,
      disciplineIds: form.disciplineIds,
      departmentId: optionalId(form.departmentId),
      leadOrganizationId: optionalId(form.leadOrganizationId),
      ownerUserId: optionalId(form.ownerUserId),
      projectTypeId: optionalId(form.projectTypeId),
      statusId: optionalId(form.statusId),
    },
  };

  if (form.createOrganizationEnabled) {
    input.createOrganization = {
      contactName: optionalText(form.createOrganizationContactName),
      contactPhone: optionalText(form.createOrganizationContactPhone),
      name: form.createOrganizationName.trim(),
      regionId: optionalId(form.createOrganizationRegionId),
    };
  }

  if (form.createOwnerUserEnabled) {
    input.createOwnerUser = {
      disciplineIds: form.createOwnerUserDisciplineIds,
      name: form.createOwnerUserName.trim(),
      organizationIds: form.createOwnerUserOrganizationIds,
      phone: form.createOwnerUserPhone.trim(),
    };
  }

  return { input };
}

function parseOptionalNumber(
  value: string,
  label: string,
): { error: string } | { value: number | undefined } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { value: undefined };
  }

  const number = Number(trimmed);

  if (!Number.isFinite(number) || number < 0) {
    return { error: `${label}必须是非负数字。` };
  }

  return { value: number };
}

function optionalId(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed || undefined;
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,，、;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(value?: string[]): string {
  return value?.join('\n') ?? '';
}

function listToDisplay(value?: string[]): string {
  return value && value.length > 0 ? value.join('、') : '-';
}

function numberToInput(value?: number | null): string {
  return value === undefined || value === null ? '' : String(value);
}

function appendUnique(items: string[], next: string): string[] {
  return items.includes(next) ? items : [...items, next];
}

function labelById(
  id: string | undefined,
  labels: Map<string, string>,
): string {
  if (!id) {
    return '-';
  }

  return labels.get(id) ?? id;
}

function idsToLabels(
  ids: string[] | undefined,
  labels: Map<string, string>,
): string {
  if (!ids || ids.length === 0) {
    return '-';
  }

  return ids.map((id) => labels.get(id) ?? id).join('、');
}

function formatUnknown(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatUnknown(item)).join('、');
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

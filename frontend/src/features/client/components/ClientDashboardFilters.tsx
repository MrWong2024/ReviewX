'use client';

import type { FormEvent } from 'react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { flattenTree, treeOptionLabel } from '@/src/lib/tree/build-tree';
import {
  CLIENT_BOOLEAN_FILTER_OPTIONS,
  CLIENT_DASHBOARD_PROGRESS_STAGES,
  CLIENT_DASHBOARD_PROGRESS_STAGE_LABELS,
} from '../constants';
import type { ClientReferenceData } from '../types';
import { getTreeOptions } from '../utils';

export type ClientDashboardFilterValues = {
  keyword: string;
  batchId: string;
  projectTypeId: string;
  statusId: string;
  departmentId: string;
  disciplineId: string;
  reviewManagerId: string;
  reviewSchemeId: string;
  finalLevel: string;
  progressStage: string;
  hasMeetingUrl: string;
  hasPendingAppeal: string;
};

type ClientDashboardFiltersProps = {
  filters: ClientDashboardFilterValues;
  finalLevelOptions: Array<{ label: string; value: string }>;
  loading?: boolean;
  onChange: (filters: ClientDashboardFilterValues) => void;
  onReset: () => void;
  onSubmit: () => void;
  referenceData: ClientReferenceData | null;
};

export const EMPTY_CLIENT_DASHBOARD_FILTERS: ClientDashboardFilterValues = {
  keyword: '',
  batchId: '',
  projectTypeId: '',
  statusId: '',
  departmentId: '',
  disciplineId: '',
  reviewManagerId: '',
  reviewSchemeId: '',
  finalLevel: '',
  progressStage: '',
  hasMeetingUrl: '',
  hasPendingAppeal: '',
};

export function ClientDashboardFilters({
  filters,
  finalLevelOptions,
  loading = false,
  onChange,
  onReset,
  onSubmit,
  referenceData,
}: ClientDashboardFiltersProps) {
  const projectTypes = flattenTree(getTreeOptions(referenceData, 'project_type'));
  const disciplines = flattenTree(getTreeOptions(referenceData, 'discipline'));
  const departments = flattenTree(getTreeOptions(referenceData, 'department'));
  const activeBatches =
    referenceData?.batches.filter((item) => item.isActive) ?? [];
  const activeStatuses = referenceData?.projectStatuses ?? [];
  const activeReviewManagers =
    referenceData?.reviewManagers.filter((item) => item.isActive) ?? [];
  const activeReviewSchemes =
    referenceData?.reviewSchemes.filter((item) => item.isActive) ?? [];

  function update(patch: Partial<ClientDashboardFilterValues>) {
    onChange({ ...filters, ...patch });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="panel mb-5">
      <form className="panel-body" onSubmit={handleSubmit}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-slate-950">筛选条件</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              进度阶段筛选表示项目命中过该阶段，不限定为当前主阶段。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={loading} type="submit" variant="primary">
              查询
            </Button>
            <Button disabled={loading} onClick={onReset} variant="ghost">
              重置
            </Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            id="client-dashboard-keyword"
            label="关键词"
            onChange={(event) => update({ keyword: event.target.value })}
            placeholder="项目编号或项目名称"
            value={filters.keyword}
          />
          <Select
            id="client-dashboard-batch"
            label="批次"
            onChange={(event) => update({ batchId: event.target.value })}
            value={filters.batchId}
          >
            <option value="">全部</option>
            {activeBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-project-type"
            label="项目类型"
            onChange={(event) => update({ projectTypeId: event.target.value })}
            value={filters.projectTypeId}
          >
            <option value="">全部</option>
            {projectTypes.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-status"
            label="项目状态"
            onChange={(event) => update({ statusId: event.target.value })}
            value={filters.statusId}
          >
            <option value="">全部</option>
            {activeStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-department"
            label="受理处室"
            onChange={(event) => update({ departmentId: event.target.value })}
            value={filters.departmentId}
          >
            <option value="">全部</option>
            {departments.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-discipline"
            label="学科"
            onChange={(event) => update({ disciplineId: event.target.value })}
            value={filters.disciplineId}
          >
            <option value="">全部</option>
            {disciplines.map(({ depth, hasChildren, item }) => (
              <option key={item.id} value={item.id}>
                {treeOptionLabel(item.name, depth, hasChildren)}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-review-manager"
            label="评审负责人"
            onChange={(event) => update({ reviewManagerId: event.target.value })}
            value={filters.reviewManagerId}
          >
            <option value="">全部</option>
            {activeReviewManagers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {formatUserOption(manager)}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-review-scheme"
            label="评审方案"
            onChange={(event) => update({ reviewSchemeId: event.target.value })}
            value={filters.reviewSchemeId}
          >
            <option value="">全部</option>
            {activeReviewSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-final-level"
            label="有效最终等级"
            onChange={(event) => update({ finalLevel: event.target.value })}
            value={filters.finalLevel}
          >
            <option value="">全部</option>
            {finalLevelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-progress-stage"
            label="命中进度阶段"
            onChange={(event) => update({ progressStage: event.target.value })}
            value={filters.progressStage}
          >
            <option value="">全部</option>
            {CLIENT_DASHBOARD_PROGRESS_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {CLIENT_DASHBOARD_PROGRESS_STAGE_LABELS[stage]}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-has-meeting-url"
            label="评审现场入口"
            onChange={(event) => update({ hasMeetingUrl: event.target.value })}
            value={filters.hasMeetingUrl}
          >
            {CLIENT_BOOLEAN_FILTER_OPTIONS.hasMeetingUrl.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            id="client-dashboard-has-pending-appeal"
            label="处理中申诉"
            onChange={(event) =>
              update({ hasPendingAppeal: event.target.value })
            }
            value={filters.hasPendingAppeal}
          >
            {CLIENT_BOOLEAN_FILTER_OPTIONS.hasPendingAppeal.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </form>
    </section>
  );
}

function formatUserOption(user: { name: string; phone?: string | null }) {
  return user.phone ? `${user.name}（${user.phone}）` : user.name;
}

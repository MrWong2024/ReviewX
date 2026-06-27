'use client';

import { Badge } from '@/src/components/feedback/Badge';
import { Button } from '@/src/components/ui/Button';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import type {
  ProjectOwnerLookupMaps,
  ProjectOwnerProject,
} from '../types';
import {
  formatLookupName,
  formatMoney,
  formatNames,
  formatOptionalName,
  resolveReviewManagerDisplayName,
} from '../utils';

type ProjectOwnerProjectInfoPanelProps = {
  lookupMaps: ProjectOwnerLookupMaps;
  project: ProjectOwnerProject;
};

type InfoItem = {
  label: string;
  value: string;
};

export function ProjectOwnerProjectInfoPanel({
  lookupMaps,
  project,
}: ProjectOwnerProjectInfoPanelProps) {
  const basicItems: InfoItem[] = [
    { label: '项目编号', value: project.projectNo },
    { label: '项目名称', value: project.name },
    {
      label: '批次',
      value: formatLookupName(
        project.batchId,
        lookupMaps.batchNameById,
        '未知批次',
      ),
    },
    {
      label: '项目类型',
      value: formatOptionalName(
        project.projectTypeId,
        lookupMaps.treeNameById,
        '未知项目类型',
      ),
    },
    {
      label: '项目状态',
      value: formatOptionalName(
        project.statusId,
        lookupMaps.dictionaryNameById,
        '未知项目状态',
      ),
    },
    {
      label: '承担单位',
      value: formatOptionalName(
        project.leadOrganizationId,
        lookupMaps.organizationNameById,
        '未知单位',
      ),
    },
    {
      label: '合作单位',
      value: formatNames(
        project.cooperationOrganizationIds,
        lookupMaps.organizationNameById,
        '未知单位',
      ),
    },
    {
      label: '学科',
      value: formatNames(
        project.disciplineIds,
        lookupMaps.treeNameById,
        '未知学科',
      ),
    },
    {
      label: '受理处室',
      value: formatOptionalName(
        project.departmentId,
        lookupMaps.treeNameById,
        '未知受理处室',
      ),
    },
    { label: '拨款总额', value: formatMoney(project.totalFunding) },
    { label: '已拨款', value: formatMoney(project.allocatedFunding) },
    { label: '材料数量', value: String(project.materialCount) },
  ];

  const reviewItems: InfoItem[] = [
    {
      label: '评审负责人',
      value: resolveReviewManagerDisplayName(project, lookupMaps.userNameById),
    },
    {
      label: '评审方案',
      value: formatOptionalName(
        project.reviewSchemeId,
        lookupMaps.reviewSchemeNameById,
        '未知评审方案',
      ),
    },
    { label: '评审时间', value: formatDateTime(project.reviewTime) },
    { label: '评审地点', value: displayValue(project.reviewLocation) },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <section className="panel">
        <div className="panel-body">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-black text-slate-950">
                项目基础信息
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                当前页面仅展示本人负责项目，后端按 ownerUserId 过滤。
              </p>
            </div>
            <Badge tone={project.isActive ? 'success' : 'muted'}>
              {project.isActive ? '有效' : '停用'}
            </Badge>
          </div>
          <InfoGrid items={basicItems} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-body">
          <div className="mb-4">
            <h2 className="m-0 text-lg font-black text-slate-950">
              评审安排
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              仅展示管理员录入的评审信息和会议链接，平台本阶段不接腾讯会议 API。
            </p>
          </div>
          <InfoGrid items={reviewItems} />
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="text-xs font-bold text-slate-500">会议链接</div>
            {project.meetingUrl ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="break-all text-sm text-slate-700">
                  {project.meetingUrl}
                </span>
                <Button
                  onClick={() => window.open(project.meetingUrl, '_blank')}
                  size="sm"
                  variant="secondary"
                >
                  打开会议链接
                </Button>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">-</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          className="rounded-xl border border-slate-200 bg-white/80 p-3"
          key={item.label}
        >
          <dt className="text-xs font-bold text-slate-500">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

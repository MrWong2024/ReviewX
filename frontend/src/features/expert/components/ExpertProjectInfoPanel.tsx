import { Badge } from '@/src/components/feedback/Badge';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import type {
  ExpertLookupMaps,
  ExpertReviewProjectSummary,
} from '../types';
import { formatLookupName, formatReviewManagerName } from '../utils';

type ExpertProjectInfoPanelProps = {
  lookupMaps: ExpertLookupMaps;
  materialCount: number;
  project: ExpertReviewProjectSummary;
};

type InfoItem = {
  label: string;
  value: string;
};

export function ExpertProjectInfoPanel({
  lookupMaps,
  materialCount,
  project,
}: ExpertProjectInfoPanelProps) {
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
      label: '项目状态',
      value: formatLookupName(
        project.statusId,
        lookupMaps.dictionaryNameById,
        '未知项目状态',
      ),
    },
    { label: '已提交材料', value: String(materialCount) },
  ];
  const reviewItems: InfoItem[] = [
    {
      label: '评审负责人',
      value: formatReviewManagerName(project, lookupMaps.userNameById),
    },
    {
      label: '评审方案',
      value: formatLookupName(
        project.reviewSchemeId,
        lookupMaps.reviewSchemeNameById,
        '未知评审方案',
      ),
    },
    { label: '评审时间', value: formatDateTime(project.reviewTime) },
    { label: '评审地点', value: displayValue(project.reviewLocation) },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
      <section className="panel">
        <div className="panel-body">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-black text-slate-950">
                项目基础信息
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                当前页面仅展示分配给本专家账号的评审项目。
              </p>
            </div>
            <Badge tone="primary">专家可见</Badge>
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
              展示管理员录入的评审安排和会议链接，不接入会议 API。
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
                <a
                  className="inline-flex min-h-8 items-center justify-center rounded-md border border-slate-200 bg-white/[0.85] px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/70 hover:text-slate-950"
                  href={project.meetingUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  打开会议链接
                </a>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">-</div>
            )}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4">
            <div className="text-xs font-bold text-slate-500">后续推进需求</div>
            <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
              {displayValue(project.followUpNeeds)}
            </div>
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

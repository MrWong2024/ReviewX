import type { ProjectImportJob } from '../../types/project-imports';

type ProjectImportJobStatsProps = {
  job: Pick<
    ProjectImportJob,
    | 'confirmedRows'
    | 'failedRows'
    | 'importableRows'
    | 'pendingRows'
    | 'skippedRows'
    | 'totalRows'
  >;
};

export function ProjectImportJobStats({ job }: ProjectImportJobStatsProps) {
  const stats = [
    { label: '总行数', value: job.totalRows },
    { label: '可导入', value: job.importableRows },
    { label: '待确认', value: job.pendingRows },
    { label: '已确认', value: job.confirmedRows },
    { label: '已跳过', value: job.skippedRows },
    { label: '失败', value: job.failedRows },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {stats.map((stat) => (
        <div
          className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 shadow-sm"
          key={stat.label}
        >
          <div className="text-xs font-bold text-slate-500">{stat.label}</div>
          <div className="mt-1 text-2xl font-black text-slate-950">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

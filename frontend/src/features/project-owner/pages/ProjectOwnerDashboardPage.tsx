'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ProjectOwnerShell } from '@/src/components/layout/ProjectOwnerShell';
import { getErrorMessage } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import { listProjectOwnerProjects } from '../api';
import type { ProjectOwnerProject } from '../types';

const DASHBOARD_PAGE_SIZE = 5;

export function ProjectOwnerDashboardPage() {
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ProjectOwnerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await listProjectOwnerProjects({
        page: 1,
        pageSize: DASHBOARD_PAGE_SIZE,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const firstPageStats = useMemo(
    () => ({
      arrangedReviewCount: items.filter(
        (item) =>
          Boolean(item.reviewTime) ||
          Boolean(item.reviewLocation) ||
          Boolean(item.meetingUrl),
      ).length,
      pendingMaterialCount: items.filter((item) => item.materialCount === 0)
        .length,
    }),
    [items],
  );

  return (
    <ProjectOwnerShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Project Owner</div>
          <h1>项目负责人工作台</h1>
          <p>
            查看本人负责项目、评审安排和材料提交情况，并维护项目后续推进需求。
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-[#1b255f] via-[#263a8a] to-[#0f8fa7] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(20,43,107,0.22)] transition hover:-translate-y-0.5 hover:text-white hover:shadow-[0_16px_30px_rgba(20,43,107,0.27)] focus-visible:text-white active:text-white"
          href="/project-owner/projects"
        >
          进入我的项目
        </Link>
      </div>

      <ErrorAlert message={error} />

      {loading ? (
        <section className="panel">
          <LoadingState text="正在加载项目负责人工作台..." />
        </section>
      ) : (
        <>
          <section className="mb-5 grid gap-4 md:grid-cols-3">
            <MetricCard label="我的项目" value={String(total)} />
            <MetricCard
              hint="基于当前第一页项目"
              label="待上传材料"
              value={String(firstPageStats.pendingMaterialCount)}
            />
            <MetricCard
              hint="基于当前第一页项目"
              label="已安排评审"
              value={String(firstPageStats.arrangedReviewCount)}
            />
          </section>

          <section className="panel">
            <div className="panel-body">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-black text-slate-950">
                    最近项目
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    按后端默认排序展示第一页项目，精确筛选和分页请进入“我的项目”。
                  </p>
                </div>
                <Badge tone="primary">{items.length} 个项目</Badge>
              </div>

              {items.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-sm leading-6 text-slate-500">
                  当前账号暂无负责项目，请联系管理员确认项目负责人绑定关系。
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map((project) => (
                    <Link
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_16px_36px_rgba(20,43,107,0.12)]"
                      href={`/project-owner/projects/${project.id}`}
                      key={project.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="code">{project.projectNo}</div>
                          <div className="mt-1 text-base font-black text-slate-950">
                            {project.name}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            评审时间：{formatDateTime(project.reviewTime)}
                          </div>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          <div>材料 {project.materialCount} 个</div>
                          <div className="mt-1">
                            地点：{displayValue(project.reviewLocation)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </ProjectOwnerShell>
  );
}

function MetricCard({
  hint,
  label,
  value,
}: {
  hint?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_38px_rgba(18,31,68,0.08)] backdrop-blur">
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
      {hint ? <div className="mt-2 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

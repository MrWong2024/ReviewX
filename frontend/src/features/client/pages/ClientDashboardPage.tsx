'use client';

import { useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { ClientShell } from '@/src/components/layout/ClientShell';
import { Button } from '@/src/components/ui/Button';
import { getErrorMessage } from '@/src/lib/api/errors';
import {
  listClientDashboardOverview,
  listClientDashboardProjects,
  loadClientReferenceData,
} from '../api';
import {
  CLIENT_DASHBOARD_PAGE_SIZE,
  CLIENT_DASHBOARD_PROGRESS_STAGES,
  CLIENT_REFERENCE_DATA_WARNING,
} from '../constants';
import { ClientDashboardBreakdowns } from '../components/ClientDashboardBreakdowns';
import {
  ClientDashboardFilters,
  EMPTY_CLIENT_DASHBOARD_FILTERS,
  type ClientDashboardFilterValues,
} from '../components/ClientDashboardFilters';
import { ClientDashboardMetricCards } from '../components/ClientDashboardMetricCards';
import { ClientDashboardProjectTable } from '../components/ClientDashboardProjectTable';
import type {
  ClientDashboardOverviewResponse,
  ClientDashboardProjectItem,
  ClientDashboardProgressStage,
  ClientReferenceData,
  QueryClientDashboardParams,
} from '../types';
import {
  buildNameMaps,
  createEmptyClientLookupMaps,
  formatDateTime,
  formatReviewLevel,
} from '../utils';

export function ClientDashboardPage() {
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClientDashboardFilterValues>(
    EMPTY_CLIENT_DASHBOARD_FILTERS,
  );
  const [overview, setOverview] =
    useState<ClientDashboardOverviewResponse | null>(null);
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<ClientDashboardProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [referenceData, setReferenceData] = useState<ClientReferenceData | null>(
    null,
  );
  const [referenceDataWarning, setReferenceDataWarning] = useState<
    string | null
  >(null);
  const [total, setTotal] = useState(0);

  const lookupMaps = useMemo(
    () =>
      referenceData
        ? buildNameMaps(referenceData)
        : createEmptyClientLookupMaps(),
    [referenceData],
  );

  const finalLevelOptions = useMemo(() => {
    const options = new Map<string, string>();

    referenceData?.reviewLevels.forEach((level) => {
      if (level.isActive) {
        options.set(level.code, level.name);
      }
    });

    overview?.breakdowns.byFinalLevel.forEach((item) => {
      const value = item.finalLevel?.trim();

      if (value && value !== '其他' && !options.has(value)) {
        options.set(value, formatReviewLevel(value, lookupMaps.reviewLevelLabelByValue));
      }
    });

    return [...options.entries()].map(([value, label]) => ({ label, value }));
  }, [lookupMaps.reviewLevelLabelByValue, overview, referenceData]);

  async function loadDashboard(
    nextPage = page,
    nextFilters = filters,
    options: { reloadReference?: boolean } = {},
  ) {
    setDashboardLoading(true);
    setError(null);

    const params = buildDashboardParams(nextFilters);
    const [overviewResult, projectsResult, referenceResult] =
      await Promise.allSettled([
        listClientDashboardOverview(params),
        listClientDashboardProjects({
          ...params,
          page: nextPage,
          pageSize: CLIENT_DASHBOARD_PAGE_SIZE,
        }),
        options.reloadReference || !referenceData
          ? loadClientReferenceData()
          : Promise.resolve(referenceData),
      ]);

    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value);
    } else {
      setOverview(null);
      setError(`甲方看板总览加载失败。${getErrorMessage(overviewResult.reason)}`);
    }

    if (projectsResult.status === 'fulfilled') {
      setProjects(projectsResult.value.items);
      setPage(projectsResult.value.page);
      setTotal(projectsResult.value.total);
    } else {
      setProjects([]);
      setTotal(0);
      setError((current) =>
        current
          ? `${current} 项目列表加载失败。${getErrorMessage(projectsResult.reason)}`
          : `项目列表加载失败。${getErrorMessage(projectsResult.reason)}`,
      );
    }

    if (referenceResult.status === 'fulfilled') {
      setReferenceData(referenceResult.value);
      setReferenceDataWarning(null);
    } else {
      setReferenceDataWarning(
        `${CLIENT_REFERENCE_DATA_WARNING}${getErrorMessage(
          referenceResult.reason,
        )}`,
      );
    }

    setDashboardLoading(false);
  }

  async function loadProjectsOnly(
    nextPage: number,
    nextFilters = filters,
  ) {
    setProjectsLoading(true);
    setError(null);

    try {
      const response = await listClientDashboardProjects({
        ...buildDashboardParams(nextFilters),
        page: nextPage,
        pageSize: CLIENT_DASHBOARD_PAGE_SIZE,
      });

      setProjects(response.items);
      setPage(response.page);
      setTotal(response.total);
    } catch (loadError) {
      setProjects([]);
      setTotal(0);
      setError(`项目列表加载失败。${getErrorMessage(loadError)}`);
    } finally {
      setProjectsLoading(false);
    }
  }

  function handleSearch() {
    void loadDashboard(1, filters);
  }

  function handleReset() {
    setFilters(EMPTY_CLIENT_DASHBOARD_FILTERS);
    void loadDashboard(1, EMPTY_CLIENT_DASHBOARD_FILTERS);
  }

  function handleRefresh() {
    void loadDashboard(page, filters, { reloadReference: true });
  }

  useEffect(() => {
    void loadDashboard(1, EMPTY_CLIENT_DASHBOARD_FILTERS, {
      reloadReference: true,
    });
  }, []);

  return (
    <ClientShell>
      <div className="page-title">
        <div>
          <div className="eyebrow">Client Dashboard</div>
          <h1>甲方监管看板</h1>
          <p>
            面向科技局监管项目评审进度、专家评分、合议结果、申诉处理和现场入口。
          </p>
          <div className="mt-2 text-xs text-slate-500">
            最近刷新时间：{formatDateTime(overview?.generatedAt)}
          </div>
        </div>
        <Button
          disabled={dashboardLoading || projectsLoading}
          onClick={handleRefresh}
          variant="secondary"
        >
          刷新
        </Button>
      </div>

      <ClientDashboardFilters
        filters={filters}
        finalLevelOptions={finalLevelOptions}
        loading={dashboardLoading || projectsLoading}
        onChange={setFilters}
        onReset={handleReset}
        onSubmit={handleSearch}
        referenceData={referenceData}
      />

      {referenceDataWarning ? <ErrorAlert message={referenceDataWarning} /> : null}
      <ErrorAlert message={error} />

      {dashboardLoading && !overview ? (
        <section className="panel">
          <LoadingState text="正在加载甲方监管看板..." />
        </section>
      ) : null}

      {!dashboardLoading && !overview ? (
        <section className="panel">
          <div className="panel-body">
            <ErrorAlert message={error ?? '甲方监管看板加载失败。'} />
            <Button onClick={handleRefresh} variant="secondary">
              重试
            </Button>
          </div>
        </section>
      ) : null}

      {overview ? (
        <div className="grid gap-6">
          {dashboardLoading ? (
            <div className="rounded-lg border border-cyan-100 bg-cyan-50/80 px-4 py-3 text-sm font-medium text-cyan-800">
              正在刷新看板数据...
            </div>
          ) : null}
          <ClientDashboardMetricCards overview={overview} />
          <ClientDashboardBreakdowns lookupMaps={lookupMaps} overview={overview} />
          {projectsLoading ? (
            <section className="panel">
              <LoadingState text="正在加载项目列表..." />
            </section>
          ) : (
            <ClientDashboardProjectTable
              items={projects}
              lookupMaps={lookupMaps}
              onPageChange={(nextPage) => void loadProjectsOnly(nextPage)}
              page={page}
              pageSize={CLIENT_DASHBOARD_PAGE_SIZE}
              total={total}
            />
          )}
        </div>
      ) : null}
    </ClientShell>
  );
}

function buildDashboardParams(
  filters: ClientDashboardFilterValues,
): QueryClientDashboardParams {
  return {
    batchId: cleanString(filters.batchId),
    projectTypeId: cleanString(filters.projectTypeId),
    statusId: cleanString(filters.statusId),
    departmentId: cleanString(filters.departmentId),
    disciplineId: cleanString(filters.disciplineId),
    reviewManagerId: cleanString(filters.reviewManagerId),
    reviewSchemeId: cleanString(filters.reviewSchemeId),
    finalLevel: cleanString(filters.finalLevel),
    progressStage: toProgressStage(filters.progressStage),
    hasMeetingUrl: toOptionalBoolean(filters.hasMeetingUrl),
    hasPendingAppeal: toOptionalBoolean(filters.hasPendingAppeal),
    keyword: cleanString(filters.keyword),
  };
}

function cleanString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function toOptionalBoolean(value: string): boolean | undefined {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function toProgressStage(
  value: string,
): ClientDashboardProgressStage | undefined {
  const stage = value as ClientDashboardProgressStage;

  return CLIENT_DASHBOARD_PROGRESS_STAGES.includes(stage) ? stage : undefined;
}

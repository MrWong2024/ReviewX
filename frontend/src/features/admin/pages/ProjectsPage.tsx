'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Pagination } from '@/src/components/ui/Pagination';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage } from '@/src/lib/api/errors';
import { displayValue, statusText } from '@/src/lib/format/value';
import {
  listBatches,
  listDictionaries,
  listOrganizations,
  listProjects,
  listReviewSchemes,
  listTreeDictionaries,
} from '../api';
import type {
  Batch,
  Dictionary,
  Organization,
  Project,
  ReviewScheme,
  TreeDictionary,
} from '../types';

type ProjectFilters = {
  batchId: string;
  keyword: string;
  projectTypeId: string;
  reviewManagerId: string;
  reviewSchemeId: string;
  statusId: string;
};

const EMPTY_FILTERS: ProjectFilters = {
  batchId: '',
  keyword: '',
  projectTypeId: '',
  reviewManagerId: '',
  reviewSchemeId: '',
  statusId: '',
};

export function ProjectsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  const [reviewSchemes, setReviewSchemes] = useState<ReviewScheme[]>([]);
  const [total, setTotal] = useState(0);
  const [treeDictionaries, setTreeDictionaries] = useState<TreeDictionary[]>([]);

  const batchNameById = useMemo(
    () => new Map(batches.map((item) => [item.id, item.name])),
    [batches],
  );
  const dictionaryNameById = useMemo(
    () => new Map(dictionaries.map((item) => [item.id, item.name])),
    [dictionaries],
  );
  const organizationNameById = useMemo(
    () => new Map(organizations.map((item) => [item.id, item.name])),
    [organizations],
  );
  const schemeNameById = useMemo(
    () => new Map(reviewSchemes.map((item) => [item.id, item.name])),
    [reviewSchemes],
  );
  const treeNameById = useMemo(
    () => new Map(treeDictionaries.map((item) => [item.id, item.name])),
    [treeDictionaries],
  );

  const projectTypes = treeDictionaries.filter(
    (item) => item.treeType === 'project_type',
  );
  const projectStatuses = dictionaries.filter(
    (item) => item.dictType === 'project_status',
  );

  async function loadOptions() {
    try {
      const [
        batchResponse,
        dictionaryResponse,
        organizationResponse,
        projectTypeResponse,
        schemeResponse,
      ] = await Promise.all([
        listBatches(),
        listDictionaries({ dictType: 'project_status' }),
        listOrganizations({ pageSize: 1000 }),
        listTreeDictionaries({ treeType: 'project_type' }),
        listReviewSchemes(),
      ]);

      setBatches(batchResponse.items);
      setDictionaries(dictionaryResponse);
      setOrganizations(organizationResponse.items);
      setTreeDictionaries(projectTypeResponse);
      setReviewSchemes(schemeResponse);
    } catch {
      setBatches([]);
      setDictionaries([]);
      setOrganizations([]);
      setTreeDictionaries([]);
      setReviewSchemes([]);
    }
  }

  async function loadData(nextPage = page) {
    setLoading(true);
    setError(null);

    try {
      const response = await listProjects({
        batchId: filters.batchId,
        keyword: filters.keyword.trim(),
        page: nextPage,
        pageSize,
        projectTypeId: filters.projectTypeId,
        reviewManagerId: filters.reviewManagerId.trim(),
        reviewSchemeId: filters.reviewSchemeId,
        statusId: filters.statusId,
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
    loadOptions();
    loadData(1);
  }, []);

  const columns: DataColumn<Project>[] = [
    { key: 'projectNo', render: (item) => item.projectNo, title: '项目编号' },
    { key: 'name', render: (item) => item.name, title: '项目名称' },
    {
      key: 'batchId',
      render: (item) => batchNameById.get(item.batchId) ?? item.batchId,
      title: '批次',
    },
    {
      key: 'projectTypeId',
      render: (item) =>
        item.projectTypeId
          ? treeNameById.get(item.projectTypeId) ?? item.projectTypeId
          : '-',
      title: '项目类型',
    },
    {
      key: 'statusId',
      render: (item) =>
        item.statusId
          ? dictionaryNameById.get(item.statusId) ?? item.statusId
          : '-',
      title: '状态',
    },
    {
      key: 'ownerUserId',
      render: (item) => displayValue(item.ownerUserId),
      title: '项目负责人',
    },
    {
      key: 'leadOrganizationId',
      render: (item) =>
        item.leadOrganizationId
          ? organizationNameById.get(item.leadOrganizationId) ??
            item.leadOrganizationId
          : '-',
      title: '承担单位',
    },
    {
      key: 'reviewManagerId',
      render: (item) => displayValue(item.reviewManagerId),
      title: '评审负责人',
    },
    {
      key: 'reviewSchemeId',
      render: (item) =>
        item.reviewSchemeId
          ? schemeNameById.get(item.reviewSchemeId) ?? item.reviewSchemeId
          : '-',
      title: '评审方案',
    },
    {
      key: 'finalLevel',
      render: (item) => displayValue(item.finalLevel),
      title: '最终等级',
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
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>项目只读列表</h1>
          <p>查看后端项目数据。本阶段不提供新增、编辑、导入和分配操作。</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            id="project-keyword"
            label="关键词"
            onChange={(event) =>
              setFilters({ ...filters, keyword: event.target.value })
            }
            placeholder="项目编号或名称"
            value={filters.keyword}
          />
          <Select
            id="project-batch"
            label="批次"
            onChange={(event) =>
              setFilters({ ...filters, batchId: event.target.value })
            }
            value={filters.batchId}
          >
            <option value="">全部</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-type"
            label="项目类型"
            onChange={(event) =>
              setFilters({ ...filters, projectTypeId: event.target.value })
            }
            value={filters.projectTypeId}
          >
            <option value="">全部</option>
            {projectTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-status"
            label="项目状态"
            onChange={(event) =>
              setFilters({ ...filters, statusId: event.target.value })
            }
            value={filters.statusId}
          >
            <option value="">全部</option>
            {projectStatuses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            id="project-scheme"
            label="评审方案"
            onChange={(event) =>
              setFilters({ ...filters, reviewSchemeId: event.target.value })
            }
            value={filters.reviewSchemeId}
          >
            <option value="">全部</option>
            {reviewSchemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </Select>
          <Input
            id="project-review-manager"
            label="评审负责人 ID"
            onChange={(event) =>
              setFilters({ ...filters, reviewManagerId: event.target.value })
            }
            placeholder="可选 ObjectId"
            value={filters.reviewManagerId}
          />
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
            <DataTable
              columns={columns}
              emptyText="暂无项目数据"
              getRowKey={(item) => item.id}
              items={items}
            />
            <Pagination
              onPageChange={(nextPage) => loadData(nextPage)}
              page={page}
              pageSize={pageSize}
              total={total}
            />
          </>
        )}
      </section>
    </>
  );
}

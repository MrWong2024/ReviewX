'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { Button } from '@/src/components/ui/Button';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { DataTable, type DataColumn } from '@/src/components/ui/DataTable';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import { formatDateTime } from '@/src/lib/format/date';
import { displayValue } from '@/src/lib/format/value';
import {
  formatAliasList,
  getFieldActiveLabel,
  getFieldActiveTone,
  getFieldConfiguredLabel,
  getFieldConfiguredTone,
  getFieldFallbackHint,
  getFieldRequiredLabel,
  getFieldRequiredTone,
  getProjectImportStandardFieldFallbackLabel,
} from '@/src/lib/labels/project-import-field-mapping-labels';
import {
  deleteProjectImportFieldMapping,
  listProjectImportFieldMappings,
  resetProjectImportFieldMappingDefaults,
  updateProjectImportFieldMapping,
  upsertProjectImportFieldMapping,
} from '../api';
import {
  AliasChips,
} from '../components/project-import-field-mappings/AliasChips';
import {
  FieldMappingEditorModal,
} from '../components/project-import-field-mappings/FieldMappingEditorModal';
import type {
  ListProjectImportFieldMappingsParams,
  ProjectImportFieldMappingView,
  UpsertProjectImportFieldMappingInput,
} from '../types';

type FieldMappingFilters = {
  isActive: boolean | '';
  keyword: string;
};

type ConfirmAction =
  | { item: ProjectImportFieldMappingView; type: 'delete' }
  | { item: ProjectImportFieldMappingView; type: 'reset' }
  | {
      item: ProjectImportFieldMappingView;
      nextActive: boolean;
      type: 'toggle';
    };

const EMPTY_FILTERS: FieldMappingFilters = {
  isActive: '',
  keyword: '',
};

export function ProjectImportFieldMappingsPage() {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FieldMappingFilters>(EMPTY_FILTERS);
  const [items, setItems] = useState<ProjectImportFieldMappingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMapping, setSelectedMapping] =
    useState<ProjectImportFieldMappingView | null>(null);

  async function loadMappings(
    nextFilters: FieldMappingFilters = filters,
    options: { silent?: boolean } = {},
  ) {
    if (!options.silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await listProjectImportFieldMappings(
        toListParams(nextFilters),
      );
      setItems(response.items);
    } catch (loadError) {
      setError(getFieldMappingErrorMessage(loadError, '字段映射列表加载失败'));
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadMappings(EMPTY_FILTERS);
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadMappings(filters);
  }

  async function handleResetFilters() {
    setFilters(EMPTY_FILTERS);
    await loadMappings(EMPTY_FILTERS);
  }

  function openEditor(item: ProjectImportFieldMappingView) {
    setSelectedMapping(item);
    setModalError(null);
  }

  async function handleSave(input: UpsertProjectImportFieldMappingInput) {
    if (!selectedMapping) {
      return;
    }

    setSaving(true);
    setModalError(null);
    setNotice(null);

    try {
      await upsertProjectImportFieldMapping(
        selectedMapping.standardField,
        input,
      );
      setSelectedMapping(null);
      setNotice('保存成功，字段映射配置已刷新。');
      await loadMappings(filters, { silent: true });
    } catch (saveError) {
      setModalError(getFieldMappingErrorMessage(saveError, '保存配置失败'));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) {
      return;
    }

    setOperationLoading(true);
    setError(null);
    setNotice(null);

    try {
      if (confirmAction.type === 'toggle') {
        await updateProjectImportFieldMapping(confirmAction.item.standardField, {
          isActive: confirmAction.nextActive,
        });
        setNotice(
          confirmAction.nextActive
            ? '已启用，导入时将优先使用自定义别名。'
            : '已停用，当前回退默认别名。',
        );
      } else if (confirmAction.type === 'delete') {
        await deleteProjectImportFieldMapping(confirmAction.item.standardField);
        setNotice('已删除自定义配置，当前回退默认别名。');
      } else {
        await resetProjectImportFieldMappingDefaults(
          confirmAction.item.standardField,
        );
        setNotice('已重置为默认别名。');
      }

      setConfirmAction(null);
      await loadMappings(filters, { silent: true });
    } catch (actionError) {
      setError(getFieldMappingErrorMessage(actionError, '操作失败'));
    } finally {
      setOperationLoading(false);
    }
  }

  const columns: DataColumn<ProjectImportFieldMappingView>[] = [
    {
      key: 'standardField',
      render: (item) => (
        <span className="code break-all">{item.standardField}</span>
      ),
      title: '标准字段',
    },
    {
      key: 'label',
      render: (item) => (
        <span className="font-semibold text-slate-900">
          {item.label ||
            getProjectImportStandardFieldFallbackLabel(item.standardField)}
        </span>
      ),
      title: '字段名称',
    },
    {
      key: 'required',
      render: (item) => (
        <Badge tone={getFieldRequiredTone(item.required)}>
          {getFieldRequiredLabel(item.required)}
        </Badge>
      ),
      title: '必填',
    },
    {
      key: 'configured',
      render: (item) => (
        <Badge tone={getFieldConfiguredTone(item.isConfigured)}>
          {getFieldConfiguredLabel(item.isConfigured)}
        </Badge>
      ),
      title: '配置状态',
    },
    {
      key: 'active',
      render: (item) => (
        <div className="grid gap-1">
          <Badge tone={getFieldActiveTone(item.isConfigured, item.isActive)}>
            {getFieldActiveLabel(item.isConfigured, item.isActive)}
          </Badge>
          {!item.isConfigured || !item.isActive ? (
            <span className="max-w-40 text-xs leading-5 text-slate-500">
              {getFieldFallbackHint(item.isConfigured, item.isActive)}
            </span>
          ) : null}
        </div>
      ),
      title: '启用状态',
    },
    {
      key: 'aliases',
      render: (item) => (
        <div title={formatAliasList(item.aliases, '未配置')}>
          <AliasChips aliases={item.aliases} emptyText="未配置" />
        </div>
      ),
      title: '自定义别名',
    },
    {
      key: 'defaultAliases',
      render: (item) => (
        <div title={formatAliasList(item.defaultAliases)}>
          <AliasChips aliases={item.defaultAliases} tone="muted" />
        </div>
      ),
      title: '默认别名',
    },
    {
      key: 'effectiveAliases',
      render: (item) => (
        <div className="grid gap-1" title={formatAliasList(item.effectiveAliases)}>
          <AliasChips aliases={item.effectiveAliases} tone="effective" />
          <span className="max-w-48 text-xs leading-5 text-slate-500">
            {getFieldFallbackHint(item.isConfigured, item.isActive)}
          </span>
        </div>
      ),
      title: '最终生效别名',
    },
    {
      key: 'description',
      render: (item) => (
        <span className="block max-w-52 whitespace-pre-wrap text-sm leading-5">
          {displayValue(item.description)}
        </span>
      ),
      title: '备注',
    },
    {
      key: 'updatedAt',
      render: (item) => formatDateTime(item.updatedAt),
      title: '更新时间',
    },
    {
      key: 'actions',
      render: (item) => (
        <div className="table-actions min-w-48">
          <Button onClick={() => openEditor(item)} size="sm" variant="ghost">
            编辑
          </Button>
          {item.isConfigured ? (
            <Button
              disabled={operationLoading}
              onClick={() =>
                setConfirmAction({
                  item,
                  nextActive: !item.isActive,
                  type: 'toggle',
                })
              }
              size="sm"
              variant={item.isActive ? 'secondary' : 'primary'}
            >
              {item.isActive ? '停用' : '启用'}
            </Button>
          ) : null}
          <Button
            disabled={operationLoading}
            onClick={() => setConfirmAction({ item, type: 'reset' })}
            size="sm"
            variant="secondary"
          >
            重置默认
          </Button>
          {item.isConfigured ? (
            <Button
              disabled={operationLoading}
              onClick={() => setConfirmAction({ item, type: 'delete' })}
              size="sm"
              variant="danger"
            >
              删除配置
            </Button>
          ) : null}
        </div>
      ),
      title: '操作',
    },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <div className="eyebrow">Excel Field Mapping</div>
          <h1>Excel 字段映射</h1>
          <p>
            维护 Excel 表头别名与平台标准字段的对应关系。上传项目 Excel 时，系统优先使用启用的自定义别名；未配置或停用时回退内置默认别名。
          </p>
        </div>
        <Button
          disabled={loading}
          onClick={() => {
            void loadMappings(filters);
          }}
          variant="secondary"
        >
          刷新
        </Button>
      </div>

      <section className="panel mb-5">
        <div className="panel-body">
          <div className="grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-2 xl:grid-cols-5">
            <FallbackNote text="标准字段由系统固定，管理员不能新增、删除或重命名。" />
            <FallbackNote text="自定义别名用于提高 Excel 表头自动识别率。" />
            <FallbackNote text="停用配置不是禁用字段，而是回退默认内置别名。" />
            <FallbackNote text="删除配置只删除自定义配置，字段仍使用默认别名。" />
            <FallbackNote text="不建议把同一个别名配置到多个字段，后端会校验冲突。" />
          </div>
        </div>
      </section>

      {notice ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
          {notice}
        </div>
      ) : null}

      <form className="toolbar" onSubmit={handleSearch}>
        <div className="toolbar-left">
          <Input
            id="field-mapping-keyword"
            label="关键词"
            onChange={(event) =>
              setFilters({ ...filters, keyword: event.target.value })
            }
            placeholder="搜索标准字段、字段名称或别名"
            value={filters.keyword}
          />
          <Select
            id="field-mapping-active-filter"
            label="启用状态"
            onChange={(event) =>
              setFilters({
                ...filters,
                isActive: parseActiveFilterValue(event.target.value),
              })
            }
            value={String(filters.isActive)}
          >
            <option value="">全部</option>
            <option value="true">启用</option>
            <option value="false">停用</option>
          </Select>
          <Button disabled={loading} type="submit" variant="secondary">
            查询
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              void handleResetFilters();
            }}
            variant="ghost"
          >
            重置
          </Button>
        </div>
      </form>

      <ErrorAlert message={error} />

      <section className="panel">
        {loading ? (
          <LoadingState />
        ) : (
          <DataTable
            columns={columns}
            emptyText="暂无字段映射配置"
            getRowKey={(item) => `${item.standardField}-${item.id ?? 'default'}`}
            items={items}
          />
        )}
      </section>

      <FieldMappingEditorModal
        error={modalError}
        mapping={selectedMapping}
        onClose={() => setSelectedMapping(null)}
        onSave={handleSave}
        open={Boolean(selectedMapping)}
        saving={saving}
      />

      <ConfirmDialog
        confirmLabel={getConfirmLabel(confirmAction)}
        description={getConfirmDescription(confirmAction)}
        loading={operationLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          void handleConfirmAction();
        }}
        open={Boolean(confirmAction)}
        title={getConfirmTitle(confirmAction)}
      />
    </>
  );
}

function FallbackNote({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2">
      {text}
    </div>
  );
}

function toListParams(
  filters: FieldMappingFilters,
): ListProjectImportFieldMappingsParams {
  return {
    isActive: filters.isActive,
    keyword: filters.keyword.trim(),
  };
}

function parseActiveFilterValue(value: string): boolean | '' {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return '';
}

function getConfirmTitle(action: ConfirmAction | null): string {
  if (action?.type === 'delete') {
    return '删除自定义配置';
  }

  if (action?.type === 'reset') {
    return '重置为默认别名';
  }

  if (action?.type === 'toggle') {
    return action.nextActive ? '启用字段映射配置' : '停用字段映射配置';
  }

  return '确认操作';
}

function getConfirmLabel(action: ConfirmAction | null): string {
  if (action?.type === 'delete') {
    return '删除配置';
  }

  if (action?.type === 'reset') {
    return '重置默认';
  }

  if (action?.type === 'toggle') {
    return action.nextActive ? '启用' : '停用';
  }

  return '确认';
}

function getConfirmDescription(action: ConfirmAction | null): string {
  if (!action) {
    return '';
  }

  const label =
    action.item.label ||
    getProjectImportStandardFieldFallbackLabel(action.item.standardField);

  if (action.type === 'delete') {
    return `确认删除「${label}」的自定义配置？删除后不会删除标准字段，只会删除自定义配置，并回退使用系统默认别名。`;
  }

  if (action.type === 'reset') {
    return `确认将「${label}」重置为默认别名？重置默认会创建或覆盖自定义配置，使自定义别名等于系统默认别名，并启用该配置；如需回到未配置状态，请使用删除配置。`;
  }

  if (action.nextActive) {
    return `确认启用「${label}」的自定义配置？启用后系统会优先使用自定义别名识别 Excel 表头。`;
  }

  return `确认停用「${label}」的自定义配置？停用后不会禁用该标准字段，而是回退使用内置默认别名继续识别 Excel 表头。`;
}

function getFieldMappingErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.status === 400) {
      return `${fallback}：提交内容不符合要求，请检查字段、别名或备注。${appendOriginalMessage(error.message)}`;
    }

    if (error.status === 403) {
      return `${fallback}：当前账号没有管理员权限。`;
    }

    if (error.status === 404) {
      return `${fallback}：配置已不存在，请刷新后重试。${appendOriginalMessage(error.message)}`;
    }

    if (error.status === 409) {
      return `${fallback}：字段别名已被其他标准字段使用，请更换别名。${appendOriginalMessage(error.message)}`;
    }

    if (error.status >= 500) {
      return `${fallback}：服务异常，请稍后重试。${appendOriginalMessage(error.message)}`;
    }

    return `${fallback}：${getErrorMessage(error)}`;
  }

  if (error instanceof TypeError) {
    return `${fallback}：无法连接服务，请确认后端已启动。`;
  }

  return `${fallback}：${getErrorMessage(error)}`;
}

function appendOriginalMessage(message: string): string {
  return message ? `（后端提示：${message}）` : '';
}

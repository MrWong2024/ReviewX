'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/src/components/feedback/Badge';
import { ErrorAlert } from '@/src/components/feedback/ErrorAlert';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import {
  getFieldRequiredLabel,
  getFieldRequiredTone,
  getProjectImportStandardFieldFallbackLabel,
} from '@/src/lib/labels/project-import-field-mapping-labels';
import type {
  ProjectImportFieldMappingView,
  UpsertProjectImportFieldMappingInput,
} from '../../types';
import { AliasChips } from './AliasChips';

type FieldMappingEditorModalProps = {
  error: string | null;
  mapping: ProjectImportFieldMappingView | null;
  onClose: () => void;
  onSave: (input: UpsertProjectImportFieldMappingInput) => Promise<void>;
  open: boolean;
  saving: boolean;
};

type AliasParseResult =
  | { aliases: string[]; ok: true }
  | { message: string; ok: false };

export function FieldMappingEditorModal({
  error,
  mapping,
  onClose,
  onSave,
  open,
  saving,
}: FieldMappingEditorModalProps) {
  const [aliasesText, setAliasesText] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isActiveValue, setIsActiveValue] = useState('true');

  useEffect(() => {
    if (!mapping || !open) {
      return;
    }

    setAliasesText(mapping.aliases.join('\n'));
    setDescription(mapping.description ?? '');
    setFormError(null);
    setIsActiveValue(mapping.isActive ? 'true' : 'false');
  }, [mapping, open]);

  if (!mapping) {
    return null;
  }

  const label =
    mapping.label ||
    getProjectImportStandardFieldFallbackLabel(mapping.standardField);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsedAliases = parseAliases(aliasesText);

    if (!parsedAliases.ok) {
      setFormError(parsedAliases.message);
      return;
    }

    await onSave({
      aliases: parsedAliases.aliases,
      description: description.trim() || undefined,
      isActive: isActiveValue === 'true',
    });
  }

  return (
    <Modal
      footer={
        <>
          <Button disabled={saving} onClick={onClose} variant="secondary">
            取消
          </Button>
          <Button disabled={saving} form="field-mapping-editor" type="submit" variant="primary">
            {saving ? '保存中...' : '保存'}
          </Button>
        </>
      }
      onClose={onClose}
      open={open}
      title={`编辑字段映射：${label}`}
    >
      <form className="form-stack" id="field-mapping-editor" onSubmit={handleSubmit}>
        <div className="grid gap-3 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 md:grid-cols-3">
          <ReadonlyInfo label="标准字段" value={mapping.standardField} />
          <ReadonlyInfo label="字段名称" value={label} />
          <div>
            <div className="mb-1 text-xs font-bold text-slate-500">是否必填</div>
            <Badge tone={getFieldRequiredTone(mapping.required)}>
              {getFieldRequiredLabel(mapping.required)}
            </Badge>
          </div>
        </div>

        <div className="form-section">
          <div className="mb-2 text-sm font-bold text-slate-800">
            默认内置别名
          </div>
          <AliasChips aliases={mapping.defaultAliases} tone="muted" />
          <p className="mt-3 text-xs leading-5 text-slate-500">
            未配置、停用或删除自定义配置时，系统会回退使用这些默认别名识别 Excel 表头。
          </p>
        </div>

        <Textarea
          description="一行一个别名。保存前会自动去除首尾空格和空行；同一字段内别名不能重复。"
          disabled={saving}
          error={formError ?? undefined}
          id="field-mapping-aliases"
          label="自定义别名"
          onChange={(event) => setAliasesText(event.target.value)}
          placeholder="例如：项目唯一编号"
          rows={7}
          value={aliasesText}
        />

        <div className="grid-2">
          <Select
            disabled={saving}
            id="field-mapping-active"
            label="启用配置"
            onChange={(event) => setIsActiveValue(event.target.value)}
            value={isActiveValue}
          >
            <option value="true">启用</option>
            <option value="false">停用并回退默认别名</option>
          </Select>
          <Textarea
            disabled={saving}
            id="field-mapping-description"
            label="备注"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="记录配置来源或适用 Excel 表头"
            rows={4}
            value={description}
          />
        </div>

        <ErrorAlert message={error} />
      </form>
    </Modal>
  );
}

function ReadonlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-bold text-slate-500">{label}</div>
      <div className="break-all text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function parseAliases(value: string): AliasParseResult {
  const aliases = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (aliases.length === 0) {
    return { message: '请至少填写一个字段别名。', ok: false };
  }

  const seen = new Set<string>();
  const duplicated = new Set<string>();

  aliases.forEach((alias) => {
    if (seen.has(alias)) {
      duplicated.add(alias);
      return;
    }

    seen.add(alias);
  });

  if (duplicated.size > 0) {
    return {
      message: `存在重复别名，请检查：${Array.from(duplicated).join('、')}`,
      ok: false,
    };
  }

  return { aliases: Array.from(seen), ok: true };
}

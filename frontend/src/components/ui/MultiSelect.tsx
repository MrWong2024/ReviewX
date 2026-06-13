'use client';

import { useMemo, useState } from 'react';
import { cx } from '@/src/lib/styles';
import { FormField } from './FormField';

export type MultiSelectOption = {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
};

type MultiSelectProps = {
  description?: string;
  disabled?: boolean;
  emptyText?: string;
  error?: string;
  id?: string;
  label?: string;
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  value: string[];
  options: MultiSelectOption[];
};

export function MultiSelect({
  description,
  disabled = false,
  emptyText = '暂无可选项',
  error,
  id,
  label,
  onChange,
  options,
  placeholder = '请选择',
  searchable = true,
  value,
}: MultiSelectProps) {
  const [keyword, setKeyword] = useState('');
  const selected = useMemo(() => new Set(value), [value]);
  const selectedOptions = options.filter((option) => selected.has(option.value));
  const filteredOptions = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();

    if (!trimmed) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.description ?? ''}`
        .toLowerCase()
        .includes(trimmed),
    );
  }, [keyword, options]);

  function toggleOption(optionValue: string) {
    if (disabled) {
      return;
    }

    if (selected.has(optionValue)) {
      onChange(value.filter((item) => item !== optionValue));
      return;
    }

    onChange([...value, optionValue]);
  }

  return (
    <FormField description={description} error={error} id={id} label={label}>
      <div
        className={cx(
          'rounded-lg border border-slate-200 bg-white/90 shadow-inner shadow-slate-100/70 transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100',
          error && 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100',
          disabled && 'bg-slate-100 text-slate-500',
        )}
      >
        <div className="flex min-h-10 flex-wrap items-center gap-1.5 border-b border-slate-100 px-3 py-2">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                className="inline-flex max-w-full items-center rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 ring-1 ring-cyan-100"
                key={option.value}
              >
                {option.label}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">{placeholder}</span>
          )}
        </div>
        {searchable && options.length > 0 ? (
          <div className="border-b border-slate-100 p-2">
            <input
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={disabled}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索选项"
              type="search"
              value={keyword}
            />
          </div>
        ) : null}
        <div className="max-h-52 overflow-y-auto p-2">
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-3 text-sm text-slate-400">{emptyText}</div>
          ) : (
            <div className="grid gap-1">
              {filteredOptions.map((option) => (
                <label
                  className={cx(
                    'flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm transition hover:bg-cyan-50/60',
                    (disabled || option.disabled) &&
                      'cursor-not-allowed opacity-60 hover:bg-transparent',
                  )}
                  key={option.value}
                >
                  <input
                    checked={selected.has(option.value)}
                    className="mt-0.5 h-4 w-4 accent-cyan-700"
                    disabled={disabled || option.disabled}
                    onChange={() => toggleOption(option.value)}
                    type="checkbox"
                  />
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-700">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </FormField>
  );
}

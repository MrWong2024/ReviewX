export function displayValue(value?: null | number | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }

  return String(value);
}

export function statusText(isActive: boolean): string {
  return isActive ? '启用' : '停用';
}

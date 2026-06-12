export function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function emptyToNull(value: string): string | null | undefined {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function toOptionalNumber(value: string): number | null | undefined {
  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

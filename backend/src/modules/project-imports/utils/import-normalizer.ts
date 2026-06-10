import { ProjectImportNormalizedRecord } from '../types/project-import-records';

const MULTI_VALUE_SEPARATOR = /[,，、;；\r\n]+/;

export function normalizeCell(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value)
      .replace(/\u3000/g, ' ')
      .trim();
  }

  return '';
}

export function splitNameList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(MULTI_VALUE_SEPARATOR)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function parseOptionalFunding(value: string | undefined): {
  value: number | null;
  isInvalid: boolean;
} {
  if (!value) {
    return { value: null, isInvalid: false };
  }

  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: null, isInvalid: true };
  }

  return { value: parsed, isInvalid: false };
}

export function normalizeRawRecord(
  raw: Partial<Record<string, string>>,
): ProjectImportNormalizedRecord & {
  invalidFundingFields: string[];
} {
  const totalFunding = parseOptionalFunding(raw.totalFunding);
  const allocatedFunding = parseOptionalFunding(raw.allocatedFunding);
  const invalidFundingFields: string[] = [];

  if (totalFunding.isInvalid) {
    invalidFundingFields.push('totalFunding');
  }

  if (allocatedFunding.isInvalid) {
    invalidFundingFields.push('allocatedFunding');
  }

  return {
    projectNo: raw.projectNo,
    name: raw.name,
    projectTypeName: raw.projectTypeName,
    ownerName: raw.ownerName,
    ownerPhone: raw.ownerPhone,
    leadOrganizationName: raw.leadOrganizationName,
    totalFunding: totalFunding.value,
    allocatedFunding: allocatedFunding.value,
    disciplineNames: splitNameList(raw.disciplineName),
    departmentName: raw.departmentName,
    cooperationOrganizationNames: splitNameList(
      raw.cooperationOrganizationNames,
    ),
    statusName: raw.statusName,
    organizationContactName: raw.organizationContactName,
    organizationContactPhone: raw.organizationContactPhone,
    invalidFundingFields,
  };
}

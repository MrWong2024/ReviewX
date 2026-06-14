import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import {
  buildHeaderAliasMap,
  PROJECT_IMPORT_FIELD_ALIASES,
  PROJECT_IMPORT_REQUIRED_FIELDS,
  ProjectImportAliasMap,
  ProjectImportFieldMapping,
  ProjectImportStandardField,
  normalizeProjectImportFieldAlias,
} from '../constants/project-import-field-map';
import { normalizeCell, normalizeRawRecord } from './import-normalizer';

export type ParsedProjectImportRow = {
  rowNumber: number;
  raw: Partial<Record<ProjectImportStandardField, string>>;
  normalized: ReturnType<typeof normalizeRawRecord>;
};

export type ParsedProjectImportWorkbook = {
  fieldMapping: ProjectImportFieldMapping;
  rows: ParsedProjectImportRow[];
};

export function parseProjectImportWorkbook(
  buffer: Buffer,
  aliasMap: ProjectImportAliasMap = PROJECT_IMPORT_FIELD_ALIASES,
): ParsedProjectImportWorkbook {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  } catch {
    throw new BadRequestException('Invalid Excel file');
  }

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new BadRequestException('Excel file has no worksheet');
  }

  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    throw new BadRequestException('Excel worksheet not found');
  }

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (matrix.length === 0) {
    throw new BadRequestException('Excel file has no header row');
  }

  const headerRow = toRow(matrix[0]);
  const fieldMapping = resolveFieldMapping(headerRow, aliasMap);
  const missingFields = PROJECT_IMPORT_REQUIRED_FIELDS.filter(
    (field) => !fieldMapping[field],
  );

  if (missingFields.length > 0) {
    throw new BadRequestException(
      `Missing required headers: ${missingFields.join(', ')}`,
    );
  }

  const rows = matrix
    .slice(1)
    .map((row, index) =>
      toParsedRow(toRow(row), index + 2, headerRow, fieldMapping),
    )
    .filter((row): row is ParsedProjectImportRow => row !== null);

  if (rows.length === 0) {
    throw new BadRequestException('Excel file has no valid data rows');
  }

  return { fieldMapping, rows };
}

function resolveFieldMapping(
  headers: unknown[],
  aliasMap: ProjectImportAliasMap,
): ProjectImportFieldMapping {
  const headerAliasMap = buildHeaderAliasMap(aliasMap);
  const mapping: ProjectImportFieldMapping = {};

  for (const header of headers) {
    const headerText = normalizeCell(header);
    const field = headerAliasMap.get(
      normalizeProjectImportFieldAlias(headerText),
    );

    if (field && !mapping[field]) {
      mapping[field] = headerText;
    }
  }

  return mapping;
}

function toParsedRow(
  values: unknown[],
  rowNumber: number,
  headers: unknown[],
  fieldMapping: ProjectImportFieldMapping,
): ParsedProjectImportRow | null {
  const raw: Partial<Record<ProjectImportStandardField, string>> = {};

  for (const [field, header] of Object.entries(fieldMapping) as Array<
    [ProjectImportStandardField, string]
  >) {
    const columnIndex = headers.findIndex(
      (candidate) => normalizeCell(candidate) === header,
    );

    if (columnIndex >= 0) {
      raw[field] = normalizeCell(values[columnIndex]);
    }
  }

  const hasAnyValue = Object.values(raw).some((value) => Boolean(value));

  if (!hasAnyValue) {
    return null;
  }

  return {
    rowNumber,
    raw,
    normalized: normalizeRawRecord(raw),
  };
}

function toRow(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

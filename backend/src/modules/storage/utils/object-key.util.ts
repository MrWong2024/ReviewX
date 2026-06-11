import { randomUUID } from 'node:crypto';
import { extname, basename } from 'node:path';

export type BuildObjectKeyInput = {
  objectPrefix: string;
  projectId: string;
  materialTypeCode?: string;
  materialTypeId: string;
  safeFilename: string;
  date?: Date;
};

const UNSAFE_FILENAME_CHARS = /[^a-zA-Z0-9._-]+/g;

export function sanitizeFilename(originalFilename: string): string {
  const baseName = basename(originalFilename).replace(/\\/g, '/');
  const extension = extname(baseName).toLowerCase();
  const rawName = extension
    ? baseName.slice(0, Math.max(0, baseName.length - extension.length))
    : baseName;
  const safeName =
    rawName
      .normalize('NFKD')
      .replace(UNSAFE_FILENAME_CHARS, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120) || 'file';

  return `${safeName}${extension}`;
}

export function getLowercaseExtension(filename: string): string {
  return extname(filename).toLowerCase().replace(/^\./, '');
}

export function buildObjectKey(input: BuildObjectKeyInput): string {
  const date = input.date ?? new Date();
  const year = String(date.getUTCFullYear());
  const prefix = trimSlashes(input.objectPrefix || 'reviewx');
  const typeSegment = sanitizeObjectKeySegment(
    input.materialTypeCode || input.materialTypeId,
  );

  return [
    prefix,
    'projects',
    input.projectId,
    'materials',
    typeSegment,
    year,
    `${randomUUID()}-${input.safeFilename}`,
  ].join('/');
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '');
}

function sanitizeObjectKeySegment(value: string): string {
  return (
    value
      .trim()
      .normalize('NFKD')
      .replace(UNSAFE_FILENAME_CHARS, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'material_type'
  );
}

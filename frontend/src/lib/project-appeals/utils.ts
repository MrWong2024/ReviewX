import { getErrorMessage, isApiError } from '@/src/lib/api/errors';
import type {
  ProjectAppeal,
  ProjectAppealAttachmentDownloadUrlResponse,
  ProjectAppealStatus,
  ProjectAppealStatusView,
  ProjectLevelChangeSource,
  ReviewLevelOption,
} from './types';

export const PROJECT_APPEAL_MAX_COUNT = 3;
export const PROJECT_APPEAL_REASON_MAX_LENGTH = 10000;
export const PROJECT_APPEAL_HANDLING_OPINION_MAX_LENGTH = 10000;
export const PROJECT_APPEAL_ATTACHMENT_REMARK_MAX_LENGTH = 1000;
export const MAX_PROJECT_APPEAL_ATTACHMENT_FILES = 20;
export const MAX_PROJECT_APPEAL_ATTACHMENT_FILE_SIZE_BYTES =
  500 * 1024 * 1024;

export const FALLBACK_REVIEW_LEVEL_OPTIONS: ReviewLevelOption[] = [
  createFallbackReviewLevel('A'),
  createFallbackReviewLevel('B'),
  createFallbackReviewLevel('C'),
  createFallbackReviewLevel('D'),
];

const allowedAppealAttachmentExtensions = new Set([
  'pdf',
  'ppt',
  'pptx',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'jpg',
  'jpeg',
  'png',
  'zip',
  'rar',
  '7z',
  'txt',
  'csv',
]);

const blockedAppealAttachmentExtensions = new Set([
  'exe',
  'bat',
  'cmd',
  'sh',
  'js',
  'mjs',
  'cjs',
  'php',
  'jsp',
  'asp',
  'aspx',
  'dll',
  'so',
  'ps1',
]);

export function getAppealStatusView(
  status: ProjectAppealStatus | string,
): ProjectAppealStatusView {
  switch (status) {
    case 'submitted':
      return {
        description: '项目负责人已提交，等待处理',
        label: '已提交 / 待处理',
        tone: 'warning',
      };
    case 'processing':
      return {
        description: '申诉正在处理中',
        label: '处理中',
        tone: 'primary',
      };
    case 'accepted':
      return {
        description: '申诉有效，已接受处理',
        label: '申诉有效 / 已接受',
        tone: 'success',
      };
    case 'rejected':
      return {
        description: '申诉已驳回',
        label: '申诉驳回',
        tone: 'danger',
      };
    case 'canceled':
      return {
        description: '申诉已取消',
        label: '已取消',
        tone: 'muted',
      };
    default:
      return {
        description: '无法识别的申诉状态',
        label: status || '未知状态',
        tone: 'muted',
      };
  }
}

export function isAppealPending(
  appealOrStatus: Pick<ProjectAppeal, 'status'> | ProjectAppealStatus | string,
): boolean {
  const status =
    typeof appealOrStatus === 'string' ? appealOrStatus : appealOrStatus.status;

  return status === 'submitted' || status === 'processing';
}

export function canOwnerMutateAppealAttachments(
  appealOrStatus: Pick<ProjectAppeal, 'status'> | ProjectAppealStatus | string,
): boolean {
  const status =
    typeof appealOrStatus === 'string' ? appealOrStatus : appealOrStatus.status;

  return status === 'submitted';
}

export function canHandleAppeal(
  appealOrStatus: Pick<ProjectAppeal, 'status'> | ProjectAppealStatus | string,
): boolean {
  return isAppealPending(appealOrStatus);
}

export function formatLevelChangeSource(
  source: ProjectLevelChangeSource | string,
): string {
  switch (source) {
    case 'consensus_confirm':
      return '合议确认';
    case 'appeal_handling':
      return '申诉处理';
    case 'admin_correction':
      return '管理员更正';
    default:
      return source || '-';
  }
}

export function resolveAppealAttachmentDownloadUrl(
  response: ProjectAppealAttachmentDownloadUrlResponse,
): string | null {
  if (typeof response === 'string') {
    return response.trim() || null;
  }

  const url = response.url ?? response.downloadUrl;

  if (!url || typeof url !== 'string') {
    return null;
  }

  return url.trim() || null;
}

export function formatAppealErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    return getErrorMessage(error);
  }

  const message = getErrorMessage(error);

  if (error.status === 403) {
    return '当前账号无权访问或处理该项目申诉。';
  }

  if (error.status === 404) {
    return '申诉、项目或附件不存在，或当前账号无权访问。';
  }

  if (message.includes('Confirmed consensus review is required')) {
    return '必须已有已确认合议结果后才能发起申诉。';
  }

  if (message.includes('Project finalLevel is required')) {
    return '项目必须已有最终等级后才能发起或处理申诉。';
  }

  if (message.includes('Project appeal limit exceeded')) {
    return '该项目申诉次数已达 3 次上限。';
  }

  if (message.includes('Project has an unhandled appeal')) {
    return '该项目存在未处理申诉，处理完成前不能再次提交。';
  }

  if (message.includes('Appeal has already been handled')) {
    return '该申诉已处理，不能重复提交处理结果。';
  }

  if (message.includes('Appeal attachments can no longer be changed')) {
    return '当前申诉状态不允许继续上传或删除附件。';
  }

  if (message.includes('files are required')) {
    return '请选择需要上传的申诉附件。';
  }

  if (message.includes('finalLevel must be A, B, C, or D')) {
    return '最终等级必须为 A、B、C 或 D。';
  }

  if (message.includes('finalLevel is not a valid review_level')) {
    return '请选择有效的评审等级。';
  }

  return message;
}

export function formatLevelChangeResult(appeal: ProjectAppeal): string {
  return appeal.causedLevelChange
    ? '本次申诉导致最终等级调整'
    : '本次申诉未调整最终等级';
}

export function formatAppealNo(appealNo: number): string {
  return `第 ${appealNo} 次申诉`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export function validateAppealAttachmentFiles(files: File[]): string | null {
  if (files.length === 0) {
    return '请选择需要上传的申诉附件。';
  }

  if (files.length > MAX_PROJECT_APPEAL_ATTACHMENT_FILES) {
    return `一次最多上传 ${MAX_PROJECT_APPEAL_ATTACHMENT_FILES} 个文件。`;
  }

  const invalidFile = files.find((file) => {
    const extension = getFileExtension(file.name);

    return (
      !extension ||
      blockedAppealAttachmentExtensions.has(extension) ||
      !allowedAppealAttachmentExtensions.has(extension) ||
      file.size > MAX_PROJECT_APPEAL_ATTACHMENT_FILE_SIZE_BYTES
    );
  });

  if (!invalidFile) {
    return null;
  }

  if (invalidFile.size > MAX_PROJECT_APPEAL_ATTACHMENT_FILE_SIZE_BYTES) {
    return `文件 ${invalidFile.name} 超过 500MB。`;
  }

  const extension = getFileExtension(invalidFile.name);

  if (!extension) {
    return `文件 ${invalidFile.name} 缺少扩展名。`;
  }

  if (blockedAppealAttachmentExtensions.has(extension)) {
    return `文件 ${invalidFile.name} 的扩展名 ${extension} 不允许上传。`;
  }

  return `文件 ${invalidFile.name} 的扩展名 ${extension} 不在允许范围内。`;
}

export function shortId(id: string): string {
  const trimmed = id.trim();

  if (trimmed.length <= 8) {
    return trimmed;
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function formatLevel(
  value: string | null | undefined,
  labelByValue: Map<string, string>,
): string {
  if (!value) {
    return '-';
  }

  return labelByValue.get(value) ?? value;
}

export function buildReviewLevelLabelMap(
  levels: ReviewLevelOption[],
): Map<string, string> {
  return new Map(
    levels.flatMap((level) => [
      [level.code, level.name],
      [level.name, level.name],
    ]),
  );
}

export function getReviewLevelOptions(
  levels: ReviewLevelOption[] | null | undefined,
): ReviewLevelOption[] {
  return levels && levels.length > 0 ? levels : FALLBACK_REVIEW_LEVEL_OPTIONS;
}

function getFileExtension(filename: string): string {
  const segments = filename.trim().split('.');

  if (segments.length < 2) {
    return '';
  }

  return segments[segments.length - 1]?.toLowerCase() ?? '';
}

function createFallbackReviewLevel(code: string): ReviewLevelOption {
  return {
    code,
    id: code,
    name: code,
    sortOrder: code.charCodeAt(0),
  };
}

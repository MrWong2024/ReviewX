export type ApiErrorPayload = {
  code?: string;
  details?: unknown;
  message?: string | string[];
  remainingSeconds?: number;
};

export class ApiError extends Error {
  code?: string;
  details?: unknown;
  remainingSeconds?: number;
  status: number;

  constructor(status: number, payload?: ApiErrorPayload | string) {
    const message = normalizeMessage(payload) || defaultMessageForStatus(status);

    super(message);
    this.name = 'ApiError';
    this.status = status;

    if (typeof payload === 'object' && payload !== null) {
      this.code = payload.code;
      this.details = payload.details;
      this.remainingSeconds = payload.remainingSeconds;
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败，请稍后重试。';
}

function normalizeMessage(payload?: ApiErrorPayload | string): string {
  if (!payload) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join('；');
  }

  return payload.message ?? '';
}

function defaultMessageForStatus(status: number): string {
  if (status === 400) {
    return '提交内容不符合要求，请检查后重试。';
  }

  if (status === 401) {
    return '登录状态已失效，请重新登录。';
  }

  if (status === 403) {
    return '当前账号没有访问权限。';
  }

  if (status === 404) {
    return '请求的资源不存在。';
  }

  if (status === 409) {
    return '当前数据状态冲突，请刷新后重试。';
  }

  if (status >= 500) {
    return '服务暂时不可用，请稍后重试。';
  }

  return '请求失败，请稍后重试。';
}

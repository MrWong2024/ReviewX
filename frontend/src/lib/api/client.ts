import { ApiError, type ApiErrorPayload } from './errors';
import type { QueryParams, RequestBody } from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001';

type ApiRequestOptions = Omit<RequestInit, 'body' | 'credentials'> & {
  body?: RequestBody;
  params?: QueryParams;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, params, ...init } = options;
  const isFormData = body instanceof FormData;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path, params), {
    ...init,
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: requestHeaders,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, payload as ApiErrorPayload | string);
  }

  return payload as T;
}

export function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(path, API_BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

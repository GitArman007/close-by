import type { ApiErrorPayload } from '@/types/api';

const DEFAULT_API_BASE = 'http://localhost:8080/api/v1';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') || DEFAULT_API_BASE;

let activeToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  activeToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export class ApiRequestError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Optional explicit token override (used by demo visit simulator without replacing active session) */
  tokenOverride?: string | null;
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, tokenOverride, skipAuth = false } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const tokenToUse = skipAuth
    ? null
    : tokenOverride !== undefined
      ? tokenOverride
      : activeToken;

  if (tokenToUse) {
    headers.Authorization = `Bearer ${tokenToUse}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(
      0,
      'Could not reach the closeBy server. Check that the Spring Boot API is running on port 8080.'
    );
  }

  const rawText = await response.text();
  let parsed: unknown = null;
  if (rawText) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = rawText;
    }
  }

  if (!response.ok) {
    const payload = (parsed && typeof parsed === 'object' ? parsed : {}) as ApiErrorPayload;
    if (response.status === 401 && !skipAuth && tokenOverride === undefined) {
      unauthorizedHandler?.();
    }
    throw new ApiRequestError(
      response.status,
      payload.message || `Request failed with status ${response.status}.`,
      payload.fieldErrors || {}
    );
  }

  return parsed as T;
}

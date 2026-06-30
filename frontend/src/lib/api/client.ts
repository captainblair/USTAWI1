import type { ApiError, ApiPaginated, ApiSuccess } from "@/types/api";
import { ApiRequestError } from "@/types/api";

export { ApiRequestError };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api/v1";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token, cache, next }: RequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
    next,
  });

  const payload = (await response.json()) as T | ApiError;

  if (!response.ok || (payload as ApiError).success === false) {
    const errorPayload = payload as ApiError & Record<string, unknown>;
    const details =
      errorPayload.error?.details ??
      (typeof errorPayload === "object" && !errorPayload.success
        ? extractFieldErrors(errorPayload)
        : undefined);

    throw new ApiRequestError(
      errorPayload.error?.message ?? "Request failed",
      response.status,
      details,
    );
  }

  return payload as T;
}

function extractFieldErrors(payload: Record<string, unknown>): Record<string, string[]> | undefined {
  const skip = new Set(["success", "error", "message", "detail"]);
  const entries = Object.entries(payload).filter(
    ([key, value]) => !skip.has(key) && Array.isArray(value),
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries.map(([k, v]) => [k, v as string[]]));
}

export { API_BASE };
export type { ApiPaginated, ApiSuccess };

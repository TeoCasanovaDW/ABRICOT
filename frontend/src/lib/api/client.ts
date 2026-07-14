import { normalizeApiError } from "@/lib/api/errors";
import type { ApiResponse } from "@/types";

// Browser-only Route Handler access. Used by Client Components only. Never
// reads the session cookie or calls Express directly — same-origin `/api/*`
// requests only, proxied server-side by the Route Handlers themselves.

// Calls `/api${path}`, unwraps the backend's ApiResponse envelope, and throws
// a normalized ApiError on a non-2xx response or a network/parse failure.
export async function apiClient<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    throw await normalizeApiError(error);
  }

  if (!response.ok) {
    throw await normalizeApiError(response);
  }

  const body = (await response.json()) as ApiResponse<T>;
  return body.data as T;
}

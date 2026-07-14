import { getSessionToken } from "@/lib/session";
import { normalizeApiError } from "@/lib/api/errors";
import type { ApiResponse } from "@/types";

// Server-only Express access. Used by Server Components rendering directly
// and by Route Handlers proxying client mutations. Never imported from a
// Client Component.
const BACKEND_API_URL = process.env.BACKEND_API_URL;

// Calls `${BACKEND_API_URL}${path}` with the session token attached as
// `Authorization: Bearer <token>`, unwraps the backend's ApiResponse
// envelope, and throws a normalized ApiError on a non-2xx response or a
// network/parse failure.
export async function apiServer<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getSessionToken();

  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}${path}`, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

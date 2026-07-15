import type { ApiError } from "@/types";

// Backend envelope shape on error responses:
// { success: false, message, error?, data?: { errors? } }.
interface BackendErrorBody {
  message?: string;
  error?: string;
  data?: { errors?: { field: string; message: string }[] };
}

// Builds the shared ApiError shape from either a backend envelope (Response
// with a parseable JSON error body) or a network/parse failure (no Response,
// or a Response whose body isn't valid JSON).
export async function normalizeApiError(source: Response | unknown): Promise<ApiError> {
  if (source instanceof Response) {
    try {
      const body = (await source.json()) as BackendErrorBody;
      return {
        status: source.status,
        code: body.error,
        message: body.message ?? "Échec de la requête",
        fieldErrors: body.data?.errors,
      };
    } catch {
      return {
        status: source.status,
        message: "Réponse invalide du serveur",
      };
    }
  }

  return {
    status: 0,
    message: source instanceof Error ? source.message : "Erreur réseau",
  };
}

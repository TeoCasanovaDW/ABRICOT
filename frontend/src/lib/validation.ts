import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/types";

// Per-form zod schemas are added incrementally by specs/05, 06, 07, 09.

// Maps a backend `data.errors` array onto react-hook-form state so a form
// component doesn't hand-roll this loop per submit handler.
export function applyFieldErrors<T extends FieldValues>(
  fieldErrors: ApiError["fieldErrors"],
  setError: UseFormSetError<T>
): void {
  if (!fieldErrors) return;

  for (const { field, message } of fieldErrors) {
    setError(field as Path<T>, { type: "server", message });
  }
}

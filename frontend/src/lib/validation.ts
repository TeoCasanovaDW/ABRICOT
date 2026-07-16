import { z } from "zod";
import type { FieldErrors, FieldValues, Path, Resolver, UseFormSetError } from "react-hook-form";
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

// Bridges a zod schema to react-hook-form's `resolver` option without adding
// `@hookform/resolvers` for what's only ever a single schema per form.
export function zodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const field = String(issue.path[0]);
      if (!errors[field]) {
        errors[field] = { type: "validation", message: issue.message };
      }
    }

    return { values: {}, errors: errors as FieldErrors<T> };
  };
}

// Client-side UX layer only (specs/02) — the backend re-validates and is
// authoritative; this just mirrors its rules from specs/01 for fast feedback.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est requise.")
    .email("Adresse e-mail invalide."),
  password: z
    .string()
    .min(1, "Le mot de passe est requis.")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
      "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)."
    ),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Login applies no email format check server-side — only non-empty fields.
export const loginSchema = z.object({
  email: z.string().trim().min(1, "L'adresse e-mail est requise."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

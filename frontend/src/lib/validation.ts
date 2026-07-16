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

const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const PASSWORD_STRENGTH_MESSAGE =
  "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&).";

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
    .regex(PASSWORD_STRENGTH_REGEX, PASSWORD_STRENGTH_MESSAGE),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Login applies no email format check server-side — only non-empty fields.
export const loginSchema = z.object({
  email: z.string().trim().min(1, "L'adresse e-mail est requise."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Same name/email rules as registration, applied to profile edits. Password
// fields are optional here — the profile form only sends a password change
// when the user fills both, so the pair is validated together below.
export const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z
      .string()
      .trim()
      .min(1, "L'adresse e-mail est requise.")
      .email("Adresse e-mail invalide."),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const current = data.currentPassword ?? "";
    const next = data.newPassword ?? "";

    if (!current && !next) return;

    if (!current) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Le mot de passe actuel est requis pour changer de mot de passe.",
      });
      return;
    }

    if (!next) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "Le nouveau mot de passe est requis.",
      });
      return;
    }

    if (!PASSWORD_STRENGTH_REGEX.test(next)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: PASSWORD_STRENGTH_MESSAGE,
      });
      return;
    }

    if (next === current) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "Le nouveau mot de passe doit être différent de l'actuel.",
      });
    }
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Contributors are handled as separate combobox-selection state, not a form
// field — creation only ever sends search-picked emails, never free text.
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(100, "Le nom ne peut pas dépasser 100 caractères."),
  description: z
    .string()
    .trim()
    .min(1, "La description est requise.")
    .max(500, "La description ne peut pas dépasser 500 caractères."),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

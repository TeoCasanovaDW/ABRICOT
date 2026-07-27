import { z } from "zod";
import { taskDescriptionSchema, taskDueDateSchema, taskPrioritySchema, taskStatusSchema, taskTitleSchema } from "@/lib/taskFieldRules";
import type { Priority, TaskStatus } from "@/types";

// Pure validation/defaulting/capping of a raw provider response into draft
// tasks. Never calls the provider itself — the retry decision on a
// retry-needed result belongs entirely to the caller.

export type DraftStatus = Exclude<TaskStatus, "CANCELLED">;

export interface Draft {
  title: string;
  description: string;
  dueDate: string;
  status: DraftStatus;
  priority: Priority;
}

export type ValidateDraftsResult =
  | { ok: true; drafts: Draft[] }
  | { ok: false; reason: "invalid_json" | "not_array" | "zero_valid_items" };

export const MAX_DRAFTS = 10;

// title/description/dueDate reuse the exact manual-task-form field rules —
// same as the manual form, an item missing or failing any of them is
// rejected whole, never partially saved. status/priority stay optional with
// zod's `.default()`, mirroring the manual form's own TODO/MEDIUM defaults;
// a present-but-invalid value still fails the parse and drops the whole
// item, never coerced.
const draftItemSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  dueDate: taskDueDateSchema,
  status: taskStatusSchema.optional().default("TODO"),
  priority: taskPrioritySchema.optional().default("MEDIUM"),
});

export function validateDrafts(rawResponse: string): ValidateDraftsResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, reason: "not_array" };
  }

  const drafts: Draft[] = [];
  for (const item of parsed) {
    const result = draftItemSchema.safeParse(item);
    if (result.success) {
      drafts.push(result.data);
    }
  }

  if (drafts.length === 0) {
    return { ok: false, reason: "zero_valid_items" };
  }

  return { ok: true, drafts: drafts.slice(0, MAX_DRAFTS) };
}

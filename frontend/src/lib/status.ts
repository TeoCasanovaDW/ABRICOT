import type { TaskStatus } from "@/types";

// Single source of truth for task status order/labels, shared by Badge,
// StatusPicker and TaskFilters so none hardcodes its own copy.
// CANCELLED is a legacy, non-selectable state — STATUS_ORDER (the pickable
// set) deliberately excludes it, but STATUS_LABEL still covers it for Badge.

export const STATUS_ORDER: Exclude<TaskStatus, "CANCELLED">[] = ["TODO", "IN_PROGRESS", "DONE"];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

import type { Priority } from "@/types";

// Single source of truth for priority values/labels/order, shared by
// PriorityPicker and PriorityBadge so neither hardcodes its own copy.

export const PRIORITY_ORDER: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Élevée",
  URGENT: "Urgente",
};

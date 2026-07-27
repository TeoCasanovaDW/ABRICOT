import type { TaskStatus } from "@/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Local calendar days, not UTC/24h buckets, so comparisons use the browser's
// local "today" per the dashboard date rules (specs/08).
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(dueDate: string, today: Date): number {
  return Math.round(
    (startOfDay(new Date(dueDate)).getTime() - startOfDay(today).getTime()) / MS_PER_DAY,
  );
}

export function isInCurrentMonth(dueDate: string, today: Date = new Date()): boolean {
  const date = new Date(dueDate);
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

export function isOverdue(
  dueDate: string | null,
  status: TaskStatus,
  today: Date = new Date(),
): boolean {
  if (!dueDate || status === "DONE") return false;
  return daysUntil(dueDate, today) < 0;
}

export function isDueSoon(
  dueDate: string | null,
  status: TaskStatus,
  today: Date = new Date(),
): boolean {
  if (!dueDate || status === "DONE") return false;
  const diff = daysUntil(dueDate, today);
  return diff >= 0 && diff <= 3;
}

export function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

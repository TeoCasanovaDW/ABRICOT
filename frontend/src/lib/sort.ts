import type { Priority } from "@/types";

// GET /projects/:id/tasks and the dashboard task endpoints order by priority
// as a string, sorting alphabetically instead of by urgency (specs/01 "Known
// backend gaps"). This is the one client-side correction applied wherever
// their data is rendered.
const PRIORITY_RANK: Record<Priority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

interface SortableTask {
  priority: Priority;
  dueDate: string | null;
}

export function sortTasks<T extends SortableTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    if (a.dueDate === null || b.dueDate === null) {
      return a.dueDate === b.dueDate ? 0 : a.dueDate === null ? 1 : -1;
    }

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

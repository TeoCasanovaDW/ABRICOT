"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { CalendarDays, Folder, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import type { AssignedTask } from "@/components/dashboard/AssignedTaskList";
import { formatDueDate, isInCurrentMonth } from "@/lib/dashboardDates";
import { sortTasks } from "@/lib/sort";
import type { TaskStatus } from "@/types";
import buttonStyles from "@/components/ui/Button.module.css";
import styles from "./KanbanView.module.css";

type KanbanStatus = Exclude<TaskStatus, "CANCELLED">;
type DatedTask = AssignedTask & { dueDate: string };

const COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: "TODO", label: "À faire" },
  { status: "IN_PROGRESS", label: "En cours" },
  { status: "DONE", label: "Terminées" },
];

interface KanbanViewProps {
  tasks: AssignedTask[];
}

function subscribeNoop() {
  return () => {};
}

// Current-month membership depends on the browser's local calendar, so it can
// only be computed once mounted on the client — never with the server's
// clock/timezone during the initial render. useSyncExternalStore's server
// snapshot lets that gate live outside an effect.
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export function KanbanView({ tasks }: KanbanViewProps) {
  const isClient = useIsClient();

  const monthTasks = useMemo((): DatedTask[] => {
    if (!isClient) return [];
    const today = new Date();
    return tasks.filter(
      (task): task is DatedTask =>
        task.dueDate !== null &&
        task.status !== "CANCELLED" &&
        isInCurrentMonth(task.dueDate, today),
    );
  }, [tasks, isClient]);

  if (!isClient) return null;

  if (monthTasks.length === 0) {
    return <p className={styles.emptyState}>Aucune tâche due ce mois-ci</p>;
  }

  return (
    <div className={styles.board}>
      {COLUMNS.map(({ status, label }) => {
        const columnTasks = sortTasks(monthTasks.filter((task) => task.status === status));

        return (
          <div key={status} className={styles.column}>
            <div className={styles.columnHeader}>
              <h3 className={styles.columnTitle}>{label}</h3>
              <span className={styles.countPill}>{columnTasks.length}</span>
            </div>

            <div className={styles.columnBody}>
              {columnTasks.length === 0 ? (
                <p className={styles.columnEmpty}>Aucune tâche</p>
              ) : (
                columnTasks.map((task) => <KanbanCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task }: { task: DatedTask }) {
  const accessibleName = `Ouvrir la tâche « ${task.title} » du projet « ${task.project.name} »`;

  return (
    <Card className={styles.card}>
      <div className={styles.cardHeader}>
        <h4 className={styles.title}>{task.title}</h4>
        <Badge status={task.status} />
      </div>

      <div className={styles.priorityRow}>
        <span className={styles.priorityLabel}>Priorité :</span>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && <p className={styles.description}>{task.description}</p>}

      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <Folder size={14} aria-hidden="true" fill="currentColor" />
          {task.project.name}
        </span>
        <span className={styles.metaSeparator} aria-hidden="true" />
        <span className={styles.metaItem}>
          <CalendarDays size={14} aria-hidden="true" />
          {formatDueDate(task.dueDate)}
        </span>
        <span className={styles.metaSeparator} aria-hidden="true" />
        <span className={styles.metaItem}>
          <MessageSquareText size={14} aria-hidden="true" fill="none" stroke="currentColor" />
          {task.comments.length}
        </span>
      </div>

      <Link
        href={`/projects/${task.project.id}`}
        className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.wide}`}
        aria-label={accessibleName}
      >
        Voir
      </Link>
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, Clock, Folder, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TaskSearchFilter } from "@/components/dashboard/TaskSearchFilter";
import { sortTasks } from "@/lib/sort";
import type { Project, Task, TaskStatus } from "@/types";
import buttonStyles from "@/components/ui/Button.module.css";
import styles from "./AssignedTaskList.module.css";

// GET /dashboard/assigned-tasks embeds the owning project, unlike the task
// CRUD endpoints — shared with KanbanView, which derives from the same fetch.
export type AssignedTask = Task & { project: Pick<Project, "id" | "name"> };

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Local calendar days, not UTC/24h buckets, so a due date at any time of day
// compares against the browser's local "today" per the dashboard date rules.
function daysUntil(dueDate: string): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round(
    (startOfDay(new Date(dueDate)).getTime() - startOfDay(new Date()).getTime()) / MS_PER_DAY,
  );
}

type DueUrgency = "overdue" | "dueSoon" | null;

function getDueUrgency(dueDate: string | null, status: TaskStatus): DueUrgency {
  if (!dueDate || status === "DONE") return null;
  const diff = daysUntil(dueDate);
  if (diff < 0) return "overdue";
  if (diff <= 3) return "dueSoon";
  return null;
}

function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface AssignedTaskListProps {
  tasks: AssignedTask[];
}

export function AssignedTaskList({ tasks }: AssignedTaskListProps) {
  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);

  return (
    <Card className={styles.panel}>
      <TaskSearchFilter
        tasks={sortedTasks}
        emptyMessage="Aucune tâche ne vous est assignée"
        noResultsMessage="Aucune tâche ne correspond à votre recherche"
        header={
          <div className={styles.headingBlock}>
            <h2 className={styles.heading}>Mes tâches assignées</h2>
            <p className={styles.subheading}>Par ordre de priorité</p>
          </div>
        }
      >
        {(filteredTasks) => (
          <div className={styles.list}>
            {filteredTasks.map((task) => (
              <AssignedTaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </TaskSearchFilter>
    </Card>
  );
}

function AssignedTaskRow({ task }: { task: AssignedTask }) {
  const urgency = getDueUrgency(task.dueDate, task.status);
  const accessibleName = `Ouvrir la tâche « ${task.title} » du projet « ${task.project.name} »`;

  return (
    <Card className={styles.card}>
      <div className={styles.left}>
        <h3 className={styles.title}>{task.title}</h3>
        {task.description && <p className={styles.description}>{task.description}</p>}

        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Folder size={16} aria-hidden="true" fill="currentColor" />
            {task.project.name}
          </span>

          {task.dueDate && (
            <>
              <span className={styles.metaSeparator} aria-hidden="true" />
              <span className={styles.metaItem}>
                <CalendarDays size={16} aria-hidden="true" />
                {formatDueDate(task.dueDate)}
              </span>
            </>
          )}

          <span className={styles.metaSeparator} aria-hidden="true" />
          <span className={styles.metaItem}>
            <MessageSquare size={16} aria-hidden="true" fill="currentColor" />
            {task.comments.length}
          </span>

          {urgency === "overdue" && (
            <span className={`${styles.metaItem} ${styles.overdue}`}>
              <AlertTriangle size={16} aria-hidden="true" />
              En retard
            </span>
          )}

          {urgency === "dueSoon" && (
            <span className={`${styles.metaItem} ${styles.dueSoon}`}>
              <Clock size={16} aria-hidden="true" />
              Échéance proche
            </span>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <Badge status={task.status} />
        <Link
          href={`/projects/${task.project.id}`}
          className={`${buttonStyles.button} ${buttonStyles.primary} ${styles.viewButton}`}
          aria-label={accessibleName}
        >
          Voir
        </Link>
      </div>
    </Card>
  );
}

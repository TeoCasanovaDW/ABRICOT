"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarDays, Clock, Folder, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { TaskSearchFilter } from "@/components/dashboard/TaskSearchFilter";
import { formatDueDate, isDueSoon, isOverdue } from "@/lib/dashboardDates";
import { sortTasks } from "@/lib/sort";
import type { Project, Task } from "@/types";
import buttonStyles from "@/components/ui/Button.module.css";
import styles from "./AssignedTaskList.module.css";

// GET /dashboard/assigned-tasks embeds the owning project, unlike the task
// CRUD endpoints — shared with KanbanView, which derives from the same fetch.
export type AssignedTask = Task & { project: Pick<Project, "id" | "name"> };

interface AssignedTaskListProps {
  tasks: AssignedTask[];
}

export function AssignedTaskList({ tasks }: AssignedTaskListProps) {
  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks]);

  return (
    <Card padding="none">
      <div className={styles.panel}>
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
      </div>
    </Card>
  );
}

function AssignedTaskRow({ task }: { task: AssignedTask }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const dueSoon = isDueSoon(task.dueDate, task.status);
  const accessibleName = `Ouvrir la tâche « ${task.title} » du projet « ${task.project.name} »`;

  return (
    <Card padding="none">
      <div className={styles.card}>
        <h3 className={styles.title}>{task.title}</h3>

        <Badge status={task.status} className={styles.statusBadge} />

        <div className={styles.priorityRow}>
          <span className={styles.priorityLabel}>Priorité :</span>
          <PriorityBadge priority={task.priority} />
        </div>

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
            <MessageSquareText size={16} aria-hidden="true" fill="none" stroke="currentColor" />
            {task.comments.length}
          </span>

          {overdue && (
            <span className={`${styles.metaItem} ${styles.overdue}`}>
              <AlertTriangle size={16} aria-hidden="true" />
              En retard
            </span>
          )}

          {dueSoon && (
            <span className={`${styles.metaItem} ${styles.dueSoon}`}>
              <Clock size={16} aria-hidden="true" />
              Échéance proche
            </span>
          )}
        </div>

        <div className={styles.right}>
          <Link
            href={`/projects/${task.project.id}`}
            className={`${buttonStyles.button} ${buttonStyles.primary} ${buttonStyles.wide}`}
            aria-label={accessibleName}
          >
            Voir
          </Link>
        </div>
      </div>
    </Card>
  );
}

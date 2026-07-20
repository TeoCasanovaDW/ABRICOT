import { CalendarDays, ChevronDown, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Task } from "@/types";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
}

function assigneeName(user: { name: string | null; email: string }): string {
  return user.name ?? user.email;
}

function formatDueDate(dueDate: string): string {
  return new Date(dueDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{task.title}</h3>
          <Badge status={task.status} />
        </div>
        <button type="button" className={styles.menuButton} aria-label="Actions de la tâche">
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
      </div>

      {task.description && <p className={styles.description}>{task.description}</p>}

      {task.dueDate && (
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Échéance :</span>
          <CalendarDays size={16} aria-hidden="true" />
          <span>{formatDueDate(task.dueDate)}</span>
        </div>
      )}

      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Assigné à :</span>
        {task.assignees.length > 0 ? (
          <div className={styles.assigneeList}>
            {task.assignees.map((assignee) => (
              <span key={assignee.user.id} className={styles.assigneeItem}>
                <Avatar name={assigneeName(assignee.user)} size={25} variant="muted" />
                <span className={styles.assigneeName}>{assigneeName(assignee.user)}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className={styles.unassigned}>Non assignée</span>
        )}
      </div>

      <div className={styles.commentsRow}>
        <span className={styles.commentsLabel}>Commentaires ({task.comments.length})</span>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
    </Card>
  );
}

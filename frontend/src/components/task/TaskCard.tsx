"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronDown, MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Task } from "@/types";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
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

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuWrapperRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{task.title}</h3>
          <Badge status={task.status} />
        </div>
        <div className={styles.menuWrapper} ref={menuWrapperRef} onKeyDown={handleMenuKeyDown}>
          <button
            type="button"
            className={styles.menuButton}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Actions pour la tâche ${task.title}`}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>

          {menuOpen && (
            <div role="menu" className={styles.menu} aria-label={`Actions pour la tâche ${task.title}`}>
              <button
                type="button"
                role="menuitem"
                className={styles.menuItem}
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                Modifier
              </button>
              <button
                type="button"
                role="menuitem"
                className={[styles.menuItem, styles.menuItemDanger].join(" ")}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
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

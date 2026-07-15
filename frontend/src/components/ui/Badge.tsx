import type { HTMLAttributes } from "react";
import type { TaskStatus } from "@/types";
import styles from "./Badge.module.css";

const STATUS_STYLE: Record<TaskStatus, string> = {
  TODO: styles.todo,
  IN_PROGRESS: styles.inProgress,
  DONE: styles.done,
  CANCELLED: styles.cancelled,
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: TaskStatus;
}

export function Badge({ status, className, ...props }: BadgeProps) {
  return (
    <span
      className={[styles.badge, STATUS_STYLE[status], className].filter(Boolean).join(" ")}
      {...props}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

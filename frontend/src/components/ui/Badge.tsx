import type { HTMLAttributes } from "react";
import type { TaskStatus } from "@/types";
import styles from "./Badge.module.css";

export type BadgeStatus = TaskStatus | "OWNER";

const STATUS_STYLE: Record<BadgeStatus, string> = {
  TODO: styles.todo,
  IN_PROGRESS: styles.inProgress,
  DONE: styles.done,
  CANCELLED: styles.cancelled,
  OWNER: styles.owner,
};

const STATUS_LABEL: Record<BadgeStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
  OWNER: "Propriétaire",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
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

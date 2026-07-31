import type { HTMLAttributes } from "react";
import type { Priority } from "@/types";
import { PRIORITY_LABEL } from "@/lib/priority";
import styles from "./PriorityBadge.module.css";

const PRIORITY_STYLE: Record<Priority, string> = {
  LOW: styles.low,
  MEDIUM: styles.medium,
  HIGH: styles.high,
  URGENT: styles.urgent,
};

interface PriorityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  priority: Priority;
}

export function PriorityBadge({ priority, className, ...props }: PriorityBadgeProps) {
  return (
    <span
      className={[styles.badge, PRIORITY_STYLE[priority], className].filter(Boolean).join(" ")}
      {...props}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

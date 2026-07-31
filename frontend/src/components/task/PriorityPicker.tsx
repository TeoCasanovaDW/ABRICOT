"use client";

import type { Priority } from "@/types";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/priority";
import styles from "./PriorityPicker.module.css";

interface PriorityPickerProps {
  name: string;
  labelledBy: string;
  value: Priority;
  onChange: (value: Priority) => void;
  disabled?: boolean;
}

const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: styles.low,
  MEDIUM: styles.medium,
  HIGH: styles.high,
  URGENT: styles.urgent,
};

export function PriorityPicker({ name, labelledBy, value, onChange, disabled }: PriorityPickerProps) {
  return (
    <div className={styles.priorityGroup} role="radiogroup" aria-labelledby={labelledBy}>
      {PRIORITY_ORDER.map((priority) => (
        <label key={priority} className={[styles.priorityPill, PRIORITY_CLASS[priority]].join(" ")}>
          <input
            type="radio"
            name={name}
            value={priority}
            className={styles.priorityRadio}
            disabled={disabled}
            checked={value === priority}
            onChange={() => onChange(priority)}
          />
          {PRIORITY_LABEL[priority]}
        </label>
      ))}
    </div>
  );
}

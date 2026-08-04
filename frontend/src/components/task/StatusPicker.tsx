"use client";

import { STATUS_LABEL, STATUS_ORDER } from "@/lib/status";
import styles from "./StatusPicker.module.css";

export type StatusPickerValue = "TODO" | "IN_PROGRESS" | "DONE";

interface StatusPickerProps {
  name: string;
  labelledBy: string;
  value: StatusPickerValue;
  onChange: (value: StatusPickerValue) => void;
  disabled?: boolean;
  noSelection?: boolean;
}

const STATUS_CLASS: Record<StatusPickerValue, string> = {
  TODO: styles.todo,
  IN_PROGRESS: styles.inProgress,
  DONE: styles.done,
};

export function StatusPicker({ name, labelledBy, value, onChange, disabled, noSelection }: StatusPickerProps) {
  return (
    <div className={styles.statusGroup} role="radiogroup" aria-labelledby={labelledBy}>
      {STATUS_ORDER.map((status) => (
        <label key={status} className={[styles.statusPill, STATUS_CLASS[status]].join(" ")}>
          <input
            type="radio"
            name={name}
            value={status}
            className={styles.statusRadio}
            disabled={disabled}
            checked={!noSelection && value === status}
            onChange={() => onChange(status)}
          />
          {STATUS_LABEL[status]}
        </label>
      ))}
    </div>
  );
}

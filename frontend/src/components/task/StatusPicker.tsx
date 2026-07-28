"use client";

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

const STATUS_OPTIONS: { value: StatusPickerValue; label: string; className: string }[] = [
  { value: "TODO", label: "À faire", className: styles.todo },
  { value: "IN_PROGRESS", label: "En cours", className: styles.inProgress },
  { value: "DONE", label: "Terminée", className: styles.done },
];

export function StatusPicker({ name, labelledBy, value, onChange, disabled, noSelection }: StatusPickerProps) {
  return (
    <div className={styles.statusGroup} role="radiogroup" aria-labelledby={labelledBy}>
      {STATUS_OPTIONS.map((option) => (
        <label key={option.value} className={[styles.statusPill, option.className].join(" ")}>
          <input
            type="radio"
            name={name}
            value={option.value}
            className={styles.statusRadio}
            disabled={disabled}
            checked={!noSelection && value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

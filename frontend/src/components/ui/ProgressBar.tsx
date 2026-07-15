import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  completed: number;
  total: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ completed, total, label, className }: ProgressBarProps) {
  const clampedCompleted = Math.min(total, Math.max(0, completed));
  const percentage =
    total > 0 ? Math.min(100, Math.max(0, Math.round((clampedCompleted / total) * 100))) : 0;
  const helperText =
    clampedCompleted === 1
      ? `${clampedCompleted}/${total} tâche terminée`
      : `${clampedCompleted}/${total} tâches terminées`;

  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(" ")}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.percentage}>{percentage}%</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={helperText}
        aria-label={label ?? helperText}
      >
        <div className={styles.fill} style={{ width: `${percentage}%` }} />
      </div>
      <span className={styles.helperText}>{helperText}</span>
    </div>
  );
}

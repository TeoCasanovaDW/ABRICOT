import styles from "./PageLoading.module.css";

interface PageLoadingProps {
  label: string;
}

// Spinner is decorative; the visible label is the actual status signal
// (specs/10: skeletons/spinners are never the sole status signal).
export function PageLoading({ label }: PageLoadingProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

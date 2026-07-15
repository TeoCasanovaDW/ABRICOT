import { forwardRef, type SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <select
          ref={ref}
          className={[styles.select, error && styles.invalid, className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, endAdornment, className, id, "aria-describedby": describedBy, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div className={styles.wrapper}>
        <div className={styles.field}>
          <input
            ref={ref}
            id={id}
            className={[styles.input, endAdornment && styles.hasAdornment, error && styles.invalid, className]
              .filter(Boolean)
              .join(" ")}
            aria-invalid={error ? true : undefined}
            aria-describedby={[describedBy, errorId].filter(Boolean).join(" ") || undefined}
            {...props}
          />
          {endAdornment && <span className={styles.adornment}>{endAdornment}</span>}
        </div>
        {error && (
          <p className={styles.error} id={errorId}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

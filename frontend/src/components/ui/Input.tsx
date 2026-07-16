import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, id, "aria-describedby": describedBy, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div className={styles.wrapper}>
        <input
          ref={ref}
          id={id}
          className={[styles.input, error && styles.invalid, className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, errorId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
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

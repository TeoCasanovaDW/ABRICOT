import { forwardRef, type InputHTMLAttributes } from "react";
import styles from "./Input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <input
          ref={ref}
          className={[styles.input, error && styles.invalid, className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

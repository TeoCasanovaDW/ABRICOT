import { forwardRef, type TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        <textarea
          ref={ref}
          className={[styles.textarea, error && styles.invalid, className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

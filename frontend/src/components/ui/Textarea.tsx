import { forwardRef, type TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  variant?: "default" | "flat";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, variant = "default", className, id, "aria-describedby": describedBy, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div className={styles.wrapper}>
        <textarea
          ref={ref}
          id={id}
          className={[styles.textarea, variant === "flat" && styles.flat, error && styles.invalid, className]
            .filter(Boolean)
            .join(" ")}
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

Textarea.displayName = "Textarea";

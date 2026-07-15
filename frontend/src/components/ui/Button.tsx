import { forwardRef, type ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "brand" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[styles.button, styles[variant], loading && styles.loading, className]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled}
        aria-disabled={loading || disabled || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

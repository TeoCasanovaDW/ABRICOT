import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

// `padding: "none"` drops the card's own base padding so a caller can size
// an inner wrapper instead of layering a page-specific class over `.card` —
// two classes on the same element competing for the same property is order-
// dependent across stylesheets and must be avoided (see task-panel padding).
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "default" | "none";
}

export function Card({ padding = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={[styles.card, padding === "none" && styles.noPadding, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

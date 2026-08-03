"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { moveFocusTo, returnFocusTo } from "@/lib/focusManagement";
import styles from "./Modal.module.css";

// Used once per open, scoped to the body only, to pick a deliberate initial
// focus target that skips the header's close button — not a Tab-trap query.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "default" | "wide";
}

export function Modal({ open, onClose, title, children, className, size = "default" }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const trigger = document.activeElement as HTMLElement | null;
    triggerRef.current = trigger;
    // A click leaves the trigger not matching `:focus-visible`; a keyboard
    // activation (Tab + Enter/Space) leaves it matching. Moving focus to the
    // first field happens via script either way, so the browser's own
    // heuristic can't tell them apart on the *new* element — this carries
    // the trigger's input modality forward instead.
    const openedViaPointer = trigger ? !trigger.matches(":focus-visible") : false;

    dialog.showModal();

    const firstField = bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    const target = firstField ?? dialog;
    moveFocusTo(target);

    if (openedViaPointer) {
      target.style.outline = "none";
      target.addEventListener("blur", () => { target.style.outline = ""; }, { once: true });
    }

    return () => {
      if (dialog.open) dialog.close();
      returnFocusTo(triggerRef.current);
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={[styles.modal, size === "wide" && styles.wide, className].filter(Boolean).join(" ")}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape fires this before the browser closes the dialog on its own —
        // block that and let onClose flip the controlled `open` prop instead,
        // so React stays the single source of truth for open/closed state.
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div ref={bodyRef} className={styles.body}>
        {children}
      </div>
    </dialog>
  );
}

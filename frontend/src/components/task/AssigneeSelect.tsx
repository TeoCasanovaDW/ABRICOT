"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import type { UserSummary } from "@/types";
import styles from "./AssigneeSelect.module.css";

interface AssigneeSelectProps<T extends FieldValues> {
  id: string;
  label: string;
  name: Path<T>;
  options: UserSummary[];
  control: Control<T>;
  disabled?: boolean;
}

function memberLabel(user: UserSummary): string {
  return user.name ?? user.email;
}

// Closed-by-default multi-select restricted to a caller-supplied option list
// (e.g. a project's own owner and members) — never backed by GET
// /users/search. A native `<select multiple>` always renders as an open
// listbox, which is why this is hand-built instead.
export function AssigneeSelect<T extends FieldValues>({
  id,
  label,
  name,
  options,
  control,
  disabled,
}: AssigneeSelectProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name });

  const selectedIds = value as string[];

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const selectedUsers = options.filter((user) => selectedIds.includes(user.id));

  const toggleOption = (userId: string) => {
    onChange(selectedIds.includes(userId) ? selectedIds.filter((id) => id !== userId) : [...selectedIds, userId]);
  };

  const removeOption = (userId: string) => {
    onChange(selectedIds.filter((id) => id !== userId));
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((index) => {
        if (options.length === 0) return -1;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (index + direction + options.length) % options.length;
      });
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      } else if (activeIndex >= 0) {
        toggleOption(options[activeIndex]!.id);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    }
  };

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className={styles.assigneeField} ref={containerRef}>
      {label}
      <div className={styles.assigneeControl}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          className={styles.assigneeTrigger}
          disabled={disabled}
          onClick={() => {
            setOpen((current) => !current);
            setActiveIndex(-1);
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          <span
            className={[styles.assigneeTriggerText, selectedUsers.length === 0 && styles.assigneePlaceholder]
              .filter(Boolean)
              .join(" ")}
          >
            {selectedUsers.length === 0
              ? "Choisir un ou plusieurs collaborateurs"
              : `${selectedUsers.length} collaborateur${selectedUsers.length > 1 ? "s" : ""} sélectionné${
                  selectedUsers.length > 1 ? "s" : ""
                }`}
          </span>
          <ChevronDown size={16} aria-hidden="true" className={styles.assigneeChevron} />
        </button>

        {open && (
          <ul id={listboxId} role="listbox" aria-multiselectable="true" aria-label={label} className={styles.assigneeListbox}>
            {options.map((user, index) => {
              const isSelected = selectedIds.includes(user.id);
              return (
                <li
                  key={user.id}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={[styles.assigneeOption, index === activeIndex && styles.assigneeOptionActive]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    toggleOption(user.id);
                    triggerRef.current?.focus();
                  }}
                >
                  <span>{memberLabel(user)}</span>
                  {isSelected && <Check size={16} aria-hidden="true" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <ul className={styles.assigneeChipList}>
          {selectedUsers.map((user) => (
            <li key={user.id} className={styles.assigneeChip}>
              <span>{memberLabel(user)}</span>
              <button
                type="button"
                className={styles.assigneeChipRemove}
                aria-label={`Retirer ${memberLabel(user)}`}
                disabled={disabled}
                onClick={() => removeOption(user.id)}
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useController, useForm, useWatch, type Control } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { applyFieldErrors, taskSchema, zodResolver, type TaskFormValues } from "@/lib/validation";
import type { ProjectMember, Task, UserSummary } from "@/types";
import styles from "./TaskModal.module.css";

interface TaskModalProps {
  projectId: string;
  owner: UserSummary;
  members: ProjectMember[];
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onAnnounce: (message: string) => void;
}

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  dueDate: "",
  status: "TODO",
  assigneeIds: [],
};

const STATUS_OPTIONS: { value: TaskFormValues["status"]; label: string; className: string }[] = [
  { value: "TODO", label: "À faire", className: styles.todo },
  { value: "IN_PROGRESS", label: "En cours", className: styles.inProgress },
  { value: "DONE", label: "Terminée", className: styles.done },
];

function memberLabel(user: UserSummary): string {
  return user.name ?? user.email;
}

interface AssigneeSelectProps {
  id: string;
  label: string;
  options: UserSummary[];
  control: Control<TaskFormValues>;
  disabled?: boolean;
}

// Closed-by-default multi-select restricted to the project's own owner and
// members — never backed by GET /users/search. A native `<select multiple>`
// always renders as an open listbox, which is why this is hand-built instead.
function AssigneeSelect({ id, label, options, control, disabled }: AssigneeSelectProps) {
  const {
    field: { value, onChange },
  } = useController({ control, name: "assigneeIds" });

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

  const selectedUsers = options.filter((user) => value.includes(user.id));

  const toggleOption = (userId: string) => {
    onChange(value.includes(userId) ? value.filter((id) => id !== userId) : [...value, userId]);
  };

  const removeOption = (userId: string) => {
    onChange(value.filter((id) => id !== userId));
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
              const isSelected = value.includes(user.id);
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

export function TaskModal({ projectId, owner, members, open, onClose, onCreated, onAnnounce }: TaskModalProps) {
  const [generalError, setGeneralError] = useState("");
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const dueDateField = register("dueDate");

  const openDueDatePicker = () => {
    const input = dueDateInputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  const assigneeOptions = [owner, ...members.map((member) => member.user)];
  const watchedValues = useWatch({ control });
  const canSubmit = !isSubmitting && taskSchema.safeParse(watchedValues).success;

  const handleClose = () => {
    if (isSubmitting) return;
    setGeneralError("");
    reset(DEFAULT_VALUES);
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError("");

    const payload: {
      title: string;
      description: string;
      dueDate?: string;
      status: TaskFormValues["status"];
      assigneeIds: string[];
    } = {
      title: values.title,
      description: values.description,
      status: values.status,
      assigneeIds: values.assigneeIds,
    };
    if (values.dueDate) payload.dueDate = values.dueDate;

    try {
      await apiClient<{ task: Task }>(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      reset(DEFAULT_VALUES);
      onCreated();
    } catch (error) {
      if (!isApiError(error)) throw error;

      if (error.status === 400 && error.fieldErrors) {
        applyFieldErrors(error.fieldErrors, setError);
        return;
      }

      setGeneralError(error.message);
      onAnnounce(error.message);
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Créer une tâche" className={styles.modal}>
      {generalError && (
        <p role="alert" className={styles.generalError}>
          {generalError}
        </p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          Titre *
          <Input id="task-title" disabled={isSubmitting} error={errors.title?.message} {...register("title")} />
        </label>

        <label className={styles.field}>
          Description *
          <Textarea
            id="task-description"
            disabled={isSubmitting}
            error={errors.description?.message}
            {...register("description")}
          />
        </label>

        <label className={styles.field}>
          Échéance
          <div className={styles.dateWrapper}>
            <Input
              id="task-due-date"
              type="date"
              className={styles.dateInput}
              disabled={isSubmitting}
              error={errors.dueDate?.message}
              {...dueDateField}
              ref={(element) => {
                dueDateField.ref(element);
                dueDateInputRef.current = element;
              }}
            />
            <button
              type="button"
              className={styles.dateIconButton}
              tabIndex={-1}
              aria-hidden="true"
              disabled={isSubmitting}
              onClick={openDueDatePicker}
            >
              <CalendarDays size={16} aria-hidden="true" className={styles.dateIcon} />
            </button>
          </div>
        </label>

        <AssigneeSelect
          id="task-assignees"
          label="Assigné à :"
          options={assigneeOptions}
          control={control}
          disabled={isSubmitting}
        />

        <div className={styles.field}>
          <span id="task-status-label">Statut</span>
          <div className={styles.statusGroup} role="radiogroup" aria-labelledby="task-status-label">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className={[styles.statusPill, option.className].join(" ")}>
                <input
                  type="radio"
                  value={option.value}
                  className={styles.statusRadio}
                  disabled={isSubmitting}
                  {...register("status")}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={!canSubmit}>
            + Ajouter une tâche
          </Button>
        </div>
      </form>
    </Modal>
  );
}

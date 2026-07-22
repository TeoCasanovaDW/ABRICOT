"use client";

import { useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useController, useForm, useWatch } from "react-hook-form";
import { AssigneeSelect } from "@/components/task/AssigneeSelect";
import { Badge } from "@/components/ui/Badge";
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
  task?: Task;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onAnnounce: (message: string) => void;
}

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  dueDate: "",
  status: "TODO",
  assigneeIds: [],
};

// <input type="date"> only accepts "YYYY-MM-DD" — the backend's ISO datetime
// string is truncated rather than reparsed, which would shift the date under
// non-UTC local timezones.
function toDateInputValue(dueDate: string | null): string {
  return dueDate ? dueDate.slice(0, 10) : "";
}

function buildDefaultValues(task?: Task): TaskFormValues {
  if (!task) return DEFAULT_VALUES;

  return {
    title: task.title,
    description: task.description ?? "",
    dueDate: toDateInputValue(task.dueDate),
    status: task.status === "CANCELLED" ? "TODO" : task.status,
    assigneeIds: task.assignees.map((assignee) => assignee.user.id),
  };
}

const STATUS_OPTIONS: { value: TaskFormValues["status"]; label: string; className: string }[] = [
  { value: "TODO", label: "À faire", className: styles.todo },
  { value: "IN_PROGRESS", label: "En cours", className: styles.inProgress },
  { value: "DONE", label: "Terminée", className: styles.done },
];

export function TaskModal({ projectId, owner, members, task, open, onClose, onSuccess, onAnnounce }: TaskModalProps) {
  const isEditMode = Boolean(task);
  const [generalError, setGeneralError] = useState("");
  const [legacyCancelled, setLegacyCancelled] = useState(task?.status === "CANCELLED");
  // Fixed for this instance's lifetime — the parent gives every open/task a
  // fresh `key`, so `task` never changes under a mounted TaskModal and this
  // never needs to be resynced.
  const initialLegacyCancelled = task?.status === "CANCELLED";
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: buildDefaultValues(task),
  });

  const {
    field: { value: statusValue, onChange: setStatusValue },
  } = useController({ control, name: "status" });

  const dueDateField = register("dueDate");

  const openDueDatePicker = () => {
    const input = dueDateInputRef.current;
    if (!input) return;
    input.focus();
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  };

  const handleStatusChange = (value: TaskFormValues["status"]) => {
    setStatusValue(value);
    setLegacyCancelled(false);
  };

  const assigneeOptions = [owner, ...members.map((member) => member.user)];
  const watchedValues = useWatch({ control });
  const isValid = taskSchema.safeParse(watchedValues).success;
  // A legacy-CANCELLED task moving off that placeholder is a real change even
  // when the picked value happens to match the form's internal default.
  const hasChanges = isDirty || (initialLegacyCancelled && !legacyCancelled);
  const canSubmit = !isSubmitting && isValid && (!isEditMode || hasChanges);

  const handleClose = () => {
    if (isSubmitting) return;
    setGeneralError("");
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError("");

    const payload: {
      title: string;
      description: string;
      dueDate: string;
      status?: TaskFormValues["status"];
      assigneeIds: string[];
    } = {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      assigneeIds: values.assigneeIds,
    };

    // Omitted preserves the existing status; the legacy-CANCELLED display is
    // fixed/read-only until the user picks a real status, so nothing is sent
    // while it's still showing that placeholder.
    if (!isEditMode || !legacyCancelled) payload.status = values.status;

    try {
      if (isEditMode && task) {
        await apiClient<{ task: Task }>(`/projects/${projectId}/tasks/${task.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient<{ task: Task }>(`/projects/${projectId}/tasks`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
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
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditMode ? "Modifier la tâche" : "Créer une tâche"}
      className={styles.modal}
    >
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
          Échéance *
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
          name="assigneeIds"
          options={assigneeOptions}
          control={control}
          disabled={isSubmitting}
        />

        <div className={styles.field}>
          <span id="task-status-label">Statut</span>
          {legacyCancelled && (
            <div className={styles.legacyStatus}>
              <Badge status="CANCELLED" />
            </div>
          )}
          <div className={styles.statusGroup} role="radiogroup" aria-labelledby="task-status-label">
            {STATUS_OPTIONS.map((option) => (
              <label key={option.value} className={[styles.statusPill, option.className].join(" ")}>
                <input
                  type="radio"
                  name="task-status"
                  value={option.value}
                  className={styles.statusRadio}
                  disabled={isSubmitting}
                  checked={!legacyCancelled && statusValue === option.value}
                  onChange={() => handleStatusChange(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={!canSubmit}>
            {isEditMode ? "Enregistrer les modifications" : "+ Ajouter une tâche"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

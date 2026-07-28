"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useController, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AssigneeSelect } from "@/components/task/AssigneeSelect";
import { StatusPicker } from "@/components/task/StatusPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { zodResolver } from "@/lib/validation";
import { taskDescriptionSchema, taskDueDateSchema, taskStatusSchema, taskTitleSchema } from "@/lib/taskFieldRules";
import type { Draft } from "@/lib/ai/validateDrafts";
import type { ProjectMember, UserSummary } from "@/types";
import styles from "./DraftCard.module.css";

export type DraftItem = Draft & { draftId: string; assigneeIds: string[] };

const draftFormSchema = z.object({
  title: taskTitleSchema,
  description: taskDescriptionSchema,
  dueDate: taskDueDateSchema,
  status: taskStatusSchema,
  assigneeIds: z.array(z.string()),
});

export type DraftFormValues = z.infer<typeof draftFormSchema>;

interface DraftCardProps {
  draft: DraftItem;
  owner: UserSummary;
  members: ProjectMember[];
  onRemove: (draftId: string) => void;
  onUpdate: (draftId: string, values: DraftFormValues) => void;
}

function toDateInputValue(dueDate: string): string {
  return dueDate.slice(0, 10);
}

function buildDefaultValues(draft: DraftItem): DraftFormValues {
  return {
    title: draft.title,
    description: draft.description,
    dueDate: toDateInputValue(draft.dueDate),
    status: draft.status,
    assigneeIds: draft.assigneeIds,
  };
}

export function DraftCard({ draft, owner, members, onRemove, onUpdate }: DraftCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const assigneeOptions = [owner, ...members.map((member) => member.user)];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DraftFormValues>({
    resolver: zodResolver(draftFormSchema),
    defaultValues: buildDefaultValues(draft),
  });

  const {
    field: { value: statusValue, onChange: setStatusValue },
  } = useController({ control, name: "status" });

  const watchedValues = useWatch({ control });
  const isValid = draftFormSchema.safeParse(watchedValues).success;

  const startEditing = () => {
    reset(buildDefaultValues(draft));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    reset(buildDefaultValues(draft));
    setIsEditing(false);
  };

  const onSubmit = handleSubmit((values) => {
    onUpdate(draft.draftId, values);
    setIsEditing(false);
  });

  if (!isEditing) {
    return (
      <Card className={styles.card}>
        <h3 className={styles.title}>{draft.title}</h3>
        <p className={styles.description}>{draft.description}</p>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={[styles.action, styles.actionDanger].join(" ")}
            onClick={() => onRemove(draft.draftId)}
          >
            <Trash2 size={16} aria-hidden="true" />
            Supprimer
          </button>
          <span className={styles.actionSeparator} aria-hidden="true" />
          <button type="button" className={styles.action} onClick={startEditing}>
            <Pencil size={16} aria-hidden="true" />
            Modifier
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          Titre *
          <Input error={errors.title?.message} {...register("title")} />
        </label>

        <label className={styles.field}>
          Description *
          <Textarea error={errors.description?.message} {...register("description")} />
        </label>

        <label className={styles.field}>
          Échéance *
          <Input type="date" error={errors.dueDate?.message} {...register("dueDate")} />
        </label>

        <div className={styles.field}>
          <span id={`draft-status-${draft.draftId}`}>Statut</span>
          <StatusPicker
            name={`draft-status-${draft.draftId}`}
            labelledBy={`draft-status-${draft.draftId}`}
            value={statusValue}
            onChange={setStatusValue}
          />
        </div>

        <AssigneeSelect
          id={`draft-assignees-${draft.draftId}`}
          label="Assigné à :"
          name="assigneeIds"
          options={assigneeOptions}
          control={control}
        />

        <div className={styles.cardActions}>
          <Button type="submit" variant="primary" disabled={!isValid}>
            Enregistrer
          </Button>
          <Button type="button" variant="secondary" onClick={cancelEditing}>
            Annuler
          </Button>
        </div>
      </form>
    </Card>
  );
}

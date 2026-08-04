"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { ContributorPicker } from "@/components/project/ContributorPicker";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import {
  applyFieldErrors,
  projectSchema,
  zodResolver,
  type ProjectFormValues,
} from "@/lib/validation";
import type { ProjectDetail, ProjectMember, Task, UserSummary } from "@/types";
import styles from "./EditProjectModal.module.css";

interface EditProjectModalProps {
  project: ProjectDetail;
  open: boolean;
  onClose: () => void;
  onSaved: (result: { name: string; description: string | null; members: ProjectMember[] }) => void;
  onAnnounce: (message: string) => void;
}

function contributorLabel(user: UserSummary): string {
  return user.name ?? user.email;
}

export function EditProjectModal({ project, open, onClose, onSaved, onAnnounce }: EditProjectModalProps) {
  const router = useRouter();
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<UserSummary[]>(() => project.members.map((member) => member.user));
  const [wasOpen, setWasOpen] = useState(open);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: project.name, description: project.description ?? "" },
  });

  // A previous cancel/close must never leak into the next open — resync
  // everything from the current project data each time the modal opens.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      reset({ name: project.name, description: project.description ?? "" });
      setSelected(project.members.map((member) => member.user));
      setGeneralError("");
    }
  }

  const [watchedName, watchedDescription] = useWatch({ control, name: ["name", "description"] });
  const initialMemberIds = new Set(project.members.map((member) => member.user.id));
  const selectedIds = new Set(selected.map((user) => user.id));
  const addedUsers = selected.filter((user) => !initialMemberIds.has(user.id));
  const membersChanged =
    selectedIds.size !== initialMemberIds.size || selected.some((user) => !initialMemberIds.has(user.id));
  const fieldsChanged =
    watchedName.trim() !== project.name || (watchedDescription ?? "").trim() !== (project.description ?? "");
  const hasChanges = fieldsChanged || membersChanged;
  const fieldsValid = projectSchema.safeParse({ name: watchedName, description: watchedDescription }).success;
  const canSave = hasChanges && fieldsValid && !submitting;

  const addContributor = (user: UserSummary) => {
    setSelected((current) => [...current, user]);
    onAnnounce(`${contributorLabel(user)} ajouté aux contributeurs.`);
  };

  const removeContributor = (user: UserSummary) => {
    setSelected((current) => current.filter((existing) => existing.id !== user.id));
    onAnnounce(`${contributorLabel(user)} retiré des contributeurs.`);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const onSubmit = handleSubmit(async (formValues) => {
    if (!hasChanges) return;

    setGeneralError("");
    setSubmitting(true);

    const removed = project.members.filter((member) => !selectedIds.has(member.user.id));

    try {
      if (fieldsChanged) {
        await apiClient(`/projects/${project.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: formValues.name, description: formValues.description }),
        });
      }

      for (const user of addedUsers) {
        await apiClient(`/projects/${project.id}/contributors`, {
          method: "POST",
          body: JSON.stringify({ email: user.email, role: "CONTRIBUTOR" }),
        });
      }

      if (removed.length > 0) {
        try {
          const { tasks } = await apiClient<{ tasks: Task[] }>(`/projects/${project.id}/tasks`);

          for (const member of removed) {
            const affectedTasks = tasks.filter((task) =>
              task.assignees.some((assignee) => assignee.user.id === member.user.id),
            );

            for (const task of affectedTasks) {
              await apiClient<{ task: Task }>(`/projects/${project.id}/tasks/${task.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  assigneeIds: task.assignees
                    .filter((assignee) => assignee.user.id !== member.user.id)
                    .map((assignee) => assignee.user.id),
                }),
              });
            }

            await apiClient(`/projects/${project.id}/contributors/${member.user.id}`, { method: "DELETE" });
          }
        } catch (error) {
          // A failed step here leaves some tasks already updated and some
          // contributors not yet removed — refetch so the UI reflects the
          // server's actual (partial) state rather than the optimistic form.
          router.refresh();
          throw error;
        }
      }

      const nextMembers: ProjectMember[] = selected.map((user) => {
        const existingMember = project.members.find((member) => member.user.id === user.id);
        return (
          existingMember ?? {
            id: user.id,
            role: "CONTRIBUTOR",
            joinedAt: new Date().toISOString(),
            user,
          }
        );
      });

      onSaved({
        name: formValues.name,
        description: formValues.description || null,
        members: nextMembers,
      });
    } catch (error) {
      if (!isApiError(error)) throw error;

      if (error.status === 400 && error.fieldErrors) {
        applyFieldErrors(error.fieldErrors, setError);
      } else {
        setGeneralError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal open={open} onClose={handleClose} title="Modifier un projet">
      {generalError && (
        <p role="alert" className="alertError">
          {generalError}
        </p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className="formField">
          Titre *
          <Input
            id="edit-project-name"
            required
            aria-required="true"
            disabled={submitting}
            error={errors.name?.message}
            {...register("name")}
          />
        </label>

        <label className="formField">
          Description *
          <Textarea
            id="edit-project-description"
            required
            aria-required="true"
            disabled={submitting}
            error={errors.description?.message}
            {...register("description")}
          />
        </label>

        <ContributorPicker
          id="edit-project-contributors"
          label="Contributeurs"
          selected={selected}
          onAdd={addContributor}
          onRemove={removeContributor}
          disabled={submitting}
          excludeIds={[project.owner.id]}
        />

        <div className={styles.actions}>
          <Button type="submit" variant="primary" loading={submitting} disabled={!canSave}>
            Enregistrer
          </Button>
          <Button type="button" variant="secondary" disabled={submitting} onClick={handleClose}>
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
}

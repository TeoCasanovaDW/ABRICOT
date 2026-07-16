"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
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
import type { ProjectDetail, ProjectMember, Role, UserSummary } from "@/types";
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
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<UserSummary[]>(() => project.members.map((member) => member.user));
  const [newRoles, setNewRoles] = useState<Record<string, Role>>({});
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
      setNewRoles({});
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
    setNewRoles((current) => ({ ...current, [user.id]: "CONTRIBUTOR" }));
    onAnnounce(`${contributorLabel(user)} ajouté aux contributeurs.`);
  };

  const removeContributor = (user: UserSummary) => {
    setSelected((current) => current.filter((existing) => existing.id !== user.id));
    setNewRoles((current) => {
      const next = { ...current };
      delete next[user.id];
      return next;
    });
    onAnnounce(`${contributorLabel(user)} retiré des contributeurs.`);
  };

  const changeNewContributorRole = (user: UserSummary, role: Role) => {
    setNewRoles((current) => ({ ...current, [user.id]: role }));
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
          body: JSON.stringify({ email: user.email, role: newRoles[user.id] ?? "CONTRIBUTOR" }),
        });
      }

      for (const member of removed) {
        await apiClient(`/projects/${project.id}/contributors/${member.user.id}`, { method: "DELETE" });
      }

      const nextMembers: ProjectMember[] = selected.map((user) => {
        const existingMember = project.members.find((member) => member.user.id === user.id);
        return (
          existingMember ?? {
            id: user.id,
            role: newRoles[user.id] ?? "CONTRIBUTOR",
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
        <p role="alert" className={styles.generalError}>
          {generalError}
        </p>
      )}

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          Titre *
          <Input id="edit-project-name" disabled={submitting} error={errors.name?.message} {...register("name")} />
        </label>

        <label className={styles.field}>
          Description *
          <Textarea
            id="edit-project-description"
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

        {addedUsers.length > 0 && (
          <div className={styles.roleList}>
            {addedUsers.map((user) => (
              <label key={user.id} className={styles.field}>
                {`Rôle de ${contributorLabel(user)}`}
                <Select
                  value={newRoles[user.id] ?? "CONTRIBUTOR"}
                  disabled={submitting}
                  onChange={(event) => changeNewContributorRole(user, event.target.value as Role)}
                >
                  <option value="CONTRIBUTOR">Contributeur</option>
                  <option value="ADMIN">Administrateur</option>
                </Select>
              </label>
            ))}
          </div>
        )}

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

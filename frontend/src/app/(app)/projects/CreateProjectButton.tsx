"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LiveRegion } from "@/components/ui/LiveRegion";
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
import type { Project, UserSummary } from "@/types";
import styles from "./CreateProjectButton.module.css";

interface CreateProjectButtonProps {
  label: string;
}

function contributorLabel(user: UserSummary): string {
  return user.name ?? user.email;
}

export function CreateProjectButton({ label }: CreateProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selected, setSelected] = useState<UserSummary[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });

  const openModal = () => setOpen(true);

  const closeModal = () => {
    setOpen(false);
    setGeneralError("");
    setAnnouncement("");
    setSelected([]);
    reset();
  };

  const addContributor = (user: UserSummary) => {
    setSelected((current) => [...current, user]);
    setAnnouncement(`${contributorLabel(user)} ajouté aux contributeurs.`);
  };

  const removeContributor = (user: UserSummary) => {
    setSelected((current) => current.filter((existing) => existing.id !== user.id));
    setAnnouncement(`${contributorLabel(user)} retiré des contributeurs.`);
  };

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError("");

    const payload: { name: string; description?: string; contributors?: string[] } = {
      name: values.name,
    };
    if (values.description) payload.description = values.description;
    if (selected.length > 0) payload.contributors = selected.map((user) => user.email);

    try {
      const { project } = await apiClient<{ project: Project }>("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/projects/${project.id}`);
    } catch (error) {
      if (!isApiError(error)) throw error;

      if (error.status === 400 && error.fieldErrors) {
        applyFieldErrors(error.fieldErrors, setError);
        return;
      }

      setGeneralError(error.message);
      setAnnouncement(error.message);
    }
  });

  return (
    <>
      <Button type="button" onClick={openModal}>
        {label}
      </Button>

      <Modal open={open} onClose={closeModal} title="Créer un projet">
        {generalError && <p className={styles.generalError}>{generalError}</p>}

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            Titre *
            <Input
              id="project-name"
              disabled={isSubmitting}
              error={errors.name?.message}
              {...register("name")}
            />
          </label>

          <label className={styles.field}>
            Description *
            <Textarea
              id="project-description"
              disabled={isSubmitting}
              error={errors.description?.message}
              {...register("description")}
            />
          </label>

          <ContributorPicker
            id="project-contributors"
            label="Contributeurs"
            selected={selected}
            onAdd={addContributor}
            onRemove={removeContributor}
            disabled={isSubmitting}
          />

          <div className={styles.actions}>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
              Ajouter un projet
            </Button>
            <Button type="button" variant="secondary" disabled={isSubmitting} onClick={closeModal}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <LiveRegion message={announcement} />
    </>
  );
}

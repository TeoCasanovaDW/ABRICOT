"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import styles from "./DeleteProjectDialog.module.css";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onClose: () => void;
  onAnnounce: (message: string) => void;
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  open,
  onClose,
  onAnnounce,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setGeneralError("");
    onClose();
  };

  const handleConfirm = async () => {
    setGeneralError("");
    setSubmitting(true);

    try {
      await apiClient(`/projects/${projectId}`, { method: "DELETE" });
      router.push("/projects");
    } catch (error) {
      if (!isApiError(error)) throw error;

      setGeneralError(error.message);
      onAnnounce(error.message);
      if (error.status === 403) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Supprimer le projet">
      {generalError && (
        <p role="alert" className={styles.generalError}>
          {generalError}
        </p>
      )}

      <p className={styles.consequence}>
        Le projet « {projectName} » et toutes ses tâches seront supprimés définitivement. Cette
        action est irréversible.
      </p>

      <div className={styles.actions}>
        <Button type="button" variant="danger" loading={submitting} onClick={handleConfirm}>
          Supprimer le projet
        </Button>
        <Button type="button" variant="secondary" disabled={submitting} onClick={handleClose}>
          Annuler
        </Button>
      </div>
    </Modal>
  );
}

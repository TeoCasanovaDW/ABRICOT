"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import styles from "./DeleteTaskDialog.module.css";

interface DeleteTaskDialogProps {
  projectId: string;
  taskId: string;
  taskTitle: string;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onAnnounce: (message: string) => void;
}

export function DeleteTaskDialog({
  projectId,
  taskId,
  taskTitle,
  open,
  onClose,
  onDeleted,
  onAnnounce,
}: DeleteTaskDialogProps) {
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
      await apiClient(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
      onDeleted();
    } catch (error) {
      if (!isApiError(error)) throw error;

      setGeneralError(error.message);
      onAnnounce(error.message);
      if (error.status === 403 || error.status === 404) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Supprimer la tâche">
      {generalError && (
        <p role="alert" className={styles.generalError}>
          {generalError}
        </p>
      )}

      <p className={styles.consequence}>
        La tâche « {taskTitle} » et ses commentaires seront supprimés définitivement. Cette action
        est irréversible.
      </p>

      <div className={styles.actions}>
        <Button type="button" variant="danger" loading={submitting} onClick={handleConfirm}>
          Supprimer la tâche
        </Button>
        <Button type="button" variant="secondary" disabled={submitting} onClick={handleClose}>
          Annuler
        </Button>
      </div>
    </Modal>
  );
}

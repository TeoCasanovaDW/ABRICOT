"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { Draft } from "@/lib/ai/validateDrafts";
import styles from "./AiComposer.module.css";

interface AiComposerProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onDraftsGenerated: (drafts: Draft[]) => void;
  onAnnounce: (message: string) => void;
}

const WARNING_ID = "ai-composer-warning";

export function AiComposer({ projectId, open, onClose, onDraftsGenerated, onAnnounce }: AiComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setGenerating(false);
    onAnnounce("Génération annulée.");
  };

  const handleClose = () => {
    if (generating) handleCancel();
    setGeneralError("");
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (generating || !prompt.trim()) return;

    setGeneralError("");
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setGenerating(true);
    onAnnounce("Génération des tâches en cours…");

    try {
      const { drafts } = await apiClient<{ drafts: Draft[] }>("/ai/generate-tasks", {
        method: "POST",
        body: JSON.stringify({ projectId, prompt }),
        signal: controller.signal,
      });

      // A cancelled request's response must never populate the draft list,
      // even if it resolves successfully after the abort.
      if (controller.signal.aborted) return;

      abortControllerRef.current = null;
      setGenerating(false);
      onAnnounce("Tâches générées avec succès.");
      onDraftsGenerated(drafts);
    } catch (error) {
      if (controller.signal.aborted) return;

      abortControllerRef.current = null;
      setGenerating(false);
      if (!isApiError(error)) throw error;

      setGeneralError(error.message);
      onAnnounce(error.message);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Générer des tâches avec l'IA" className={styles.modal}>
      {generalError && (
        <p role="alert" className={styles.generalError}>
          {generalError}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          Décrivez les tâches à créer *
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={generating}
            required
            aria-describedby={WARNING_ID}
            placeholder="Ex. : préparer le lancement de la v2 pour la semaine prochaine"
            rows={4}
          />
        </label>

        <p id={WARNING_ID} className={styles.warning}>
          Votre demande, ainsi que le nom et la description du projet, seront envoyés à Mistral pour
          générer les tâches. N&apos;indiquez aucun mot de passe ni identifiant sensible.
        </p>

        <div className={styles.actions}>
          <Button type="submit" variant="brand" loading={generating} disabled={generating || !prompt.trim()}>
            Générer les tâches
          </Button>
          {generating && (
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Annuler
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

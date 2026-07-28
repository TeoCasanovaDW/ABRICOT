"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Astroid } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { Draft } from "@/lib/ai/validateDrafts";
import type { ProjectMember, UserSummary } from "@/types";
import { DraftList } from "./DraftList";
import type { DraftFormValues, DraftItem } from "./DraftList";
import styles from "./AiComposer.module.css";

interface AiComposerProps {
  projectId: string;
  owner: UserSummary;
  members: ProjectMember[];
  open: boolean;
  onClose: () => void;
  onAnnounce: (message: string) => void;
}

const WARNING_ID = "ai-composer-warning";

export function AiComposer({ projectId, owner, members, open, onClose, onAnnounce }: AiComposerProps) {
  const [prompt, setPrompt] = useState("");
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isReview = drafts.length > 0;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [prompt]);

  const removeDraft = (draftId: string) => {
    setDrafts((current) => current.filter((draft) => draft.draftId !== draftId));
  };

  const updateDraft = (draftId: string, values: DraftFormValues) => {
    setDrafts((current) => current.map((draft) => (draft.draftId === draftId ? { ...draft, ...values } : draft)));
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setGenerating(false);
    onAnnounce("Génération annulée.");
  };

  const handleClose = () => {
    if (generating) handleCancel();
    setGeneralError("");
    setPrompt("");
    setDrafts([]);
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
      const { drafts: generated } = await apiClient<{ drafts: Draft[] }>("/ai/generate-tasks", {
        method: "POST",
        body: JSON.stringify({ projectId, prompt }),
        signal: controller.signal,
      });

      // A cancelled request's response must never populate the draft list,
      // even if it resolves successfully after the abort.
      if (controller.signal.aborted) return;

      abortControllerRef.current = null;
      setGenerating(false);
      setPrompt("");
      onAnnounce("Tâches générées avec succès.");
      setDrafts((current) => [
        ...current,
        ...generated.map((draft) => ({ ...draft, draftId: crypto.randomUUID(), assigneeIds: [] as string[] })),
      ]);
    } catch (error) {
      if (controller.signal.aborted) return;

      abortControllerRef.current = null;
      setGenerating(false);
      if (!isApiError(error)) throw error;

      setGeneralError(error.message);
      onAnnounce(error.message);
    }
  };

  const title = (
    <span className={styles.titleRow}>
      <Astroid size={20} fill="currentColor" aria-hidden="true" className={styles.titleIcon} />
      {isReview ? "Vos tâches..." : "Créer une tâche"}
    </span>
  );

  return (
    <Modal open={open} onClose={handleClose} title={title} className={styles.modal}>
      {generalError && (
        <p role="alert" className={styles.generalError}>
          {generalError}
        </p>
      )}

      <div className={styles.body}>
        <div className={styles.main}>
          {isReview && (
            <DraftList
              projectId={projectId}
              drafts={drafts}
              owner={owner}
              members={members}
              onRemove={removeDraft}
              onUpdate={updateDraft}
              onClose={handleClose}
            />
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.inputRow}>
            <label className={styles.srOnly} htmlFor="ai-prompt">
              Décrivez les tâches à créer
            </label>
            <textarea
              id="ai-prompt"
              ref={textareaRef}
              className={styles.textarea}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={generating}
              required
              aria-describedby={WARNING_ID}
              placeholder="Décrivez les tâches que vous souhaitez ajouter..."
              rows={1}
            />
            <button
              type="submit"
              className={styles.submit}
              disabled={generating || !prompt.trim()}
              aria-label="Générer les tâches"
              aria-busy={generating || undefined}
            >
              {generating ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                <Astroid size={18} fill="currentColor" aria-hidden="true" />
              )}
            </button>
          </div>

          {generating && (
            <button type="button" className={styles.cancel} onClick={handleCancel}>
              Annuler
            </button>
          )}

          <p id={WARNING_ID} className={styles.warning}>
            Votre demande, ainsi que le nom et la description du projet, seront envoyés à Mistral pour
            générer les tâches. N&apos;indiquez aucun mot de passe ni identifiant sensible.
          </p>
        </form>
      </div>
    </Modal>
  );
}

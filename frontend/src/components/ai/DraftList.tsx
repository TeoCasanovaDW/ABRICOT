"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { saveDrafts } from "@/lib/ai/saveDrafts";
import type { ProjectMember, UserSummary } from "@/types";
import { DraftCard, draftFormSchema } from "./DraftCard";
import type { DraftFormValues, DraftItem } from "./DraftCard";
import styles from "./DraftList.module.css";

export type { DraftFormValues, DraftItem };

interface DraftListProps {
  projectId: string;
  drafts: DraftItem[];
  owner: UserSummary;
  members: ProjectMember[];
  onRemove: (draftId: string) => void;
  onUpdate: (draftId: string, values: DraftFormValues) => void;
  onClose: () => void;
  onSavingChange: (saving: boolean) => void;
  onAnnounce: (message: string) => void;
}

export function DraftList({
  projectId,
  drafts,
  owner,
  members,
  onRemove,
  onUpdate,
  onClose,
  onSavingChange,
  onAnnounce,
}: DraftListProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleSave = async () => {
    const allValid = drafts.every((draft) => draftFormSchema.safeParse(draft).success);
    if (!allValid) {
      setGeneralError("Corrigez les brouillons invalides avant d'enregistrer.");
      return;
    }

    setGeneralError("");
    setSaving(true);
    onSavingChange(true);

    const total = drafts.length;
    const { succeededIds, failedIds, stopReason } = await saveDrafts({
      projectId,
      drafts,
      onProgress: (current, count) => setProgressMessage(`Création de la tâche ${current} sur ${count}`),
    });

    setProgressMessage("");
    setSaving(false);
    onSavingChange(false);

    // Full success is one atomic reset+close (onClose already clears
    // prompt/errors/drafts and closes the modal) — never routed through the
    // per-draft onRemove loop below, so the review view can't ever render
    // empty-but-still-open in between.
    if (succeededIds.length === total) {
      router.refresh();
      onClose();
      return;
    }

    succeededIds.forEach((draftId) => onRemove(draftId));
    if (succeededIds.length > 0) router.refresh();

    // 401 hands off to session-expiry redirect regardless of how many
    // drafts succeeded beforehand.
    if (stopReason === "unauthorized") {
      router.push("/login");
      return;
    }

    // 403/404 exits the AI flow entirely — the modal is about to unmount, so
    // local generalError would never be seen. Route the explanation through
    // the parent's persistent announcement region instead.
    if (stopReason === "forbidden") {
      onAnnounce("La création des tâches a été interrompue : vous n'avez plus accès à ce projet.");
      onClose();
      return;
    }

    if (succeededIds.length === 0) {
      setGeneralError("Aucune tâche n'a pu être créée. Réessayez.");
      return;
    }

    if (succeededIds.length < total) {
      setGeneralError(
        failedIds.length === 1
          ? "1 tâche n'a pas pu être créée. Corrigez-la et réessayez."
          : `${failedIds.length} tâches n'ont pas pu être créées. Corrigez-les et réessayez.`
      );
    }
  };

  return (
    <div className={styles.list}>
      {generalError && (
        <p role="alert" className="alertError">
          {generalError}
        </p>
      )}

      {drafts.map((draft) => (
        <DraftCard
          key={draft.draftId}
          draft={draft}
          owner={owner}
          members={members}
          onRemove={onRemove}
          onUpdate={onUpdate}
          disabled={saving}
        />
      ))}

      <div className={styles.addRow}>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          loading={saving}
          disabled={saving || drafts.length === 0}
        >
          + Ajouter les tâches
        </Button>
      </div>

      <LiveRegion message={progressMessage} />
    </div>
  );
}

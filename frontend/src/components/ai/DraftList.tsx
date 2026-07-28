"use client";

import { Button } from "@/components/ui/Button";
import type { ProjectMember, UserSummary } from "@/types";
import { DraftCard } from "./DraftCard";
import type { DraftFormValues, DraftItem } from "./DraftCard";
import styles from "./DraftList.module.css";

export type { DraftFormValues, DraftItem };

interface DraftListProps {
  drafts: DraftItem[];
  owner: UserSummary;
  members: ProjectMember[];
  onRemove: (draftId: string) => void;
  onUpdate: (draftId: string, values: DraftFormValues) => void;
}

export function DraftList({ drafts, owner, members, onRemove, onUpdate }: DraftListProps) {
  return (
    <div className={styles.list}>
      {drafts.map((draft) => (
        <DraftCard key={draft.draftId} draft={draft} owner={owner} members={members} onRemove={onRemove} onUpdate={onUpdate} />
      ))}

      <div className={styles.addRow}>
        <Button type="button" variant="primary">
          + Ajouter les tâches
        </Button>
      </div>
    </div>
  );
}

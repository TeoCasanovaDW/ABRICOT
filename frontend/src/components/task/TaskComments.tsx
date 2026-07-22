"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Comment } from "@/types";
import styles from "./TaskComments.module.css";

interface TaskCommentsProps {
  projectId: string;
  taskId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
  onAnnounce: (message: string) => void;
}

function personName(user: { name: string | null; email: string }): string {
  return user.name ?? user.email;
}

function formatCommentDate(createdAt: string): string {
  return new Date(createdAt).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskComments({ projectId, taskId, comments, onCommentAdded, onAnnounce }: TaskCommentsProps) {
  const router = useRouter();
  const currentUser = useAuth();
  const [content, setContent] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (posting || content.trim().length === 0) return;

    setFieldError("");
    setGeneralError("");
    setPosting(true);
    onAnnounce("Envoi du commentaire…");

    try {
      const { comment } = await apiClient<{ comment: Comment }>(
        `/projects/${projectId}/tasks/${taskId}/comments`,
        { method: "POST", body: JSON.stringify({ content }) }
      );
      onCommentAdded(comment);
      setContent("");
      onAnnounce("Commentaire ajouté.");
      router.refresh();
    } catch (error) {
      if (!isApiError(error)) throw error;

      if (error.status === 400 && error.fieldErrors) {
        const contentError = error.fieldErrors.find((fieldErr) => fieldErr.field === "content");
        setFieldError(contentError?.message ?? error.message);
        return;
      }

      setGeneralError(error.message);
      onAnnounce(error.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {comments.length === 0 ? (
        <p className={styles.empty}>Aucun commentaire pour le moment.</p>
      ) : (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.item}>
              <Avatar
                name={personName(comment.author)}
                size={28}
                variant={comment.author.id === currentUser.id ? "default" : "muted"}
                className={styles.avatar}
              />
              <div className={styles.commentBlock}>
                <div className={styles.itemMeta}>
                  <span className={styles.itemAuthor}>{personName(comment.author)}</span>
                  <span className={styles.itemDate}>{formatCommentDate(comment.createdAt)}</span>
                </div>
                <p className={styles.itemContent}>{comment.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {generalError && (
        <p role="alert" className={styles.generalError}>
          {generalError}
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <Avatar name={personName(currentUser)} size={28} variant="default" className={styles.avatar} />
        <div className={styles.formBody}>
          <Textarea
            aria-label="Ajouter un commentaire"
            placeholder="Ajouter un commentaire..."
            className={styles.textarea}
            value={content}
            disabled={posting}
            error={fieldError}
            onChange={(event) => setContent(event.target.value)}
          />
          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="secondary"
              className={styles.sendButton}
              loading={posting}
              disabled={posting || content.trim().length === 0}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

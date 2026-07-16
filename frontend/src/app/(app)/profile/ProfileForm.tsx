"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  applyFieldErrors,
  profileSchema,
  zodResolver,
  type ProfileFormValues,
} from "@/lib/validation";
import type { User } from "@/types";
import styles from "./ProfileForm.module.css";

const MASKED_PASSWORD = "••••••••••••";

export function ProfileForm() {
  const router = useRouter();
  const user = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [baseline, setBaseline] = useState({ name: user.name ?? "", email: user.email });
  const [generalError, setGeneralError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { ...baseline, currentPassword: "", newPassword: "" },
  });

  const startEditing = () => {
    setGeneralError("");
    setConfirmation("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    reset({ ...baseline, currentPassword: "", newPassword: "" });
    setGeneralError("");
    setIsEditing(false);
  };

  // Both action buttons are type="button": swapping the edit trigger for a
  // type="submit" button in the same position triggers a phantom native form
  // submit in Chromium the instant the DOM node is replaced, so saving is
  // always invoked explicitly through handleSubmit instead.
  const onSubmit = handleSubmit(async (values) => {
    setGeneralError("");
    setConfirmation("");

    const profilePayload: Partial<{ name: string; email: string }> = {};
    if (dirtyFields.name) profilePayload.name = values.name;
    if (dirtyFields.email) profilePayload.email = values.email;

    const hasProfileChanges = Object.keys(profilePayload).length > 0;
    const wantsPasswordChange = Boolean(values.currentPassword && values.newPassword);

    if (!hasProfileChanges && !wantsPasswordChange) {
      setIsEditing(false);
      return;
    }

    let nextBaseline = baseline;

    if (hasProfileChanges) {
      try {
        const { user: updatedUser } = await apiClient<{ user: User }>("/auth/profile", {
          method: "PUT",
          body: JSON.stringify(profilePayload),
        });
        nextBaseline = { name: updatedUser.name ?? "", email: updatedUser.email };
        setBaseline(nextBaseline);
        // Marks name/email clean against the new baseline so a password-only
        // retry below never resends this already-applied profile update.
        reset(
          { ...nextBaseline, currentPassword: values.currentPassword, newPassword: values.newPassword },
          { keepErrors: true }
        );
      } catch (error) {
        if (!isApiError(error)) throw error;

        if (error.status === 400 && error.fieldErrors) {
          applyFieldErrors(error.fieldErrors, setError);
          return;
        }
        if (error.status === 409) {
          setError("email", { type: "server", message: error.message });
          return;
        }
        setGeneralError(error.message);
        return;
      }
    }

    if (wantsPasswordChange) {
      try {
        await apiClient("/auth/password", {
          method: "PUT",
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        });
      } catch (error) {
        if (!isApiError(error)) throw error;

        // The profile update above (if any) already succeeded — stay in edit
        // mode with the new values and let the user retry just the password.
        if (error.status === 400 && error.fieldErrors) {
          applyFieldErrors(error.fieldErrors, setError);
        } else if (error.status === 401) {
          setError("currentPassword", { type: "server", message: error.message });
        } else {
          setGeneralError(error.message);
        }
        return;
      }
    }

    setConfirmation("Profil mis à jour.");
    setIsEditing(false);
    reset({ ...nextBaseline, currentPassword: "", newPassword: "" });
    router.refresh();
  });

  return (
    <div className={styles.wrapper}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mon compte</h1>
          <p className={styles.subtitle}>{baseline.name || baseline.email}</p>
        </div>

        {generalError && (
          <p role="alert" className={styles.generalError}>
            {generalError}
          </p>
        )}
        {confirmation && (
          <p role="status" className={styles.confirmation}>
            {confirmation}
          </p>
        )}

        <form className={styles.form} noValidate>
          <label className={styles.field}>
            Nom
            <Input
              id="name"
              autoComplete="name"
              disabled={!isEditing || isSubmitting}
              error={errors.name?.message}
              {...register("name")}
            />
          </label>

          <label className={styles.field}>
            E-mail
            <Input
              id="email"
              type="email"
              autoComplete="email"
              disabled={!isEditing || isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />
          </label>

          {isEditing ? (
            <>
              <label className={styles.field}>
                Mot de passe actuel
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  error={errors.currentPassword?.message}
                  {...register("currentPassword")}
                />
              </label>

              <label className={styles.field}>
                Nouveau mot de passe
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  error={errors.newPassword?.message}
                  {...register("newPassword")}
                />
              </label>
            </>
          ) : (
            <label className={styles.field}>
              Mot de passe
              <Input id="password-display" type="password" value={MASKED_PASSWORD} disabled readOnly />
            </label>
          )}

          <div className={styles.actions}>
            {isEditing ? (
              <>
                <Button type="button" variant="primary" loading={isSubmitting} disabled={isSubmitting} onClick={onSubmit}>
                  Enregistrer les modifications
                </Button>
                <Button type="button" variant="secondary" disabled={isSubmitting} onClick={cancelEditing}>
                  Annuler
                </Button>
              </>
            ) : (
              <Button type="button" variant="primary" onClick={startEditing}>
                Modifier les informations
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

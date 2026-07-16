"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import {
  applyFieldErrors,
  registerSchema,
  zodResolver,
  type RegisterFormValues,
} from "@/lib/validation";
import styles from "./RegisterForm.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [generalError, setGeneralError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError("");

    try {
      await apiClient("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push("/dashboard");
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
    }
  });

  return (
    <div className={styles.wrapper}>
      <Logo className={styles.logo} />

      <div className={styles.centerZone}>
        <h1 className={styles.heading}>Inscription</h1>

        {generalError && (
          <p role="alert" className={styles.generalError}>
            {generalError}
          </p>
        )}

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            Nom
            <Input
              id="name"
              autoComplete="name"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />
          </label>

          <label className={styles.field}>
            Mot de passe
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />
          </label>

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            className={styles.submit}
          >
            S’inscrire
          </Button>
        </form>
      </div>

      <p className={styles.altAction}>
        Déjà inscrit ? <Link href="/login" className={styles.link}>Se connecter</Link>
      </p>
    </div>
  );
}

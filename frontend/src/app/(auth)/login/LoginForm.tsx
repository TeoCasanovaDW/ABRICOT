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
import { loginSchema, zodResolver, type LoginFormValues } from "@/lib/validation";
import styles from "./LoginForm.module.css";

export function LoginForm() {
  const router = useRouter();
  const [generalError, setGeneralError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError("");

    try {
      await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      router.push("/dashboard");
    } catch (error) {
      if (!isApiError(error)) throw error;

      // Backend never reveals which field was wrong (unknown email vs bad
      // password) — always a single form-level message, never per-field.
      setGeneralError(error.message);
    }
  });

  return (
    <div className={styles.wrapper}>
      <Logo className={styles.logo} />

      <div className={styles.centerZone}>
        <h1 className={styles.heading}>Connexion</h1>

        {generalError && (
          <p role="alert" className={styles.generalError}>
            {generalError}
          </p>
        )}

        <form className={styles.form} onSubmit={onSubmit} noValidate>
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
              autoComplete="current-password"
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
            Se connecter
          </Button>
        </form>
      </div>

      <p className={styles.altAction}>
        Pas encore de compte ? <Link href="/register" className={styles.link}>S’inscrire</Link>
      </p>
    </div>
  );
}

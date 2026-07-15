"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./error.module.css";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.wrapper} role="alert">
      <h1>Une erreur est survenue</h1>
      <p>Quelque chose s&apos;est mal passé. Vous pouvez réessayer.</p>
      <Button onClick={() => reset()}>Réessayer</Button>
    </div>
  );
}

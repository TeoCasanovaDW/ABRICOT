"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import styles from "./DashboardHeader.module.css";

export function DashboardHeader() {
  const user = useAuth();
  const fullName = user.name || user.email;

  return (
    <div className={styles.header}>
      <h1>Tableau de bord</h1>
      <p className={styles.subtitle}>
        {fullName ? `Bonjour ${fullName}, voici un aperçu de vos projets et tâches` : "Bonjour, voici un aperçu de vos projets et tâches"}
      </p>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import styles from "./DashboardHeader.module.css";

interface DashboardHeaderProps {
  children?: ReactNode;
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
  const user = useAuth();
  const fullName = user.name || user.email;

  return (
    <div className={styles.header}>
      <div className={styles.titleBlock}>
        <h1>Tableau de bord</h1>
        <p className={styles.subtitle}>
          {fullName ? `Bonjour ${fullName}, voici un aperçu de vos projets et tâches` : "Bonjour, voici un aperçu de vos projets et tâches"}
        </p>
      </div>
      {children}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getSessionToken } from "@/lib/session";
import { Logo } from "@/components/ui/Logo";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default async function NotFound() {
  const token = await getSessionToken();

  return (
    <main className={`container ${styles.wrapper}`}>
      <Logo />
      <h1>Page introuvable</h1>
      <p>Cette page n&apos;existe pas.</p>
      <Link href={token ? "/dashboard" : "/login"}>
        {token ? "Retour au tableau de bord" : "Retour à la connexion"}
      </Link>
    </main>
  );
}

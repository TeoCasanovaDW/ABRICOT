import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projet introuvable",
};

export default function ProjectNotFound() {
  return (
    <div>
      <h1>Projet introuvable</h1>
      <p>Ce projet n&apos;existe pas ou a été supprimé.</p>
      <Link href="/projects">Retour aux projets</Link>
    </div>
  );
}

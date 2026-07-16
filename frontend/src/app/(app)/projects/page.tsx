import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { apiServer } from "@/lib/api/server";
import { ProjectCard } from "@/components/project/ProjectCard";
import { CreateProjectButton } from "./CreateProjectButton";
import type { ProjectListItem } from "@/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Projets",
};

export default async function ProjectsPage() {
  const { projects } = await apiServer<{ projects: ProjectListItem[] }>("/projects");

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div>
          <h1>Mes projets</h1>
          <p className={styles.subtitle}>Gérez vos projets</p>
        </div>
        <CreateProjectButton label="+ Créer un projet" />
      </div>

      {projects.length === 0 ? (
        <div className={styles.emptyState}>
          <FolderKanban size={40} aria-hidden="true" className={styles.emptyIcon} />
          <p>Vous n&apos;avez pas encore de projet.</p>
          <CreateProjectButton label="Créer un projet" />
        </div>
      ) : (
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

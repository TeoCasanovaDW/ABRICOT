import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, List, Search } from "lucide-react";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { sortTasks } from "@/lib/sort";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TaskCard } from "@/components/task/TaskCard";
import { ProjectOverview } from "./ProjectOverview";
import type { ProjectDetail, Task } from "@/types";
import styles from "./page.module.css";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;

  try {
    const { project } = await apiServer<{ project: ProjectDetail }>(`/projects/${projectId}`);
    return { title: project.name };
  } catch {
    return { title: "Projet" };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  let project: ProjectDetail;
  try {
    ({ project } = await apiServer<{ project: ProjectDetail }>(`/projects/${projectId}`));
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      notFound();
    }

    if (isApiError(error) && error.status === 403) {
      return (
        <div>
          <h1>Accès restreint</h1>
          <p>Vous n&apos;avez pas accès à ce projet.</p>
          <Link href="/projects">Retour aux projets</Link>
        </div>
      );
    }

    throw error;
  }

  const { tasks: rawTasks } = await apiServer<{ tasks: Task[] }>(`/projects/${projectId}/tasks`);
  const tasks = sortTasks(rawTasks);
  const total = tasks.length;

  return (
    <div className={styles.wrapper}>
      <ProjectOverview project={project} />

      <Card className={styles.taskPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.headingBlock}>
            <h2 className={styles.heading}>Tâches</h2>
            <p className={styles.subheading}>Par ordre de priorité</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.viewToggle} role="group" aria-label="Affichage des tâches">
              <button
                type="button"
                className={`${styles.viewButton} ${styles.viewButtonActive}`}
                aria-pressed="true"
              >
                <List size={16} aria-hidden="true" />
                Liste
              </button>
              <button type="button" className={`${styles.viewButton} ${styles.viewButtonCalendar}`} aria-pressed="false">
                <Calendar size={16} aria-hidden="true" />
                Calendrier
              </button>
            </div>

            <div className={styles.statusField}>
              <Select aria-label="Statut" defaultValue="ALL">
                <option value="ALL">Tous les statuts</option>
                <option value="TODO">À faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="DONE">Terminée</option>
              </Select>
            </div>

            <div className={styles.searchField}>
              <Search size={16} aria-hidden="true" className={styles.searchIcon} />
              <Input
                type="search"
                aria-label="Rechercher une tâche"
                placeholder="Rechercher une tâche"
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>

        {total === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune tâche pour le moment.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

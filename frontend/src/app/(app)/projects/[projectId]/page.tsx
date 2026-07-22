import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import { isApiError } from "@/lib/api/errors";
import { sortTasks } from "@/lib/sort";
import { Card } from "@/components/ui/Card";
import { TaskFilters } from "@/components/task/TaskFilters";
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

  return (
    <div className={styles.wrapper}>
      <ProjectOverview project={project} />

      <Card className={styles.taskPanel}>
        <TaskFilters projectId={projectId} owner={project.owner} members={project.members} tasks={tasks} />
      </Card>
    </div>
  );
}

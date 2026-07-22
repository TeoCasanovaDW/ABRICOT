import type { Metadata } from "next";
import { apiServer } from "@/lib/api/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import type { Project, Task } from "@/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// This endpoint includes `project`, unlike the task CRUD endpoints.
type AssignedTask = Task & { project: Pick<Project, "id" | "name"> };

// `tasks` here is already scoped to the current user's assigned tasks only.
type ProjectWithTasks = Project & { tasks: Task[] };

export default async function DashboardPage() {
  const [{ tasks }, { projects }] = await Promise.all([
    apiServer<{ tasks: AssignedTask[] }>("/dashboard/assigned-tasks"),
    apiServer<{ projects: ProjectWithTasks[] }>("/dashboard/projects-with-tasks"),
  ]);

  return (
    <div className={styles.wrapper}>
      <DashboardHeader />
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
}

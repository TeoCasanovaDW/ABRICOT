import type { Metadata } from "next";
import { apiServer } from "@/lib/api/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { AssignedTaskList, type AssignedTask } from "@/components/dashboard/AssignedTaskList";
import { CreateProjectButton } from "@/components/project/CreateProjectButton";
import type { Project, Task } from "@/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// `tasks` here is already scoped to the current user's assigned tasks only.
type ProjectWithTasks = Project & { tasks: Task[] };

export default async function DashboardPage() {
  const [{ tasks }] = await Promise.all([
    apiServer<{ tasks: AssignedTask[] }>("/dashboard/assigned-tasks"),
    apiServer<{ projects: ProjectWithTasks[] }>("/dashboard/projects-with-tasks"),
  ]);

  return (
    <div className={styles.wrapper}>
      <DashboardHeader>
        <CreateProjectButton label="+ Créer un projet" />
      </DashboardHeader>
      <DashboardTabs
        assignedView={<AssignedTaskList tasks={tasks} />}
        kanbanView={<p>Vue Kanban à venir.</p>}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { apiServer } from "@/lib/api/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { AssignedTaskList, type AssignedTask } from "@/components/dashboard/AssignedTaskList";
import { KanbanView } from "@/components/dashboard/KanbanView";
import { CreateProjectButton } from "@/components/project/CreateProjectButton";
import type { Project, Task } from "@/types";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

// GET /dashboard/projects-with-tasks only includes `owner` and `tasks`
// (dashboardController.getProjectsWithTasks) — unlike every other
// project-returning endpoint, it does not include `members`, and it never
// adds `userRole`/`taskStats`. `tasks` here is already scoped to the current
// user's assigned tasks only.
type DashboardProjectWithTasks = Pick<
  Project,
  "id" | "name" | "description" | "createdAt" | "updatedAt" | "ownerId" | "owner"
> & { tasks: Task[] };

export default async function DashboardPage() {
  // `projects-with-tasks` result is currently unconsumed by any view (specs/08
  // "Data sources") — fetched and kept for now pending a product decision on
  // whether to drop it, not consumed here.
  const [{ tasks }] = await Promise.all([
    apiServer<{ tasks: AssignedTask[] }>("/dashboard/assigned-tasks"),
    apiServer<{ projects: DashboardProjectWithTasks[] }>("/dashboard/projects-with-tasks"),
  ]);

  return (
    <div className={styles.wrapper}>
      <DashboardHeader>
        <CreateProjectButton label="+ Créer un projet" />
      </DashboardHeader>
      <DashboardTabs
        assignedView={<AssignedTaskList tasks={tasks} />}
        kanbanView={<KanbanView tasks={tasks} />}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { apiServer } from "@/lib/api/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { AssignedTaskList, type AssignedTask } from "@/components/dashboard/AssignedTaskList";
import { KanbanView } from "@/components/dashboard/KanbanView";
import { CreateProjectButton } from "@/components/project/CreateProjectButton";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function DashboardPage() {
  const { tasks } = await apiServer<{ tasks: AssignedTask[] }>("/dashboard/assigned-tasks");

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

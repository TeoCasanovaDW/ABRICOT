"use client";

import { useMemo, useState } from "react";
import { Calendar, List, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TaskList } from "@/components/task/TaskList";
import type { ProjectMember, Task, TaskStatus, UserSummary } from "@/types";
import styles from "./TaskFilters.module.css";

type StatusFilter = TaskStatus | "ALL";

interface TaskFiltersProps {
  projectId: string;
  owner: UserSummary;
  members: ProjectMember[];
  tasks: Task[];
}

export function TaskFilters({ projectId, owner, members, tasks }: TaskFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (status !== "ALL" && task.status !== status) return false;
      if (query && !task.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [tasks, search, status]);

  return (
    <>
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
            <Select
              aria-label="Statut"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aucune tâche pour le moment.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aucune tâche ne correspond à votre recherche.</p>
        </div>
      ) : (
        <TaskList
          projectId={projectId}
          owner={owner}
          members={members}
          tasks={filteredTasks}
          className={styles.list}
        />
      )}
    </>
  );
}

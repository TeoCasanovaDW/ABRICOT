"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { LiveRegion } from "@/components/ui/LiveRegion";
import styles from "./TaskSearchFilter.module.css";

interface FilterableTask {
  title: string;
}

interface TaskSearchFilterProps<T extends FilterableTask> {
  tasks: T[];
  emptyMessage: string;
  noResultsMessage: string;
  header?: ReactNode;
  children: (filteredTasks: T[]) => ReactNode;
}

export function TaskSearchFilter<T extends FilterableTask>({
  tasks,
  emptyMessage,
  noResultsMessage,
  header,
  children,
}: TaskSearchFilterProps<T>) {
  const [search, setSearch] = useState("");

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => !query || task.title.toLowerCase().includes(query));
  }, [tasks, search]);

  const announcement =
    tasks.length === 0
      ? ""
      : filteredTasks.length === 0
        ? noResultsMessage
        : `${filteredTasks.length} tâche${filteredTasks.length > 1 ? "s" : ""} affichée${filteredTasks.length > 1 ? "s" : ""}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.controls}>
        {header}

        <div className={styles.searchField}>
          <Input
            type="search"
            aria-label="Rechercher une tâche par titre"
            placeholder="Rechercher une tâche"
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Search size={16} aria-hidden="true" className={styles.searchIcon} />
        </div>
      </div>

      <LiveRegion message={announcement} />

      {tasks.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : filteredTasks.length === 0 ? (
        <p className={styles.emptyState}>{noResultsMessage}</p>
      ) : (
        children(filteredTasks)
      )}
    </div>
  );
}

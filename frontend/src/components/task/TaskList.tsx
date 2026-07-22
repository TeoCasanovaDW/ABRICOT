"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import type { ProjectMember, Task, UserSummary } from "@/types";

interface TaskListProps {
  projectId: string;
  owner: UserSummary;
  members: ProjectMember[];
  tasks: Task[];
  className?: string;
}

export function TaskList({ projectId, owner, members, tasks, className }: TaskListProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [announcement, setAnnouncement] = useState("");

  return (
    <>
      <div className={className}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => setSelectedTask(task)}
            // Deletion confirmation isn't built yet — this is a ready hook for it.
            onDelete={() => {}}
          />
        ))}
      </div>

      <TaskModal
        key={selectedTask?.id ?? "closed"}
        projectId={projectId}
        owner={owner}
        members={members}
        task={selectedTask ?? undefined}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onSuccess={() => {
          setSelectedTask(null);
          router.refresh();
        }}
        onAnnounce={setAnnouncement}
      />

      <LiveRegion message={announcement} />
    </>
  );
}

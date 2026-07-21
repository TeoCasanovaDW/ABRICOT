"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Astroid } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { useAuth } from "@/lib/auth/AuthContext";
import { TaskModal } from "@/components/task/TaskModal";
import { DeleteProjectDialog } from "./DeleteProjectDialog";
import { EditProjectModal } from "./EditProjectModal";
import type { ProjectDetail, ProjectMember } from "@/types";
import styles from "./ProjectOverview.module.css";

interface ProjectOverviewProps {
  project: ProjectDetail;
}

function memberName(user: { name: string | null; email: string }): string {
  return user.name ?? user.email;
}

function peopleLabel(count: number): string {
  return count <= 1 ? `${count} personne` : `${count} personnes`;
}

export function ProjectOverview({ project: initialProject }: ProjectOverviewProps) {
  const router = useRouter();
  const currentUser = useAuth();
  const [project, setProject] = useState(initialProject);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const isOwner = project.owner.id === currentUser.id;
  const canEdit = isOwner || project.userRole === "ADMIN";
  const ownerName = memberName(project.owner);
  const teamCount = project.members.length + 1;

  const handleSaved = (result: { name: string; description: string | null; members: ProjectMember[] }) => {
    setProject((current) => ({ ...current, ...result }));
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <Link href="/projects" className={styles.backLink} aria-label="Retour aux projets">
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>

          <div className={styles.headerMain}>
            <div className={styles.titleRow}>
              <h1 className={styles.name}>{project.name}</h1>
              {canEdit && (
                <button type="button" className={styles.editAction} onClick={() => setIsModalOpen(true)}>
                  Modifier
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  className={styles.deleteAction}
                  aria-label="Supprimer le projet"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 size={16} fill="currentColor" aria-hidden="true" />
                  Supprimer
                </button>
              )}
            </div>
            {project.description && <p className={styles.description}>{project.description}</p>}
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button type="button" variant="primary" onClick={() => setIsTaskModalOpen(true)}>
            Créer une tâche
          </Button>
          <Button type="button" variant="brand">
            <Astroid  size={16} fill="currentColor" aria-hidden="true"/>
            IA
          </Button>
        </div>
      </div>

      <div className={styles.contributorPanel}>
        <div className={styles.contributorInfo}>
          <span className={styles.contributorLabel}>Contributeurs</span>
          <span className={styles.contributorCount}>{peopleLabel(teamCount)}</span>
        </div>

        <div className={styles.contributorGroup}>
          <div className={styles.contributorItem}>
            <Avatar name={ownerName} size={32} />
            <Badge status="OWNER" />
          </div>
          {project.members.map((member) => (
            <div key={member.id} className={styles.contributorItem}>
              <Avatar name={memberName(member.user)} size={24} className={styles.contributorAvatar} />
              <span className={styles.nameBadge}>{memberName(member.user)}</span>
            </div>
          ))}
        </div>
      </div>

      {canEdit && (
        <EditProjectModal
          project={project}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
          onAnnounce={setAnnouncement}
        />
      )}

      {isOwner && (
        <DeleteProjectDialog
          projectId={project.id}
          projectName={project.name}
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onAnnounce={setAnnouncement}
        />
      )}

      <TaskModal
        projectId={project.id}
        owner={project.owner}
        members={project.members}
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreated={() => {
          setIsTaskModalOpen(false);
          router.refresh();
        }}
        onAnnounce={setAnnouncement}
      />

      <LiveRegion message={announcement} />
    </div>
  );
}

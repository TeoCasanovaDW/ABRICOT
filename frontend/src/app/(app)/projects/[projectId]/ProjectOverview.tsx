"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { LiveRegion } from "@/components/ui/LiveRegion";
import { useAuth } from "@/lib/auth/AuthContext";
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
  const [announcement, setAnnouncement] = useState("");

  const canEdit = project.owner.id === currentUser.id || project.userRole === "ADMIN";
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
          </div>
          {project.description && <p className={styles.description}>{project.description}</p>}
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

      <LiveRegion message={announcement} />
    </div>
  );
}

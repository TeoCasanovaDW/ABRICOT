import Link from "next/link";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ProjectListItem } from "@/types";
import styles from "./ProjectCard.module.css";

interface ProjectCardProps {
  project: ProjectListItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { name, description, owner, members, taskStats } = project;
  const ownerName = owner.name ?? owner.email;
  const teamCount = members.length + 1;
  const teamLabel = `Équipe (${teamCount})`;

  return (
    <Link href={`/projects/${project.id}`} className={styles.link}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.name}>{name}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>

        <div className={styles.progress}>
          {taskStats.total === 0 ? (
            <p className={styles.noTasks}>Aucune tâche pour le moment</p>
          ) : (
            <ProgressBar
              label="Progression"
              completed={taskStats.completed}
              total={taskStats.total}
            />
          )}
        </div>

        <div className={styles.team}>
          <div className={styles.teamHeader}>
            <Users size={16} aria-hidden="true" />
            <p className={styles.teamLabel}>{teamLabel}</p>
          </div>
          <div className={styles.avatars}>
            <div className={styles.ownerAvatar}>
              <Avatar name={ownerName} size={32} />
              <Badge status="OWNER" />
            </div>
            {members.length > 0 && (
              <div className={styles.avatarStack} aria-label={`${members.length} contributeur(s)`}>
                {members.map((member) => (
                  <Avatar
                    key={member.id}
                    name={member.user.name ?? member.user.email}
                    size={28}
                    className={styles.stackedAvatar}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

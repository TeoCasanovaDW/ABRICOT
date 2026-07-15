import type { Metadata } from "next";
import { apiServer } from "@/lib/api/server";
import type { ProjectDetail } from "@/types";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;

  try {
    const { project } = await apiServer<{ project: ProjectDetail }>(`/projects/${projectId}`);
    return { title: project.name };
  } catch {
    return { title: "Projet" };
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  return <h1>Projet {projectId}</h1>;
}

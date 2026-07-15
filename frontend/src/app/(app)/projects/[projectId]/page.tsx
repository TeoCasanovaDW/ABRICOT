interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  return (
    <main className="container">
      <h1>Projet {projectId}</h1>
    </main>
  );
}

import { ProjectOwnerProjectDetailPage } from '@/src/features/project-owner/pages/ProjectOwnerProjectDetailPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ProjectOwnerProjectDetailPage projectId={projectId} />;
}

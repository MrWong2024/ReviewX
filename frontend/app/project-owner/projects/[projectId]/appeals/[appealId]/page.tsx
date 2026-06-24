import { ProjectOwnerAppealDetailPage } from '@/src/features/project-owner/pages/ProjectOwnerAppealDetailPage';

type PageProps = {
  params: Promise<{
    appealId: string;
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { appealId, projectId } = await params;

  return (
    <ProjectOwnerAppealDetailPage appealId={appealId} projectId={projectId} />
  );
}

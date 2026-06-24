import { ProjectAdminAppealDetailPage } from '@/src/features/admin/pages/ProjectAdminAppealDetailPage';

type PageProps = {
  params: Promise<{
    appealId: string;
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { appealId, projectId } = await params;

  return (
    <ProjectAdminAppealDetailPage appealId={appealId} projectId={projectId} />
  );
}

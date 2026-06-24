import { ProjectAdminAppealsPage } from '@/src/features/admin/pages/ProjectAdminAppealsPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ProjectAdminAppealsPage projectId={projectId} />;
}

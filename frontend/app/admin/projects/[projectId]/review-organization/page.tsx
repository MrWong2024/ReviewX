import { ProjectReviewOrganizationPage } from '@/src/features/admin/pages/ProjectReviewOrganizationPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ProjectReviewOrganizationPage projectId={projectId} />;
}

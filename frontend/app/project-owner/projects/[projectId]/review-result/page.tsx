import { ProjectOwnerReviewResultPage } from '@/src/features/project-owner/pages/ProjectOwnerReviewResultPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ProjectOwnerReviewResultPage projectId={projectId} />;
}

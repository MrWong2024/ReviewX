import { ExpertReviewTaskDetailPage } from '@/src/features/expert/pages/ExpertReviewTaskDetailPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ExpertReviewTaskDetailPage projectId={projectId} />;
}

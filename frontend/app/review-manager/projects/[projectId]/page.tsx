import { ReviewManagerProjectOverviewPage } from '@/src/features/review-manager/pages/ReviewManagerProjectOverviewPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ReviewManagerProjectOverviewPage projectId={projectId} />;
}

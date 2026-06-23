import { ReviewManagerProjectDetailPage } from '@/src/features/review-manager/pages/ReviewManagerProjectDetailPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ReviewManagerProjectDetailPage projectId={projectId} />;
}

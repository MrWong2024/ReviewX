import { ReviewManagerProjectAppealDetailPage } from '@/src/features/review-manager/pages/ReviewManagerProjectAppealDetailPage';

type PageProps = {
  params: Promise<{
    appealId: string;
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { appealId, projectId } = await params;

  return (
    <ReviewManagerProjectAppealDetailPage
      appealId={appealId}
      projectId={projectId}
    />
  );
}

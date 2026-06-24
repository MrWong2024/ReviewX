import { ReviewManagerProjectReviewOrganizationPage } from '@/src/features/review-manager/pages/ReviewManagerProjectReviewOrganizationPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ReviewManagerProjectReviewOrganizationPage projectId={projectId} />;
}

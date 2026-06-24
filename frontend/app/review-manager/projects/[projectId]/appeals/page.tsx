import { ReviewManagerProjectAppealsPage } from '@/src/features/review-manager/pages/ReviewManagerProjectAppealsPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ReviewManagerProjectAppealsPage projectId={projectId} />;
}

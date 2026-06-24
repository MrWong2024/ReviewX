import { ReviewManagerProjectConsensusPage } from '@/src/features/review-manager/pages/ReviewManagerProjectConsensusPage';

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;

  return <ReviewManagerProjectConsensusPage projectId={projectId} />;
}

'use client';

import { ReviewManagerProjectDetailPage } from './ReviewManagerProjectDetailPage';

type ReviewManagerProjectConsensusPageProps = {
  projectId: string;
};

export function ReviewManagerProjectConsensusPage({
  projectId,
}: ReviewManagerProjectConsensusPageProps) {
  return <ReviewManagerProjectDetailPage projectId={projectId} />;
}

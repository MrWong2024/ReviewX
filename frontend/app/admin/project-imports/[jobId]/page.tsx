import { ProjectImportDetailPage } from '@/src/features/admin/pages/ProjectImportDetailPage';

type PageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { jobId } = await params;

  return <ProjectImportDetailPage jobId={jobId} />;
}

import DashboardWrapper from '@/app/dashboard/components/DashboardWrapper';

interface PageProps { params: Promise<{ id: string }> }

export default async function TorrentPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <DashboardWrapper>
      <TorrentDetailContentWrapper torrentId={id} />
    </DashboardWrapper>
  );
}

async function TorrentDetailContentWrapper({ torrentId }: { torrentId: string }) {
  const TorrentDetailContent = (await import('./components/TorrentDetailContent')).default;
  return <TorrentDetailContent torrentId={torrentId} />;
}



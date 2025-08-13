import DashboardWrapper from '@/app/dashboard/components/DashboardWrapper';
import { getPreferredLanguage, getTranslations } from '@/app/lib/server-i18n';
import { I18nProvider } from '@/app/hooks/I18nProvider';
import { headers } from 'next/headers';

interface PageProps { params: Promise<{ id: string }> }

export default async function TorrentPage({ params }: PageProps) {
  const { id } = await params;
  const hdrs = headers();
  const language = await getPreferredLanguage(hdrs as unknown as Headers);
  const resources = getTranslations(language);
  return (
    <DashboardWrapper>
      <I18nProvider resources={resources as unknown as Record<string, unknown>}>
        <TorrentDetailContentWrapper torrentId={id} />
      </I18nProvider>
    </DashboardWrapper>
  );
}

async function TorrentDetailContentWrapper({ torrentId }: { torrentId: string }) {
  const TorrentDetailContent = (await import('./components/TorrentDetailContent')).default;
  return <TorrentDetailContent torrentId={torrentId} />;
}



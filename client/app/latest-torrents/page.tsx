import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '@/app/dashboard/components/DashboardWrapper';
import LatestTorrentsClient from './components/LatestTorrentsClient';
import { serverT, getPreferredLanguage } from '@/app/lib/server-i18n';

export async function generateMetadata() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);
  
  return {
    title: serverT('latestTorrents.pageTitle', language),
  };
}

export default async function LatestTorrentsPage() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Server-side translations
  const translations = {
    title: serverT('latestTorrents.title', language),
    subtitle: serverT('latestTorrents.subtitle', language),
    noTorrents: serverT('latestTorrents.noTorrents', language),
    size: serverT('latestTorrents.size', language),
    uploader: serverT('latestTorrents.uploader', language),
    category: serverT('latestTorrents.category', language),
    seeders: serverT('latestTorrents.seeders', language),
    leechers: serverT('latestTorrents.leechers', language),
    completed: serverT('latestTorrents.completed', language),
    uploaded: serverT('latestTorrents.uploaded', language),
    previous: serverT('latestTorrents.previous', language),
    next: serverT('latestTorrents.next', language),
    page: serverT('latestTorrents.page', language),
    of: serverT('latestTorrents.of', language),
    torrent: {
      title: serverT('latestTorrents.torrent.title', language),
      size: serverT('latestTorrents.torrent.size', language),
      category: serverT('latestTorrents.torrent.category', language),
      date: serverT('latestTorrents.torrent.date', language),
      seeders: serverT('latestTorrents.torrent.seeders', language),
      leechers: serverT('latestTorrents.torrent.leechers', language),
      completed: serverT('latestTorrents.torrent.completed', language),
    }
  };

  return (
    <DashboardWrapper>
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text mb-2">
            {translations.title}
          </h1>
          <p className="text-text-secondary">
            {translations.subtitle}
          </p>
        </div>

        <Suspense fallback={
          <div className="bg-surface rounded-lg border border-border p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-text-secondary/10 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-text-secondary/10 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <LatestTorrentsClient translations={translations} />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}

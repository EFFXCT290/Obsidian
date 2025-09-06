import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from './components/DashboardWrapper';
import DashboardClient from './components/DashboardClient';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';

export default async function DashboardPage() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Server-side translations
  const translations = {
    latestTorrents: serverT('dashboard.latestTorrents', language),
    pinnedAnnouncements: serverT('dashboard.pinnedAnnouncements', language),
    viewAll: serverT('dashboard.viewAll', language),
    noTorrents: serverT('dashboard.noTorrents', language),
    noAnnouncements: serverT('dashboard.noAnnouncements', language),
    size: serverT('dashboard.size', language),
    uploader: serverT('dashboard.uploader', language),
    category: serverT('dashboard.category', language),
    seeders: serverT('dashboard.seeders', language),
    leechers: serverT('dashboard.leechers', language),
    completed: serverT('dashboard.completed', language),
    uploaded: serverT('dashboard.uploaded', language),
    by: serverT('dashboard.by', language),
    previous: serverT('dashboard.previous', language),
    next: serverT('dashboard.next', language),
    page: serverT('dashboard.page', language),
    of: serverT('dashboard.of', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4">
        <Suspense fallback={
          <div className="space-y-6">
            {/* Pinned Announcements Skeleton */}
            <div className="bg-surface rounded-lg border border-border p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text">{translations.pinnedAnnouncements}</h2>
                <div className="h-8 w-20 bg-text-secondary rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="h-4 bg-text-secondary rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-text-secondary rounded w-1/3"></div>
                </div>
              </div>
            </div>

            {/* Latest Torrents Skeleton */}
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text">{translations.latestTorrents}</h2>
                <div className="h-8 w-20 bg-text-secondary rounded animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                    <div className="h-4 bg-text-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-text-secondary rounded w-1/2 mb-2"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-text-secondary rounded w-16"></div>
                      <div className="h-3 bg-text-secondary rounded w-20"></div>
                      <div className="h-3 bg-text-secondary rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }>
          <DashboardClient translations={translations} />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}



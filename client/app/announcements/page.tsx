import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import AnnouncementsClient from './components/AnnouncementsClient';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Pinned Announcements Skeleton */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-5 w-5 bg-text-secondary rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-text-secondary rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg bg-primary/5 animate-pulse">
            <div className="h-5 bg-text-secondary rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-text-secondary rounded w-full mb-2"></div>
            <div className="h-4 bg-text-secondary rounded w-2/3 mb-3"></div>
            <div className="flex items-center space-x-4">
              <div className="h-3 bg-text-secondary rounded w-32"></div>
              <div className="h-3 bg-text-secondary rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>

      {/* All Announcements Skeleton */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="h-6 w-40 bg-text-secondary rounded animate-pulse mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
              <div className="h-5 bg-text-secondary rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-text-secondary rounded w-full mb-2"></div>
              <div className="h-4 bg-text-secondary rounded w-3/4 mb-3"></div>
              <div className="flex items-center space-x-4">
                <div className="h-3 bg-text-secondary rounded w-32"></div>
                <div className="h-3 bg-text-secondary rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function AnnouncementsPage() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Server-side translations
  const translations = {
    title: serverT('sidebar.nav.announcements', language),
    description: serverT('dashboard.description', language),
    pinnedAnnouncements: serverT('dashboard.pinnedAnnouncements', language),
    allAnnouncements: serverT('dashboard.allAnnouncements', language),
    noAnnouncements: serverT('dashboard.noAnnouncements', language),
    createdBy: serverT('dashboard.createdBy', language),
    createdAt: serverT('dashboard.createdAt', language),
    updatedAt: serverT('dashboard.updatedAt', language),
    previous: serverT('dashboard.previous', language),
    next: serverT('dashboard.next', language),
    page: serverT('dashboard.page', language),
    of: serverT('dashboard.of', language),
    loading: serverT('dashboard.loading', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<AnnouncementsSkeleton />}>
          <AnnouncementsClient translations={translations} />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}



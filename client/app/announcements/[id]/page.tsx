import { Suspense } from 'react';
import { headers } from 'next/headers';
// import { notFound } from 'next/navigation';
import DashboardWrapper from '../../dashboard/components/DashboardWrapper';
import AnnouncementDetailClient from './components/AnnouncementDetailClient';
import { serverT, getPreferredLanguage } from '../../lib/server-i18n';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function AnnouncementDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-surface rounded-lg border border-border p-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 w-3/4 bg-text-secondary rounded animate-pulse mb-2"></div>
          <div className="h-4 w-1/2 bg-text-secondary rounded animate-pulse"></div>
        </div>
        
        {/* Content Skeleton */}
        <div className="space-y-4 mb-6">
          <div className="h-4 bg-text-secondary rounded w-full"></div>
          <div className="h-4 bg-text-secondary rounded w-full"></div>
          <div className="h-4 bg-text-secondary rounded w-3/4"></div>
          <div className="h-4 bg-text-secondary rounded w-full"></div>
          <div className="h-4 bg-text-secondary rounded w-2/3"></div>
        </div>
        
        {/* Footer Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-4">
            <div className="h-3 w-32 bg-text-secondary rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-text-secondary rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  // Await params in Next.js 15
  const { id } = await params;
  
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Server-side translations
  const translations = {
    title: serverT('sidebar.nav.announcements', language),
    backToAnnouncements: serverT('dashboard.backToAnnouncements', language),
    createdBy: serverT('dashboard.createdBy', language),
    createdAt: serverT('dashboard.createdAt', language),
    updatedAt: serverT('dashboard.updatedAt', language),
    notFound: serverT('dashboard.notFound', language),
    error: serverT('dashboard.error', language),
    loading: serverT('dashboard.loading', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
        </div>

        <Suspense fallback={<AnnouncementDetailSkeleton />}>
          <AnnouncementDetailClient 
            announcementId={id} 
            translations={translations} 
          />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}

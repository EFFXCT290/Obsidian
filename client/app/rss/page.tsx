import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';
import RssClient from './components/RssClient';

// Loading skeleton component
function RssSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-background rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-background rounded w-1/2"></div>
      </div>
      
      {/* RSS Token section skeleton */}
      <div className="animate-pulse">
        <div className="h-32 bg-background rounded-lg w-full"></div>
      </div>
      
      {/* Instructions skeleton */}
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-background rounded w-1/4"></div>
        <div className="h-4 bg-background rounded w-full"></div>
        <div className="h-4 bg-background rounded w-3/4"></div>
        <div className="h-4 bg-background rounded w-1/2"></div>
      </div>
    </div>
  );
}

export default async function RssPage() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  const translations = {
    title: serverT('sidebar.nav.rss', language),
    description: serverT('rss.description', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<RssSkeleton />}>
          <RssClient />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}
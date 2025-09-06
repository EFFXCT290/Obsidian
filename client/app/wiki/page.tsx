import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';
import WikiClient from './components/WikiClient';

// Loading skeleton component
function WikiSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-background rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-background rounded w-1/2"></div>
      </div>
      
      {/* Search skeleton */}
      <div className="animate-pulse">
        <div className="h-12 bg-background rounded-lg w-full"></div>
      </div>
      
      {/* Pages skeleton */}
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-background rounded-lg w-full"></div>
        ))}
      </div>
    </div>
  );
}

export default async function WikiPage() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  const translations = {
    title: serverT('sidebar.nav.wiki', language),
    description: serverT('wiki.description', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<WikiSkeleton />}>
          <WikiClient />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}
import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';
import BookmarksClient from './components/BookmarksClient';

// Loading skeleton component
function BookmarksSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-background rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-background rounded w-1/2"></div>
      </div>
      
      {/* Filters skeleton */}
      <div className="animate-pulse">
        <div className="h-10 bg-background rounded w-full"></div>
      </div>
      
      {/* Bookmarks grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-background rounded-lg p-6">
              <div className="h-6 bg-background rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-background rounded w-full mb-2"></div>
              <div className="h-4 bg-background rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-background rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function BookmarksPage() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  const translations = {
    title: serverT('sidebar.nav.bookmarks', language),
    description: serverT('bookmarks.description', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<BookmarksSkeleton />}>
          <BookmarksClient />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}
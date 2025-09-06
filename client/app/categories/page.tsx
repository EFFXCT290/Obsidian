import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import CategoriesClient from './components/CategoriesClient';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';

function CategoriesSkeleton() {
  return (
    <div className="space-y-8">
      {/* Search Bar Skeleton */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="h-12 bg-text-secondary/20 rounded-lg animate-pulse"></div>
      </div>

      {/* Popular Tags Skeleton */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="h-6 w-32 bg-text-secondary/20 rounded mb-4 animate-pulse"></div>
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-text-secondary/20 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Categories Grid Skeleton */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="h-6 w-40 bg-text-secondary/20 rounded mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-background rounded-lg border border-border p-6 animate-pulse">
              <div className="h-6 w-3/4 bg-text-secondary/20 rounded mb-2"></div>
              <div className="h-4 w-full bg-text-secondary/20 rounded mb-2"></div>
              <div className="h-4 w-2/3 bg-text-secondary/20 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-text-secondary/20 rounded"></div>
                <div className="h-3 w-full bg-text-secondary/20 rounded"></div>
                <div className="h-3 w-3/4 bg-text-secondary/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function CategoriesPage() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Server-side translations
  const translations = {
    title: serverT('sidebar.nav.categories', language),
    description: serverT('categories.description', language),
    popularTags: serverT('categories.popularTags', language),
    browseCategories: serverT('categories.browseCategories', language),
    latestTorrents: serverT('categories.latestTorrents', language),
    viewAll: serverT('categories.viewAll', language),
    searchPlaceholder: serverT('categories.searchPlaceholder', language),
    noTorrents: serverT('categories.noTorrents', language),
    seeders: serverT('categories.seeders', language),
    leechers: serverT('categories.leechers', language),
    completed: serverT('categories.completed', language),
    uploaded: serverT('categories.uploaded', language),
    by: serverT('categories.by', language),
    size: serverT('categories.size', language),
    loading: serverT('categories.loading', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<CategoriesSkeleton />}>
          <CategoriesClient translations={translations} />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}

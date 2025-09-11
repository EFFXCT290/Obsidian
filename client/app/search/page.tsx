import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import SearchClient from './components/SearchClient';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';

interface PageProps {
  searchParams: Promise<{
    tag?: string;
    q?: string;
    page?: string;
    sort?: string;
  }>;
}

function SearchSkeleton() {
  return (
    <div className="space-y-6 mt-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-text-secondary/20 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-text-secondary/20 rounded animate-pulse"></div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-32 bg-text-secondary/20 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-text-secondary/20 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Results Skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-border p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-6 w-3/4 bg-text-secondary/20 rounded"></div>
                <div className="h-4 w-1/2 bg-text-secondary/20 rounded"></div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-16 bg-text-secondary/20 rounded"></div>
                  <div className="h-4 w-20 bg-text-secondary/20 rounded"></div>
                  <div className="h-4 w-24 bg-text-secondary/20 rounded"></div>
                </div>
              </div>
              <div className="ml-4 space-y-2">
                <div className="h-8 w-20 bg-text-secondary/20 rounded"></div>
                <div className="h-6 w-16 bg-text-secondary/20 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex justify-center">
        <div className="flex space-x-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-10 bg-text-secondary/20 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({ searchParams }: PageProps) {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Await searchParams
  const resolvedSearchParams = await searchParams;

  // Server-side translations
  const translations = {
    title: serverT('search.title', language),
    description: serverT('search.description', language),
    noResults: serverT('search.noResults', language),
    loading: serverT('search.loading', language),
    filters: {
      sortBy: serverT('search.filters.sortBy', language),
      newest: serverT('search.filters.newest', language),
      oldest: serverT('search.filters.oldest', language),
      mostSeeded: serverT('search.filters.mostSeeded', language),
      leastSeeded: serverT('search.filters.leastSeeded', language),
      largest: serverT('search.filters.largest', language),
      smallest: serverT('search.filters.smallest', language),
    },
    torrent: {
      seeders: serverT('search.torrent.seeders', language),
      leechers: serverT('search.torrent.leechers', language),
      completed: serverT('search.torrent.completed', language),
      uploaded: serverT('search.torrent.uploaded', language),
      by: serverT('search.torrent.by', language),
      size: serverT('search.torrent.size', language),
      download: serverT('search.torrent.download', language),
      uploader: serverT('search.torrent.uploader', language),
      category: serverT('search.torrent.category', language),
    },
    pagination: {
      previous: serverT('search.pagination.previous', language),
      next: serverT('search.pagination.next', language),
      page: serverT('search.pagination.page', language),
      of: serverT('search.pagination.of', language),
    },
  };

  return (
    <DashboardWrapper>
      <div className="max-w-screen-2xl mx-auto px-4">
        <Suspense fallback={<SearchSkeleton />}>
          <SearchClient 
            searchParams={resolvedSearchParams}
            translations={translations}
          />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}

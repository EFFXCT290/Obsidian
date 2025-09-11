import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../../../dashboard/components/DashboardWrapper';
import CategoryTorrentsClient from '@/app/category/[name]/torrents/components/CategoryTorrentsClient';
import { serverT, getPreferredLanguage } from '../../../lib/server-i18n';

interface PageProps {
  params: Promise<{
    name: string;
  }>;
  searchParams: Promise<{
    page?: string;
    source?: string;
    sort?: string;
  }>;
}

function CategoryTorrentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2">
        <div className="h-4 w-16 bg-text-secondary/20 rounded animate-pulse"></div>
        <div className="h-4 w-4 bg-text-secondary/20 rounded animate-pulse"></div>
        <div className="h-4 w-24 bg-text-secondary/20 rounded animate-pulse"></div>
      </div>

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
          <div className="h-10 w-28 bg-text-secondary/20 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Torrents List Skeleton */}
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
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

export default async function CategoryTorrentsPage({ params, searchParams }: PageProps) {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Await params and searchParams
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Decode the category name from URL
  const categoryName = decodeURIComponent(resolvedParams.name);

  // Server-side translations
  const translations = {
    title: serverT('categoryTorrents.title', language),
    description: serverT('categoryTorrents.description', language),
    breadcrumbHome: serverT('sidebar.nav.home', language),
    breadcrumbCategories: serverT('sidebar.nav.categories', language),
    noTorrents: serverT('categoryTorrents.noTorrents', language),
    loading: serverT('categoryTorrents.loading', language),
    filters: {
      allSources: serverT('categoryTorrents.filters.allSources', language),
      sortBy: serverT('categoryTorrents.filters.sortBy', language),
      newest: serverT('categoryTorrents.filters.newest', language),
      oldest: serverT('categoryTorrents.filters.oldest', language),
      mostSeeded: serverT('categoryTorrents.filters.mostSeeded', language),
      leastSeeded: serverT('categoryTorrents.filters.leastSeeded', language),
      largest: serverT('categoryTorrents.filters.largest', language),
      smallest: serverT('categoryTorrents.filters.smallest', language),
    },
        torrent: {
          title: serverT('categoryTorrents.torrent.title', language),
          seeders: serverT('categoryTorrents.torrent.seeders', language),
          leechers: serverT('categoryTorrents.torrent.leechers', language),
          completed: serverT('categoryTorrents.torrent.completed', language),
          uploaded: serverT('categoryTorrents.torrent.uploaded', language),
          by: serverT('categoryTorrents.torrent.by', language),
          size: serverT('categoryTorrents.torrent.size', language),
          download: serverT('categoryTorrents.torrent.download', language),
          uploader: serverT('categoryTorrents.torrent.uploader', language),
          category: serverT('categoryTorrents.torrent.category', language),
        },
    pagination: {
      previous: serverT('categoryTorrents.pagination.previous', language),
      next: serverT('categoryTorrents.pagination.next', language),
      page: serverT('categoryTorrents.pagination.page', language),
      of: serverT('categoryTorrents.pagination.of', language),
    },
  };

  return (
    <DashboardWrapper>
      <div className="max-w-screen-2xl mx-auto px-4">
        <Suspense fallback={<CategoryTorrentsSkeleton />}>
          <CategoryTorrentsClient 
            categoryName={categoryName}
            searchParams={resolvedSearchParams}
            translations={translations}
          />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}

import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '@/app/admin/components/AdminDashboardWrapper';
import { getPreferredLanguage, getTranslations } from '@/app/lib/server-i18n';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { LanguageSync } from '@/app/components/LanguageSync';
import TorrentApprovalsClient from './TorrentApprovalsClient';
import { I18nProvider } from '@/app/hooks/I18nProvider';

// Skeleton component for loading state
function TorrentApprovalsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
              <div className="h-12 w-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function TorrentApprovalsPage() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);
  const resources = getTranslations(language);

  return (
    <AdminDashboardWrapper>
      <Suspense fallback={null}>
        <LanguageSync serverLanguage={language} />
      </Suspense>
      <Suspense fallback={<div className="fixed bottom-4 left-4 z-50 w-20 h-10 bg-gray-200 rounded animate-pulse" />}>
        <div className="fixed bottom-4 left-4 z-50">
          <LanguageSelector currentLanguage={language} />
        </div>
      </Suspense>
      <Suspense fallback={<TorrentApprovalsSkeleton />}>
        <I18nProvider resources={resources as Record<string, unknown>}>
          <TorrentApprovalsClient />
        </I18nProvider>
      </Suspense>
    </AdminDashboardWrapper>
  );
}

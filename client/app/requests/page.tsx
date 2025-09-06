import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';
import RequestsClient from './components/RequestsClient';

function RequestsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-border p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="h-6 w-3/4 bg-text-secondary rounded"></div>
              <div className="h-6 w-20 bg-text-secondary rounded"></div>
            </div>
            <div className="h-4 w-full bg-text-secondary rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-text-secondary rounded mb-4"></div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-32 bg-text-secondary rounded"></div>
              <div className="h-3 w-24 bg-text-secondary rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function RequestsPage() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Server-side translations
  const translations = {
    title: serverT('sidebar.nav.requests', language),
    description: serverT('requests.description', language),
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<RequestsSkeleton />}>
          <RequestsClient />
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}
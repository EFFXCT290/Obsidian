import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';

function RssSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg border border-border p-6 animate-pulse">
        <div className="h-6 w-1/2 bg-text-secondary rounded mb-4"></div>
        <div className="h-4 w-full bg-text-secondary rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-text-secondary rounded mb-4"></div>
        <div className="h-10 w-32 bg-text-secondary rounded"></div>
      </div>
      <div className="bg-surface rounded-lg border border-border p-6 animate-pulse">
        <div className="h-6 w-1/2 bg-text-secondary rounded mb-4"></div>
        <div className="h-4 w-full bg-text-secondary rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-text-secondary rounded"></div>
      </div>
    </div>
  );
}

export default async function RssPage() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Server-side translations
  const translations = {
    title: serverT('sidebar.nav.rss', language),
    description: 'Configura y gestiona tus feeds RSS para mantenerte actualizado con el contenido.',
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-text">{translations.title}</h1>
          <p className="text-text-secondary mt-2">{translations.description}</p>
        </div>

        <Suspense fallback={<RssSkeleton />}>
          <div className="text-center py-8">
            <div className="text-text-secondary">
              Contenido de RSS en desarrollo...
            </div>
          </div>
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}

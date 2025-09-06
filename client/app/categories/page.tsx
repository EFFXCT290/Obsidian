import { Suspense } from 'react';
import { headers } from 'next/headers';
import DashboardWrapper from '../dashboard/components/DashboardWrapper';
import { serverT, getPreferredLanguage } from '../lib/server-i18n';

function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg border border-border p-6 animate-pulse">
            <div className="h-6 w-3/4 bg-text-secondary rounded mb-2"></div>
            <div className="h-4 w-full bg-text-secondary rounded mb-2"></div>
            <div className="h-4 w-2/3 bg-text-secondary rounded"></div>
          </div>
        ))}
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
    description: 'Explora las diferentes categorías de contenido disponibles.',
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
          <div className="text-center py-8">
            <div className="text-text-secondary">
              Contenido de categorías en desarrollo...
            </div>
          </div>
        </Suspense>
      </div>
    </DashboardWrapper>
  );
}

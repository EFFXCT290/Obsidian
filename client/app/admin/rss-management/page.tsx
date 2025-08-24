import { Suspense } from 'react';
import { headers } from 'next/headers';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import AdminDashboardWrapper from '../components/AdminDashboardWrapper';
import RssManagementClient from './RssManagementClient';

export default async function RSSManagementPage() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  return (
    <AdminDashboardWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text">
            {serverT('admin.rssManagement.title', language)}
          </h1>
          <p className="text-text-secondary mt-2">
            {serverT('admin.rssManagement.description', language)}
          </p>
        </div>

        <Suspense fallback={
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="text-center text-text-secondary py-12">
              <div className="text-4xl mb-4">📡</div>
              <h3 className="text-lg font-medium mb-2">Loading...</h3>
              <p className="text-sm">Please wait while we load the RSS management system.</p>
            </div>
          </div>
        }>
          <RssManagementClient />
        </Suspense>
      </div>
    </AdminDashboardWrapper>
  );
}

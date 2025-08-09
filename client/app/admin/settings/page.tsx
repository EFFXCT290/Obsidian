import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '@/app/admin/components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import SettingsContent from './components/SettingsContent';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { LanguageSync } from '@/app/components/LanguageSync';

function SettingsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-surface-light rounded mb-2" />
        <div className="h-4 bg-surface-light rounded" />
      </div>
      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0">
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-light">
              <div className="h-6 bg-surface-light rounded" />
            </div>
            <div className="p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 mb-1">
                  <div className="h-4 bg-surface-light rounded mb-1" />
                  <div className="h-3 bg-surface-light rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-surface border border-border rounded-lg p-8">
            <div className="space-y-6">
              <div className="h-6 bg-surface-light rounded mb-4" />
              <div className="h-4 bg-surface-light rounded mb-6" />
              <div className="h-10 bg-surface-light rounded mb-4" />
              <div className="h-10 bg-surface-light rounded mb-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.settings.title', language),
    description: serverT('admin.settings.description', language),
    sections: {
      tracker: serverT('admin.settings.sections.tracker', language),
      ratio: serverT('admin.settings.sections.ratio', language),
      announce: serverT('admin.settings.sections.announce', language),
      clients: serverT('admin.settings.sections.clients', language),
      rss: serverT('admin.settings.sections.rss', language),
      storage: serverT('admin.settings.sections.storage', language),
      smtp: serverT('admin.settings.sections.smtp', language),
      antiCheat: serverT('admin.settings.sections.antiCheat', language),
      branding: serverT('admin.settings.sections.branding', language),
    },
    details: {
      tracker: serverT('admin.settings.tracker.description', language),
      ratio: serverT('admin.settings.ratio.description', language),
      announce: serverT('admin.settings.announce.description', language),
      clients: serverT('admin.settings.clients.description', language),
      rss: serverT('admin.settings.rss.description', language),
      storage: serverT('admin.settings.storage.description', language),
      smtp: serverT('admin.settings.smtp.description', language),
      antiCheat: serverT('admin.settings.antiCheat.description', language),
      branding: serverT('admin.settings.branding.description', language),
    }
  };

  return (
    <AdminDashboardWrapper>
      <LanguageSync serverLanguage={language} />
      <div className="fixed bottom-4 left-4 z-50">
        <LanguageSelector currentLanguage={language} />
      </div>
      <Suspense fallback={<SettingsSkeleton />}> 
        <SettingsContent translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}



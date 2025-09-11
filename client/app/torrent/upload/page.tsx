import React from 'react';
import UploadContent from './components/UploadContent';
import DashboardWrapper from '@/app/dashboard/components/DashboardWrapper';
import { getPreferredLanguage, getTranslations } from '@/app/lib/server-i18n';
import { headers } from 'next/headers';
import { I18nProvider } from '@/app/hooks/I18nProvider';

export default async function UploadPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs as unknown as Headers);
  const resources = getTranslations(language);
  return (
    <DashboardWrapper>
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <I18nProvider resources={resources as unknown as Record<string, unknown>}>
          <UploadContent />
        </I18nProvider>
      </div>
    </DashboardWrapper>
  );
}



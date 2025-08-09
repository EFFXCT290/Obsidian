'use client';

import { useI18n } from '@/app/hooks/useI18n';

export default function ProfileHeader() {
  const { t } = useI18n();
  return (
    <div className="pt-6 mb-6">
      <h1 className="text-2xl font-bold text-text">{t('profile.title', 'Profile')}</h1>
    </div>
  );
}



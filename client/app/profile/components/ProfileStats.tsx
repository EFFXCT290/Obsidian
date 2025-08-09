'use client';

import { useI18n } from '@/app/hooks/useI18n';

interface ProfileStatsProps {
  announceUrl: string;
  profile: any;
  onCopyAnnounceUrl: () => void;
  loading?: boolean;
}

export default function ProfileStats({ announceUrl, profile, onCopyAnnounceUrl, loading = false }: ProfileStatsProps) {
  const { t } = useI18n();
  const handleCopy = async () => {
    try {
      await onCopyAnnounceUrl();
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Enlace copiado', 'success');
    } catch {
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('No se pudo copiar el enlace', 'error');
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-text mb-4">{t('profile.sections.stats', 'Statistics')}</h2>
      <div className="space-y-6">
        {/* Announce URL */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">{t('profile.fields.announceUrl', 'Announce URL')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={announceUrl}
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-text"
            />
            <button onClick={handleCopy} className="px-4 py-2 border border-green text-green rounded active:scale-95 transition-transform">
              {t('profile.actions.copy', 'Copy')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-text-secondary mb-1">{t('profile.fields.uploaded', 'Uploaded')}</div>
            <div className="text-xl font-semibold">{profile?.stats?.uploadedFormatted ?? '0 B'}</div>
          </div>
          <div>
            <div className="text-sm text-text-secondary mb-1">{t('profile.fields.downloaded', 'Downloaded')}</div>
            <div className="text-xl font-semibold">{profile?.stats?.downloadedFormatted ?? '0 B'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}



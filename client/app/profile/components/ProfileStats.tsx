'use client';

import { useI18n } from '@/app/hooks/useI18n';

interface ProfileStatsProps {
  announceUrl: string;
  rssUrl: string;
  scrapeUrl: string;
  profile: {
    id: string;
    username?: string;
    email: string;
    avatarUrl?: string;
    joinDate: string;
    uploaded: number;
    downloaded: number;
    ratio: number;
    bonusPoints: number;
  } | null;
  onCopyAnnounceUrl: () => void;
  onCopyRssUrl: () => void;
  onCopyScrapeUrl: () => void;
  loading?: boolean;
}

export default function ProfileStats({ announceUrl, rssUrl, scrapeUrl, profile, onCopyAnnounceUrl, onCopyRssUrl, onCopyScrapeUrl, loading = false }: ProfileStatsProps) {
  const { t } = useI18n();

  // Function to mask sensitive parts of URLs
  const maskUrl = (url: string, paramName: string) => {
    if (!url) return '';
    const regex = new RegExp(`${paramName}=([^&]+)`);
    const match = url.match(regex);
    if (match) {
      const actualValue = match[1];
      const maskedValue = '•'.repeat(actualValue.length);
      return url.replace(regex, `${paramName}=${maskedValue}`);
    }
    return url;
  };

  const handleCopyAnnounce = async () => {
    try {
      await onCopyAnnounceUrl();
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Enlace copiado', 'success');
    } catch {
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('No se pudo copiar el enlace', 'error');
    }
  };

  const handleCopyRss = async () => {
    try {
      await onCopyRssUrl();
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Enlace RSS copiado', 'success');
    } catch {
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('No se pudo copiar el enlace RSS', 'error');
    }
  };

  const handleCopyScrape = async () => {
    try {
      await onCopyScrapeUrl();
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Enlace Scrape copiado', 'success');
    } catch {
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('No se pudo copiar el enlace Scrape', 'error');
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
              value={maskUrl(announceUrl, 'passkey')}
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-text"
              title="Click Copy to get the full URL with your passkey"
            />
            <button onClick={handleCopyAnnounce} className="px-4 py-2 border border-green text-green rounded active:scale-95 transition-transform">
              {t('profile.actions.copy', 'Copy')}
            </button>
          </div>
        </div>

        {/* RSS URL */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">{t('profile.fields.rssUrl', 'RSS URL')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={maskUrl(rssUrl, 'token')}
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-text"
              title="Click Copy to get the full URL with your RSS token"
            />
            <button onClick={handleCopyRss} className="px-4 py-2 border border-green text-green rounded active:scale-95 transition-transform">
              {t('profile.actions.copy', 'Copy')}
            </button>
          </div>
        </div>

        {/* Scrape URL */}
        <div>
          <label className="block text-sm text-text-secondary mb-2">{t('profile.fields.scrapeUrl', 'Scrape URL')}</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={maskUrl(scrapeUrl, 'passkey')}
              className="flex-1 px-3 py-2 bg-background border border-border rounded text-text"
              title="Click Copy to get the full URL with your passkey"
            />
            <button onClick={handleCopyScrape} className="px-4 py-2 border border-green text-green rounded active:scale-95 transition-transform">
              {t('profile.actions.copy', 'Copy')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-text-secondary mb-1">{t('profile.fields.uploaded', 'Uploaded')}</div>
            <div className="text-xl font-semibold">{profile?.uploaded ? `${(profile.uploaded / 1024 / 1024 / 1024).toFixed(2)} GB` : '0 B'}</div>
          </div>
          <div>
            <div className="text-sm text-text-secondary mb-1">{t('profile.fields.downloaded', 'Downloaded')}</div>
            <div className="text-xl font-semibold">{profile?.downloaded ? `${(profile.downloaded / 1024 / 1024 / 1024).toFixed(2)} GB` : '0 B'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}



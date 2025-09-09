'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { toast } from 'react-hot-toast';
import { Copy, Refresh, LinkExternal, InfoSquare, Rss, Bookmark, Search, Tag } from '@styled-icons/boxicons-regular';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

interface RssTokenResponse {
  rssToken: string;
  rssEnabled: boolean;
}

export default function RssClient() {
  const { t } = useI18n();
  const [rssToken, setRssToken] = useState<string>('');
  const [rssEnabled, setRssEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadRssToken = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('rss.mustBeLoggedIn', 'You must be logged in to access RSS'));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/rss-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load RSS token');
      }

      const data: RssTokenResponse = await response.json();
      setRssToken(data.rssToken);
      setRssEnabled(data.rssEnabled);
    } catch (error) {
      console.error('Error loading RSS token:', error);
      toast.error(t('rss.errorLoadingToken', 'Error loading RSS token'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const regenerateRssToken = async () => {
    try {
      setRegenerating(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('rss.mustBeLoggedIn', 'You must be logged in'));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/user/rss-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate RSS token');
      }

      const data: RssTokenResponse = await response.json();
      setRssToken(data.rssToken);
      toast.success(t('rss.tokenRegenerated', 'RSS token regenerated successfully'));
    } catch (error) {
      console.error('Error regenerating RSS token:', error);
      toast.error(t('rss.errorRegeneratingToken', 'Error regenerating RSS token'));
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('rss.copiedToClipboard', 'Copied to clipboard'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error(t('rss.errorCopying', 'Error copying to clipboard'));
    }
  };

  const buildRssUrl = (params: { q?: string; category?: string; count?: number; bookmarks?: boolean } = {}) => {
    const baseUrl = `${API_BASE_URL}/rss/${rssToken}`;
    const urlParams = new URLSearchParams();
    
    if (params.q) urlParams.append('q', params.q);
    if (params.category) urlParams.append('category', params.category);
    if (params.count) urlParams.append('count', params.count.toString());
    if (params.bookmarks) urlParams.append('bookmarks', 'true');
    
    return urlParams.toString() ? `${baseUrl}?${urlParams.toString()}` : baseUrl;
  };

  useEffect(() => {
    loadRssToken();
  }, [loadRssToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-background rounded-lg w-full"></div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-background rounded w-1/4"></div>
          <div className="h-4 bg-background rounded w-full"></div>
          <div className="h-4 bg-background rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!rssEnabled) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Rss size={32} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-text mb-2">
          {t('rss.disabled', 'RSS is disabled')}
        </h3>
        <p className="text-text-secondary">
          {t('rss.disabledMessage', 'RSS access has been disabled for your account. Please contact an administrator.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* RSS Token Section */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Rss size={20} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-text">
            {t('rss.yourRssToken', 'Your RSS Token')}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('rss.token', 'RSS Token')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rssToken}
                readOnly
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(rssToken)}
                className={`px-3 py-2 border rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-500/10 border-green-500 text-green-500' 
                    : 'bg-background border-border text-text hover:bg-background'
                }`}
                title={copied ? t('rss.copied', 'Copied!') : t('rss.copyToken', 'Copy token')}
              >
                <Copy size={16} />
              </button>
              <button
                onClick={regenerateRssToken}
                disabled={regenerating}
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
                title={t('rss.regenerateToken', 'Regenerate token')}
              >
                <Refresh size={16} className={regenerating ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <InfoSquare size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-text">
                <p className="font-medium mb-1">{t('rss.tokenInfo', 'Token Information')}</p>
                <p>{t('rss.tokenInfoMessage', 'Keep your RSS token private. Anyone with this token can access your RSS feed.')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RSS Feed URLs */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text mb-4">
          {t('rss.feedUrls', 'RSS Feed URLs')}
        </h2>

        <div className="space-y-4">
          {/* All Torrents */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('rss.allTorrents', 'All Torrents')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={buildRssUrl()}
                readOnly
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(buildRssUrl())}
                className={`px-3 py-2 border rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-500/10 border-green-500 text-green-500' 
                    : 'bg-background border-border text-text hover:bg-background'
                }`}
                title={copied ? t('rss.copied', 'Copied!') : t('rss.copyUrl', 'Copy URL')}
              >
                <Copy size={16} />
              </button>
              <a
                href={buildRssUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                title={t('rss.openFeed', 'Open feed')}
              >
                <LinkExternal size={16} />
              </a>
            </div>
          </div>

          {/* Bookmarked Torrents */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('rss.bookmarkedTorrents', 'Bookmarked Torrents')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={buildRssUrl({ bookmarks: true })}
                readOnly
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(buildRssUrl({ bookmarks: true }))}
                className={`px-3 py-2 border rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-500/10 border-green-500 text-green-500' 
                    : 'bg-background border-border text-text hover:bg-background'
                }`}
                title={copied ? t('rss.copied', 'Copied!') : t('rss.copyUrl', 'Copy URL')}
              >
                <Copy size={16} />
              </button>
              <a
                href={buildRssUrl({ bookmarks: true })}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                title={t('rss.openFeed', 'Open feed')}
              >
                <LinkExternal size={16} />
              </a>
            </div>
          </div>

          {/* Limited Count */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('rss.limitedCount', 'Limited Count (10 torrents)')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={buildRssUrl({ count: 10 })}
                readOnly
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(buildRssUrl({ count: 10 }))}
                className={`px-3 py-2 border rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-500/10 border-green-500 text-green-500' 
                    : 'bg-background border-border text-text hover:bg-background'
                }`}
                title={copied ? t('rss.copied', 'Copied!') : t('rss.copyUrl', 'Copy URL')}
              >
                <Copy size={16} />
              </button>
              <a
                href={buildRssUrl({ count: 10 })}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                title={t('rss.openFeed', 'Open feed')}
              >
                <LinkExternal size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text mb-4">
          {t('rss.howToUse', 'How to Use RSS')}
        </h2>

        <div className="space-y-4 text-text-secondary">
          <div>
            <h3 className="font-medium text-text mb-2 flex items-center gap-2">
              <Search size={16} />
              {t('rss.searchParameters', 'Search Parameters')}
            </h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-background px-2 py-1 rounded text-sm">?q=search_term</code> - {t('rss.searchDescription', 'Search for torrents by name or description')}</li>
              <li><code className="bg-background px-2 py-1 rounded text-sm">?category=category_id</code> - {t('rss.categoryDescription', 'Filter by category ID')}</li>
              <li><code className="bg-background px-2 py-1 rounded text-sm">?count=20</code> - {t('rss.countDescription', 'Limit number of torrents (max 20)')}</li>
              <li><code className="bg-background px-2 py-1 rounded text-sm">?bookmarks=true</code> - {t('rss.bookmarksDescription', 'Show only your bookmarked torrents')}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-text mb-2 flex items-center gap-2">
              <Bookmark size={16} />
              {t('rss.rssReaders', 'RSS Readers')}
            </h3>
            <p>{t('rss.rssReadersDescription', 'You can use any RSS reader to subscribe to these feeds. Popular options include:')}</p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>{t('rss.reader1', 'Thunderbird (Email client with RSS support)')}</li>
              <li>{t('rss.reader2', 'Feedly (Web-based RSS reader)')}</li>
              <li>{t('rss.reader3', 'RSS Guard (Desktop RSS reader)')}</li>
              <li>{t('rss.reader4', 'Mobile apps like Feedly, Inoreader, etc.')}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-text mb-2 flex items-center gap-2">
              <Tag size={16} />
              {t('rss.security', 'Security')}
            </h3>
            <p>{t('rss.securityDescription', 'Your RSS token is unique to your account. Keep it private and regenerate it if you suspect it has been compromised.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

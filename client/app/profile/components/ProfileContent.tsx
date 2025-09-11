'use client';

// Placeholder minimal ProfileContent that we will flesh out in parity with V2
// Uses existing endpoints: /api/user/current, /api/user/invites (proxy to Fastify)

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { API_BASE_URL } from '@/lib/api';
import ProfileHeader from './ProfileHeader';
import ProfileSidebar from './ProfileSidebar';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import { useI18n } from '../../hooks/useI18n';
// import RecentActivity from './RecentActivity';

export default function ProfileContent() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    upload?: number;
    download?: number;
    ratio?: number;
    bonusPoints?: number;
    passkey?: string;
  } | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    username?: string;
    email: string;
    avatarUrl?: string;
    joinDate: string;
    uploaded: number;
    downloaded: number;
    ratio: number;
    bonusPoints: number;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rssToken, setRssToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const { data: currentData, isLoading: userLoading } = useSWR(token ? [`${API_BASE_URL}/auth/profile`, token] : null, async ([url, _token]) => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (_token) headers['Authorization'] = `Bearer ${_token as string}`;
    const res = await fetch(url as string, { headers, cache: 'no-store' });
    return res.json();
  });

  const { data: rssData, isLoading: rssLoading } = useSWR(token ? [`${API_BASE_URL}/user/rss-token`, token] : null, async ([url, _token]) => {
    const headers: HeadersInit = {};
    if (_token) headers['Authorization'] = `Bearer ${_token as string}`;
    const res = await fetch(url as string, { headers, cache: 'no-store' });
    return res.json();
  });

  useEffect(() => {
    const currentUser = currentData || null;
    setUser(currentUser);
    if (currentUser) {
      try { localStorage.setItem('user', JSON.stringify({ id: currentUser.id, email: currentUser.email, username: currentUser.username })); } catch {}
      const uploaded = Number(currentUser.upload || 0);
      const downloaded = Number(currentUser.download || 0);
      // const formatBytes = (bytes: number) => {
      //   if (!bytes) return '0 B';
      //   const k = 1024;
      //   const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      //   const i = Math.floor(Math.log(bytes) / Math.log(k));
      //   return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
      // };
      setProfile({
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        avatarUrl: currentUser.avatarUrl,
        joinDate: new Date().toISOString(), // This should come from the API
        uploaded: uploaded,
        downloaded: downloaded,
        ratio: currentUser.ratio ?? (downloaded ? uploaded / downloaded : 0),
        bonusPoints: currentUser.bonusPoints ?? 0,
      });
    }
    setLoading(false);
  }, [currentData]);

  useEffect(() => {
    if (rssData) {
      setRssToken(rssData.rssToken || null);
    }
  }, [rssData]);

  const announceUrl = user?.passkey ? `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http'}://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/announce?passkey=${user.passkey}` : '';
  const rssUrl = rssToken ? `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http'}://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/rss?token=${rssToken}` : '';
  const scrapeUrl = user?.passkey ? `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https' : 'http'}://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/scrape?passkey=${user.passkey}` : '';

  const handleCopyAnnounceUrl = async () => {
    if (!announceUrl) return;
    try {
      await navigator.clipboard.writeText(announceUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = announceUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleCopyRssUrl = async () => {
    if (!rssUrl) return;
    try {
      await navigator.clipboard.writeText(rssUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = rssUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleCopyScrapeUrl = async () => {
    if (!scrapeUrl) return;
    try {
      await navigator.clipboard.writeText(scrapeUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = scrapeUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      // Toast de progreso de subida
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Subiendo avatar...', 'success');
      const formData = new FormData();
      formData.append('avatar', file);
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/user/avatar`, { method: 'POST', headers, body: formData });
      if (!res.ok) {
        showNotification('Error al subir el avatar', 'error');
        throw new Error('Upload failed');
      }
      showNotification('Avatar subido correctamente', 'success');
      // Clear preview and refresh user data
      setPreviewUrl(null);
      // Force refresh of user data by updating the SWR cache
      window.location.reload();
    } catch {
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Error al subir el avatar', 'error');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/user/avatar`, { method: 'DELETE', headers });
      if (!res.ok) {
        const { showNotification } = await import('@/app/utils/notifications');
        showNotification('Error al eliminar el avatar', 'error');
        throw new Error('Delete failed');
      }
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Avatar eliminado', 'success');
      setPreviewUrl(null);
      // Force refresh of user data by updating the SWR cache
      window.location.reload();
    } catch {
      const { showNotification } = await import('@/app/utils/notifications');
      showNotification('Error al eliminar el avatar', 'error');
    }
  };

  if (loading || userLoading || rssLoading) return <div className="p-6 text-text">{t('profile.loading', 'Loading profile...')}</div>;

  return (
    <div className="min-h-screen bg-background text-text p-6">
      <div className="max-w-screen-2xl mx-auto">
        <ProfileHeader />
        
        {/* Profile Tabs Navigation - Outside the grid */}
        <ProfileTabs>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProfileSidebar
              user={user}
              profile={profile}
              previewUrl={previewUrl}
              fileInputRef={fileInputRef}
              formattedJoinDate={''}
              onRemoveAvatar={handleRemoveAvatar}
              onAvatarUpload={handleUploadAvatar}
              setPreviewUrl={setPreviewUrl}
              loading={!user}
            />
            <div className="md:col-span-2">
              <ProfileStats 
                announceUrl={announceUrl} 
                rssUrl={rssUrl}
                scrapeUrl={scrapeUrl}
                profile={profile} 
                onCopyAnnounceUrl={handleCopyAnnounceUrl} 
                onCopyRssUrl={handleCopyRssUrl}
                onCopyScrapeUrl={handleCopyScrapeUrl} 
              />
            </div>
          </div>
        </ProfileTabs>
      </div>
    </div>
  );
}



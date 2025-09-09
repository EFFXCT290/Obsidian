'use client';


import { useI18n } from '@/app/hooks/useI18n';
import { API_BASE_URL } from '@/lib/api';


interface ProfileSidebarProps {
  user?: { id: string; email: string; username?: string | null; avatarUrl?: string };
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
  };
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  formattedJoinDate: string;
  onRemoveAvatar: () => void;
  onAvatarUpload: (file: File) => Promise<void>;
  setPreviewUrl: (url: string | null) => void;
  loading?: boolean;
}

export default function ProfileSidebar({ user, profile, previewUrl, fileInputRef, formattedJoinDate, onRemoveAvatar, onAvatarUpload, setPreviewUrl, loading = false }: ProfileSidebarProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-lg border border-border p-6">
        <div className="space-y-4">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-background">
            {loading ? (
              <div className="w-full h-full bg-text-secondary/10 animate-pulse"></div>
            ) : (previewUrl || user?.avatarUrl) ? (
              <img src={previewUrl || `${API_BASE_URL}${user?.avatarUrl}` || ''} alt="Profile avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {loading ? (
              <>
                <div className="flex-1 h-8 bg-text-secondary/10 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-text-secondary/10 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 px-3 py-2 bg-primary text-background rounded hover:bg-primary-dark transition-colors text-sm">{t('profile.actions.uploadAvatar', 'Upload avatar')}</button>
                {(previewUrl || user?.avatarUrl) && (
                  <button type="button" onClick={onRemoveAvatar} className="px-3 py-2 border border-border rounded hover:border-error hover:text-error transition-colors text-sm">{t('profile.actions.removeAvatar', 'Remove')}</button>
                )}
              </>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const url = URL.createObjectURL(file); setPreviewUrl(url); await onAvatarUpload(file); } }} />

          <div className="space-y-3">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between"><div className="w-20 h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-24 h-4 bg-text-secondary/10 rounded animate-pulse"></div></div>
              ))
            ) : (
              <>
                <div className="flex justify-between"><span className="text-text-secondary">{t('profile.fields.username', 'Username')}</span><span className="font-medium">{user?.username || ''}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">{t('profile.fields.email', 'Email')}</span><span className="font-medium">{user?.email || ''}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">{t('profile.fields.ratio', 'Ratio')}</span><span className="font-medium">{profile?.stats?.ratio?.toFixed(2) ?? '0.00'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">{t('profile.fields.points', 'Points')}</span><span className="font-medium">{profile?.stats?.points ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">{t('profile.fields.rank', 'Rank')}</span><span className="font-medium">{profile?.stats?.rank ?? ''}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">{t('profile.fields.joinDate', 'Join date')}</span><span className="font-medium">{formattedJoinDate}</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import { API_BASE_URL } from '@/lib/api';
import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';
import toast from 'react-hot-toast';

export default function ProfilePreferences() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState('es');
  const [allowEmail, setAllowEmail] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);

  const authHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/preferences`, { headers: authHeaders(), cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          if (data.preferredLanguage) setPreferredLanguage(data.preferredLanguage);
          if (typeof data.allowEmailNotifications === 'boolean') setAllowEmail(data.allowEmailNotifications);
          if (typeof data.publicProfile === 'boolean') setPublicProfile(data.publicProfile);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/preferences`, { 
        method: 'PUT', 
        headers: authHeaders(), 
        body: JSON.stringify({ 
          preferredLanguage, 
          allowEmailNotifications: allowEmail, 
          publicProfile 
        }) 
      });
      
      if (response.ok) {
        toast.success(t('profile.preferences.saved', 'Preferences saved successfully!'));
      } else {
        toast.error(t('profile.preferences.saveError', 'Failed to save preferences'));
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(t('profile.preferences.saveError', 'Failed to save preferences'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-text mb-4">{t('profile.sections.preferences', 'Preferences')}</h2>
      {loading ? (
        <div className="text-text-secondary">{t('common.loading', 'Loading...')}</div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">{t('profile.preferences.language', 'Language')}</label>
            <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className="px-3 py-2 bg-background border border-border rounded text-text">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="allowEmail" className="text-sm font-medium text-text">{t('profile.preferences.emailNotifications', 'Allow email notifications')}</label>
            <ToggleSwitch 
              id="allowEmail" 
              checked={allowEmail} 
              onChange={(e) => setAllowEmail(e.target.checked)} 
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="publicProfile" className="text-sm font-medium text-text">{t('profile.preferences.publicProfile', 'Make profile public')}</label>
            <ToggleSwitch 
              id="publicProfile" 
              checked={publicProfile} 
              onChange={(e) => setPublicProfile(e.target.checked)} 
            />
          </div>
          {publicProfile && (
            <div className="text-sm text-text-secondary bg-primary/10 p-3 rounded border border-primary/20">
              {t('profile.preferences.publicProfileDescription', 'Your profile will be visible at /user/{username} and show your public torrents, ratio, and stats. Anonymous torrents will not be shown.')}
            </div>
          )}
          <button 
            onClick={save} 
            disabled={saving}
            className="px-6 py-2 bg-primary text-background rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t('common.saving', 'Saving...') : t('profile.actions.save', 'Save')}
          </button>
        </div>
      )}
    </div>
  );
}



'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { FormField } from '@/app/components/ui/FigmaFloatingLabelInput';
import { SelectField } from '@/app/components/ui/FigmaFloatingLabelSelect';
import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';
import { showNotification } from '@/app/utils/notifications';
import { API_BASE_URL } from '@/lib/api';
import { Cog } from '@styled-icons/boxicons-regular/Cog';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Shield } from '@styled-icons/boxicons-regular/Shield';
import { Palette } from '@styled-icons/boxicons-regular/Palette';
import { UserPlus } from '@styled-icons/boxicons-regular/UserPlus';
import { CheckCircle } from '@styled-icons/boxicons-regular/CheckCircle';
import { TrendingUp } from '@styled-icons/boxicons-regular/TrendingUp';
import { XCircle } from '@styled-icons/boxicons-regular/XCircle';
import { Rss } from '@styled-icons/boxicons-regular/Rss';
import { Folder } from '@styled-icons/boxicons-regular/Folder';

interface SettingsContentProps {
  translations: {
    title: string;
    description: string;
    sections?: Record<string, string>;
    details?: Record<string, string>;
    settings?: {
      ui?: {
        sectionsTitle?: string;
        save?: string;
        saving?: string;
        saved?: string;
        errorLoading?: string;
        errorSaving?: string;
        on?: string;
        off?: string;
        enabled?: string;
        disabled?: string;
        smtpTest?: string;
        smtpSuccess?: string;
        smtpError?: string;
      };
      ratioPresets?: {
        title?: string;
        easy?: string;
        balanced?: string;
        strict?: string;
        active?: string;
      };
    };
    fields?: Record<string, string>;
  };
}

type ConfigState = {
  registrationMode?: 'OPEN' | 'INVITE' | 'CLOSED';
  requireTorrentApproval?: boolean;
  requiredSeedingMinutes?: number;
  minRatio?: number;
  bonusPointsPerHour?: number;
  hitAndRunThreshold?: number;
  defaultAnnounceInterval?: number;
  minAnnounceInterval?: number;
  whitelistedClients?: string[];
  blacklistedClients?: string[];
  allowedFingerprints?: string[];
  rssDefaultCount?: number;
  inviteExpiryHours?: number;
  maxInvitesPerUser?: number;
  storageType?: 'LOCAL' | 'S3' | 'DB';
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  enableGhostLeechingCheck?: boolean;
  enableCheatingClientCheck?: boolean;
  enableIpAbuseCheck?: boolean;
  enableAnnounceRateCheck?: boolean;
  enableInvalidStatsCheck?: boolean;
  enablePeerBanCheck?: boolean;
  maxStatsJumpMultiplier?: number;
  brandingName?: string;
  showHomePageStats?: boolean;
};

export default function SettingsContent({ translations }: SettingsContentProps) {
  const [config, setConfig] = useState<ConfigState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRatioPreset, setActiveRatioPreset] = useState<'easy' | 'balanced' | 'strict' | 'custom'>('custom');
  const [activeSection, setActiveSection] = useState<
    'tracker' | 'smtp' | 'antiCheat' | 'branding' | 'ratio' | 'announce' | 'clients' | 'rss' | 'storage' | 'invitations'
  >('tracker');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/admin/config`, { headers, cache: 'no-store' });
        const data = (await res.json()) as ConfigState;
        setConfig(data || {});
        // Determine preset after loading config
        const preset = detectRatioPreset(data || {});
        setActiveRatioPreset(preset);
      } catch {
        showNotification('Failed to load configuration', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const detectRatioPreset = (cfg: ConfigState): 'easy' | 'balanced' | 'strict' | 'custom' => {
    const ratio = cfg.minRatio ?? 0.5;
    const bonus = cfg.bonusPointsPerHour ?? 1;
    const hr = cfg.hitAndRunThreshold ?? 5;
    const seed = cfg.requiredSeedingMinutes ?? 4320;
    if (ratio === 0.3 && bonus === 2 && hr === 8 && seed === 25) return 'easy';
    if (ratio === 0.5 && bonus === 1 && hr === 5 && seed === 50) return 'balanced';
    if (ratio === 1.0 && bonus === 0.5 && hr === 3 && seed === 100) return 'strict';
    return 'custom';
  };

  // Recompute preset when any ratio-related field changes
  useEffect(() => {
    setActiveRatioPreset(detectRatioPreset(config));
  }, [config]);

  const handleChange = <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
              const res = await fetch(`${API_BASE_URL}/admin/config`, { method: 'POST', headers, body: JSON.stringify(config) });
      if (!res.ok) throw new Error('Failed');
      showNotification('Configuration saved');
    } catch {
      showNotification('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 bg-surface-light rounded w-40" />
        <div className="h-4 bg-surface-light rounded w-80" />
        <div className="h-10 bg-surface-light rounded w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">{translations.title}</h1>
        <p className="text-text-secondary">{translations.description}</p>
      </div>

      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0">
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-light">
              <h2 className="text-lg font-semibold text-text">{translations.sections?.tracker ? (translations.title || 'Configuration') : 'Secciones'}</h2>
            </div>
            <nav className="p-2">
              {(() => {
                type SectionId = 'tracker' | 'ratio' | 'announce' | 'clients' | 'invitations' | 'rss' | 'storage' | 'smtp' | 'antiCheat' | 'branding';
                type IconComponent = ComponentType<{ size?: number }>;
                const sections: Array<{ id: SectionId; title: string; desc?: string; icon: IconComponent }> = [
                  { id: 'tracker', title: translations.sections?.tracker || 'Tracker', desc: translations.details?.tracker, icon: Cog },
                  { id: 'ratio', title: translations.sections?.ratio || 'Ratio & H&R', desc: translations.details?.ratio, icon: Shield },
                  { id: 'announce', title: translations.sections?.announce || 'Announce', desc: translations.details?.announce, icon: Cog },
                  { id: 'clients', title: translations.sections?.clients || 'Clients', desc: translations.details?.clients, icon: Shield },
                  { id: 'invitations', title: translations.sections?.invitations || 'Invitations', desc: translations.details?.invitations, icon: UserPlus },
                  { id: 'rss', title: translations.sections?.rss || 'RSS', desc: translations.details?.rss, icon: Rss },
                  { id: 'storage', title: translations.sections?.storage || 'Storage', desc: translations.details?.storage, icon: Folder },
                  { id: 'smtp', title: translations.sections?.smtp || 'SMTP', desc: translations.details?.smtp, icon: Envelope },
                  { id: 'antiCheat', title: translations.sections?.antiCheat || 'Anti-Cheat', desc: translations.details?.antiCheat, icon: Shield },
                  { id: 'branding', title: translations.sections?.branding || 'Branding', desc: translations.details?.branding, icon: Palette },
                ];
                return sections.map((s) => {
                  const Icon = s.icon;
                  const active = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors flex items-start space-x-3 ${active ? 'bg-primary/10 text-primary' : 'text-text hover:bg-surface-light'}`}
                    >
                      <div className="w-5 h-5 mt-0.5 flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="font-medium">{s.title}</div>
                        {s.desc && (
                          <div className={`text-xs ${active ? 'text-primary/80' : 'text-text-secondary'}`}>{s.desc}</div>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-surface border border-border rounded-lg p-8 shadow-sm space-y-8">
            {activeSection === 'tracker' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.tracker || 'Tracker'}</h3>
                <p className="text-text-secondary">{translations.details?.tracker}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectField
                    label={translations.fields?.registrationMode || 'Registration Mode'}
                    value={config.registrationMode || 'OPEN'}
                    onChange={(v) => handleChange('registrationMode', v as ConfigState['registrationMode'])}
                    options={[
                      { value: 'OPEN', label: 'OPEN' },
                      { value: 'INVITE', label: 'INVITE' },
                      { value: 'CLOSED', label: 'CLOSED' },
                    ]}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-text">{translations.fields?.requireTorrentApproval || 'Require Torrent Approval'}</h4>
                      <p className="text-xs text-text-secondary">
                        {Boolean(config.requireTorrentApproval) ? (translations.settings?.ui?.enabled || 'Enabled') : (translations.settings?.ui?.disabled || 'Disabled')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs ${!config.requireTorrentApproval ? 'text-primary' : 'text-text-secondary'}`}>{translations.settings?.ui?.off || 'Off'}</span>
                      <ToggleSwitch
                        checked={Boolean(config.requireTorrentApproval)}
                        onChange={(e) => handleChange('requireTorrentApproval', e.target.checked)}
                        aria-label={translations.fields?.requireTorrentApproval || 'Require Torrent Approval'}
                      />
                      <span className={`text-xs ${config.requireTorrentApproval ? 'text-primary' : 'text-text-secondary'}`}>{translations.settings?.ui?.on || 'On'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'ratio' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.ratio || 'Ratio & H&R'}</h3>
                <p className="text-text-secondary">{translations.details?.ratio}</p>

                {/* Presets */}
                <div>
                  <h4 className="text-lg font-medium text-text mb-3">{translations.settings?.ratioPresets?.title || 'Ratio Presets'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Easy */}
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('minRatio', 0.3);
                        handleChange('bonusPointsPerHour', 2);
                        handleChange('hitAndRunThreshold', 8);
                        handleChange('requiredSeedingMinutes', 25); // Gracia en minutos aproximada
                      }}
                      className={`relative p-4 border rounded-lg text-left transition-colors ${
                        activeRatioPreset === 'easy'
                          ? 'border-green-600/50 bg-green-600/5'
                          : 'border-border hover:border-green-600/50 hover:bg-green-600/5'
                      }`}
                    >
                      {activeRatioPreset === 'easy' && (
                        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-green-600 text-white">
                          {translations.settings?.ratioPresets?.active || 'Active'}
                        </span>
                      )}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle size={20} className="text-white" />
                        </div>
                        <span className="font-medium text-text">{translations.settings?.ratioPresets?.easy || 'Easy'}</span>
                      </div>
                      <div className="text-xs text-text-secondary space-y-1">
                        <div>• {translations.fields?.minRatio || 'Min Ratio'}: 0.3</div>
                        <div>• {translations.fields?.bonusPointsPerHour || 'Bonus Points per Hour'}: 2</div>
                        <div>• {translations.fields?.hitAndRunThreshold || 'Hit & Run Threshold'}: 8</div>
                        <div>• {translations.fields?.requiredSeedingMinutes || 'Required Seeding Minutes'}: 25</div>
                      </div>
                    </button>

                    {/* Balanced */}
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('minRatio', 0.5);
                        handleChange('bonusPointsPerHour', 1);
                        handleChange('hitAndRunThreshold', 5);
                        handleChange('requiredSeedingMinutes', 50);
                      }}
                      className={`relative p-4 border rounded-lg text-left transition-colors ${
                        activeRatioPreset === 'balanced'
                          ? 'border-blue-600/50 bg-blue-600/5'
                          : 'border-border hover:border-blue-600/50 hover:bg-blue-600/5'
                      }`}
                    >
                      {activeRatioPreset === 'balanced' && (
                        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-blue-600 text-white">
                          {translations.settings?.ratioPresets?.active || 'Active'}
                        </span>
                      )}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <TrendingUp size={20} className="text-white" />
                        </div>
                        <span className="font-medium text-text">{translations.settings?.ratioPresets?.balanced || 'Balanced'}</span>
                      </div>
                      <div className="text-xs text-text-secondary space-y-1">
                        <div>• {translations.fields?.minRatio || 'Min Ratio'}: 0.5</div>
                        <div>• {translations.fields?.bonusPointsPerHour || 'Bonus Points per Hour'}: 1</div>
                        <div>• {translations.fields?.hitAndRunThreshold || 'Hit & Run Threshold'}: 5</div>
                        <div>• {translations.fields?.requiredSeedingMinutes || 'Required Seeding Minutes'}: 50</div>
                      </div>
                    </button>

                    {/* Strict */}
                    <button
                      type="button"
                      onClick={() => {
                        handleChange('minRatio', 1.0);
                        handleChange('bonusPointsPerHour', 0.5);
                        handleChange('hitAndRunThreshold', 3);
                        handleChange('requiredSeedingMinutes', 100);
                      }}
                      className={`relative p-4 border rounded-lg text-left transition-colors ${
                        activeRatioPreset === 'strict'
                          ? 'border-red-600/50 bg-red-600/5'
                          : 'border-border hover:border-red-600/50 hover:bg-red-600/5'
                      }`}
                    >
                      {activeRatioPreset === 'strict' && (
                        <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-red-600 text-white">
                          {translations.settings?.ratioPresets?.active || 'Active'}
                        </span>
                      )}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                          <XCircle size={20} className="text-white" />
                        </div>
                        <span className="font-medium text-text">{translations.settings?.ratioPresets?.strict || 'Strict'}</span>
                      </div>
                      <div className="text-xs text-text-secondary space-y-1">
                        <div>• {translations.fields?.minRatio || 'Min Ratio'}: 1.0</div>
                        <div>• {translations.fields?.bonusPointsPerHour || 'Bonus Points per Hour'}: 0.5</div>
                        <div>• {translations.fields?.hitAndRunThreshold || 'Hit & Run Threshold'}: 3</div>
                        <div>• {translations.fields?.requiredSeedingMinutes || 'Required Seeding Minutes'}: 100</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Manual config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={translations.fields?.minRatio || 'Min Ratio'} type="number" value={String(config.minRatio ?? 0.5)} onChange={(v) => handleChange('minRatio', Number(v))} />
                  <FormField label={translations.fields?.bonusPointsPerHour || 'Bonus Points per Hour'} type="number" value={String(config.bonusPointsPerHour ?? 1)} onChange={(v) => handleChange('bonusPointsPerHour', Number(v))} />
                  <FormField label={translations.fields?.hitAndRunThreshold || 'Hit & Run Threshold'} type="number" value={String(config.hitAndRunThreshold ?? 5)} onChange={(v) => handleChange('hitAndRunThreshold', Number(v))} />
                  <FormField label={translations.fields?.requiredSeedingMinutes || 'Required Seeding Minutes'} type="number" value={String(config.requiredSeedingMinutes ?? 4320)} onChange={(v) => handleChange('requiredSeedingMinutes', Number(v))} />
                  {activeRatioPreset === 'custom' && (
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-text">{(translations.settings?.ratioPresets as { manualTitle?: string })?.manualTitle || 'Manual Configuration'}</h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {(translations.settings?.ratioPresets as { customBadge?: string })?.customBadge || 'Custom Configuration'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'announce' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.announce || 'Announce'}</h3>
                <p className="text-text-secondary">{translations.details?.announce}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={translations.fields?.defaultAnnounceInterval || 'Default Announce Interval (sec)'} type="number" value={String(config.defaultAnnounceInterval ?? 1800)} onChange={(v) => handleChange('defaultAnnounceInterval', Number(v))} />
                  <FormField label={translations.fields?.minAnnounceInterval || 'Min Announce Interval (sec)'} type="number" value={String(config.minAnnounceInterval ?? 300)} onChange={(v) => handleChange('minAnnounceInterval', Number(v))} />
                </div>
              </div>
            )}

            {activeSection === 'clients' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.clients || 'Clients'}</h3>
                <p className="text-text-secondary">{translations.details?.clients}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label={translations.fields?.whitelistedClients || 'Whitelisted Clients (comma-separated)'}
                    value={(config.whitelistedClients || []).join(', ')}
                    onChange={(v) => handleChange('whitelistedClients', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  />
                  <FormField
                    label={translations.fields?.blacklistedClients || 'Blacklisted Clients (comma-separated)'}
                    value={(config.blacklistedClients || []).join(', ')}
                    onChange={(v) => handleChange('blacklistedClients', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  />
                  <FormField
                    label={translations.fields?.allowedFingerprints || 'Allowed Fingerprints (comma-separated)'}
                    value={(config.allowedFingerprints || []).join(', ')}
                    onChange={(v) => handleChange('allowedFingerprints', v.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  />
                </div>
              </div>
            )}

            {activeSection === 'rss' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.rss || 'RSS'}</h3>
                <p className="text-text-secondary">{translations.details?.rss}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={translations.fields?.rssDefaultCount || 'Default RSS Count'} type="number" value={String(config.rssDefaultCount ?? 20)} onChange={(v) => handleChange('rssDefaultCount', Number(v))} />
                </div>
              </div>
            )}

            {/* Invitations */}
            {activeSection === 'invitations' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.invitations || 'Invitations'}</h3>
                <p className="text-text-secondary">{translations.details?.invitations}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={translations.fields?.inviteExpiryHours || 'Invite Expiry (hours)'} type="number" value={String(config.inviteExpiryHours ?? 6)} onChange={(v) => handleChange('inviteExpiryHours', Number(v))} />
                  <FormField label={translations.fields?.maxInvitesPerUser || 'Max Invites per User'} type="number" value={String(config.maxInvitesPerUser ?? 5)} onChange={(v) => handleChange('maxInvitesPerUser', Number(v))} />
                </div>
              </div>
            )}

            {activeSection === 'storage' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.storage || 'Storage'}</h3>
                <p className="text-text-secondary">{translations.details?.storage}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SelectField
                    label={translations.fields?.storageType || 'Storage Type'}
                    value={config.storageType || 'LOCAL'}
                    onChange={(v) => handleChange('storageType', v as ConfigState['storageType'])}
                    options={[
                      { value: 'LOCAL', label: 'LOCAL' },
                      { value: 'S3', label: 'S3' },
                      { value: 'DB', label: 'DB' },
                    ]}
                  />
                  <FormField label={translations.fields?.s3Bucket || 'S3 Bucket'} value={config.s3Bucket || ''} onChange={(v) => handleChange('s3Bucket', v)} />
                  <FormField label={translations.fields?.s3Region || 'S3 Region'} value={config.s3Region || ''} onChange={(v) => handleChange('s3Region', v)} />
                  <FormField label={translations.fields?.s3AccessKeyId || 'S3 Access Key ID'} value={config.s3AccessKeyId || ''} onChange={(v) => handleChange('s3AccessKeyId', v)} />
                  <FormField label={translations.fields?.s3SecretAccessKey || 'S3 Secret Access Key'} type="password" value={config.s3SecretAccessKey || ''} onChange={(v) => handleChange('s3SecretAccessKey', v)} />
                </div>
              </div>
            )}

            {activeSection === 'smtp' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.smtp || 'SMTP'}</h3>
                <p className="text-text-secondary">{translations.details?.smtp}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={translations.fields?.smtpHost || 'SMTP Host'} value={config.smtpHost || ''} onChange={(v) => handleChange('smtpHost', v)} />
                  <FormField label={translations.fields?.smtpPort || 'SMTP Port'} type="number" value={String(config.smtpPort || '')} onChange={(v) => handleChange('smtpPort', Number(v))} />
                  <FormField label={translations.fields?.smtpUser || 'SMTP User'} value={config.smtpUser || ''} onChange={(v) => handleChange('smtpUser', v)} />
                  <FormField label={translations.fields?.smtpPass || 'SMTP Password'} type="password" value={config.smtpPass || ''} onChange={(v) => handleChange('smtpPass', v)} />
                  <FormField label={translations.fields?.smtpFrom || 'SMTP From'} value={config.smtpFrom || ''} onChange={(v) => handleChange('smtpFrom', v)} />
                </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary text-background rounded-md hover:bg-primary/90 disabled:opacity-50"
                      onClick={async () => {
                        try {
                          const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
                          const headers: HeadersInit = { 'Content-Type': 'application/json' };
                          if (token) headers['Authorization'] = `Bearer ${token}`;
                          const res = await fetch(`${API_BASE_URL}/admin/smtp/test`, { method: 'POST', headers, body: JSON.stringify({ to: config.smtpFrom || '' }) });
                          if (!res.ok) throw new Error('Failed');
                          showNotification(translations.settings?.ui?.smtpSuccess || 'Test email sent');
                        } catch {
                          showNotification(translations.settings?.ui?.smtpError || 'Failed to send test email', 'error');
                        }
                      }}
                    >
                      {translations.settings?.ui?.smtpTest || 'Test SMTP'}
                    </button>
                  </div>
              </div>
            )}

            {activeSection === 'antiCheat' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.antiCheat || 'Anti-Cheat'}</h3>
                <p className="text-text-secondary">{translations.details?.antiCheat}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {([
                    { key: 'enableGhostLeechingCheck', label: 'Ghost Leeching Check' },
                    { key: 'enableCheatingClientCheck', label: 'Cheating Client Check' },
                    { key: 'enableIpAbuseCheck', label: 'IP Abuse Check' },
                    { key: 'enableAnnounceRateCheck', label: 'Announce Rate Check' },
                    { key: 'enableInvalidStatsCheck', label: 'Invalid Stats Check' },
                    { key: 'enablePeerBanCheck', label: 'Peer Ban Check' },
                  ] as Array<{ key: keyof ConfigState; label: string }>).map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-text">{(translations.fields && translations.fields[item.key as string]) || item.label}</h4>
                        <p className="text-xs text-text-secondary">{config[item.key] ? (translations.settings?.ui?.enabled || 'Enabled') : (translations.settings?.ui?.disabled || 'Disabled')}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs ${!config[item.key] ? 'text-primary' : 'text-text-secondary'}`}>{translations.settings?.ui?.off || 'Off'}</span>
                        <ToggleSwitch
                          checked={Boolean(config[item.key])}
                          onChange={(e) => handleChange(item.key, e.target.checked)}
                          aria-label={item.label}
                        />
                        <span className={`text-xs ${config[item.key] ? 'text-primary' : 'text-text-secondary'}`}>{translations.settings?.ui?.on || 'On'}</span>
                      </div>
                    </div>
                  ))}
                  <div>
                    <FormField label={translations.fields?.maxStatsJumpMultiplier || 'Max Stats Jump Multiplier'} type="number" value={String(config.maxStatsJumpMultiplier ?? 10)} onChange={(v) => handleChange('maxStatsJumpMultiplier', Number(v))} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'branding' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-text">{translations.sections?.branding || 'Branding'}</h3>
                <p className="text-text-secondary">{translations.details?.branding}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={translations.fields?.brandingName || 'Branding Name'} value={config.brandingName || ''} onChange={(v) => handleChange('brandingName', v)} />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-text">{translations.fields?.showHomePageStats || 'Show Home Page Statistics'}</h4>
                      <p className="text-xs text-text-secondary">
                        {Boolean(config.showHomePageStats) ? (translations.settings?.ui?.enabled || 'Enabled') : (translations.settings?.ui?.disabled || 'Disabled')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs ${!config.showHomePageStats ? 'text-primary' : 'text-text-secondary'}`}>{translations.settings?.ui?.off || 'Off'}</span>
                      <ToggleSwitch
                        checked={Boolean(config.showHomePageStats)}
                        onChange={(e) => handleChange('showHomePageStats', e.target.checked)}
                        aria-label={translations.fields?.showHomePageStats || 'Show Home Page Statistics'}
                      />
                      <span className={`text-xs ${config.showHomePageStats ? 'text-primary' : 'text-text-secondary'}`}>{translations.settings?.ui?.on || 'On'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4 pt-4 border-t border-border">
              <button type="button" onClick={saveConfig} disabled={saving} className="px-4 py-2 bg-primary text-background rounded-md hover:bg-primary/90 disabled:opacity-50">
                {saving ? (translations.settings?.ui?.saving || 'Saving...') : (translations.settings?.ui?.save || 'Save Configuration')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



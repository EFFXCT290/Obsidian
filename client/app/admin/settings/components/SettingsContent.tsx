'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { FormField } from '@/app/components/ui/FigmaFloatingLabelInput';
import { SelectField } from '@/app/components/ui/FigmaFloatingLabelSelect';
import { ToggleSwitch } from '@/app/components/ui/ToggleSwitch';
import { showNotification } from '@/app/utils/notifications';
import { Cog } from '@styled-icons/boxicons-regular/Cog';
import { Envelope } from '@styled-icons/boxicons-regular/Envelope';
import { Shield } from '@styled-icons/boxicons-regular/Shield';
import { Palette } from '@styled-icons/boxicons-regular/Palette';

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
};

export default function SettingsContent({ translations }: SettingsContentProps) {
  const [config, setConfig] = useState<ConfigState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'tracker' | 'smtp' | 'antiCheat' | 'branding' | 'ratio' | 'announce' | 'clients' | 'rss' | 'storage'
  >('tracker');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/admin/config', { headers, cache: 'no-store' });
        const data = (await res.json()) as ConfigState;
        setConfig(data || {});
      } catch {
        showNotification('Failed to load configuration', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/admin/config', { method: 'POST', headers, body: JSON.stringify(config) });
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
                type SectionId = 'tracker' | 'ratio' | 'announce' | 'clients' | 'rss' | 'storage' | 'smtp' | 'antiCheat' | 'branding';
                type IconComponent = ComponentType<{ size?: number }>;
                const sections: Array<{ id: SectionId; title: string; desc?: string; icon: IconComponent }> = [
                  { id: 'tracker', title: translations.sections?.tracker || 'Tracker', desc: translations.details?.tracker, icon: Cog },
                  { id: 'ratio', title: translations.sections?.ratio || 'Ratio & H&R', desc: translations.details?.ratio, icon: Shield },
                  { id: 'announce', title: translations.sections?.announce || 'Announce', desc: translations.details?.announce, icon: Cog },
                  { id: 'clients', title: translations.sections?.clients || 'Clients', desc: translations.details?.clients, icon: Shield },
                  { id: 'rss', title: translations.sections?.rss || 'RSS', desc: translations.details?.rss, icon: Cog },
                  { id: 'storage', title: translations.sections?.storage || 'Storage', desc: translations.details?.storage, icon: Cog },
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={translations.fields?.minRatio || 'Min Ratio'} type="number" value={String(config.minRatio ?? 0.5)} onChange={(v) => handleChange('minRatio', Number(v))} />
                  <FormField label={translations.fields?.bonusPointsPerHour || 'Bonus Points per Hour'} type="number" value={String(config.bonusPointsPerHour ?? 1)} onChange={(v) => handleChange('bonusPointsPerHour', Number(v))} />
                  <FormField label={translations.fields?.hitAndRunThreshold || 'Hit & Run Threshold'} type="number" value={String(config.hitAndRunThreshold ?? 5)} onChange={(v) => handleChange('hitAndRunThreshold', Number(v))} />
                  <FormField label={translations.fields?.requiredSeedingMinutes || 'Required Seeding Minutes'} type="number" value={String(config.requiredSeedingMinutes ?? 4320)} onChange={(v) => handleChange('requiredSeedingMinutes', Number(v))} />
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
                          const res = await fetch('/api/admin/smtp/test', { method: 'POST', headers, body: JSON.stringify({ to: config.smtpFrom || '' }) });
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



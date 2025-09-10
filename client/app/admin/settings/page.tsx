import { Suspense } from 'react';
import { headers } from 'next/headers';
import AdminDashboardWrapper from '@/app/admin/components/AdminDashboardWrapper';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import SettingsContent from './components/SettingsContent';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { LanguageSync } from '@/app/components/LanguageSync';

function SettingsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-surface-light rounded mb-2" />
        <div className="h-4 bg-surface-light rounded" />
      </div>
      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0">
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-light">
              <div className="h-6 bg-surface-light rounded" />
            </div>
            <div className="p-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-3 mb-1">
                  <div className="h-4 bg-surface-light rounded mb-1" />
                  <div className="h-3 bg-surface-light rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-surface border border-border rounded-lg p-8">
            <div className="space-y-6">
              <div className="h-6 bg-surface-light rounded mb-4" />
              <div className="h-4 bg-surface-light rounded mb-6" />
              <div className="h-10 bg-surface-light rounded mb-4" />
              <div className="h-10 bg-surface-light rounded mb-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);

  const translations = {
    title: serverT('admin.settings.title', language),
    description: serverT('admin.settings.description', language),
    sections: {
      tracker: serverT('admin.settings.sections.tracker', language),
      ratio: serverT('admin.settings.sections.ratio', language),
      announce: serverT('admin.settings.sections.announce', language),
      clients: serverT('admin.settings.sections.clients', language),
      invitations: serverT('admin.settings.sections.invitations', language),
      rss: serverT('admin.settings.sections.rss', language),
      storage: serverT('admin.settings.sections.storage', language),
      smtp: serverT('admin.settings.sections.smtp', language),
      antiCheat: serverT('admin.settings.sections.antiCheat', language),
      branding: serverT('admin.settings.sections.branding', language),
    },
    details: {
      tracker: serverT('admin.settings.tracker.description', language),
      ratio: serverT('admin.settings.ratio.description', language),
      announce: serverT('admin.settings.announce.description', language),
      clients: serverT('admin.settings.clients.description', language),
      invitations: serverT('admin.settings.invitations.description', language),
      rss: serverT('admin.settings.rss.description', language),
      storage: serverT('admin.settings.storage.description', language),
      smtp: serverT('admin.settings.smtp.description', language),
      antiCheat: serverT('admin.settings.antiCheat.description', language),
      branding: serverT('admin.settings.branding.description', language),
    },
    settings: {
      ui: {
        sectionsTitle: serverT('admin.settings.ui.sectionsTitle', language),
        save: serverT('admin.settings.ui.save', language),
        saving: serverT('admin.settings.ui.saving', language),
        saved: serverT('admin.settings.ui.saved', language),
        errorLoading: serverT('admin.settings.ui.errorLoading', language),
        errorSaving: serverT('admin.settings.ui.errorSaving', language),
        on: serverT('admin.settings.ui.on', language),
        off: serverT('admin.settings.ui.off', language),
        enabled: serverT('admin.settings.ui.enabled', language),
        disabled: serverT('admin.settings.ui.disabled', language),
        smtpTest: serverT('admin.settings.ui.smtpTest', language),
        smtpSuccess: serverT('admin.settings.ui.smtpSuccess', language),
        smtpError: serverT('admin.settings.ui.smtpError', language),
      },
      ratioPresets: {
        title: serverT('admin.settings.ratioPresets.title', language),
        easy: serverT('admin.settings.ratioPresets.easy', language),
        balanced: serverT('admin.settings.ratioPresets.balanced', language),
        strict: serverT('admin.settings.ratioPresets.strict', language),
        custom: serverT('admin.settings.ratioPresets.custom', language),
        active: serverT('admin.settings.ratioPresets.active', language),
        manualTitle: serverT('admin.settings.ratioPresets.manualTitle', language),
        customBadge: serverT('admin.settings.ratioPresets.customBadge', language),
      },
    },
    fields: {
      registrationMode: serverT('admin.settings.fields.registrationMode', language),
      requireTorrentApproval: serverT('admin.settings.fields.requireTorrentApproval', language),
      minRatio: serverT('admin.settings.fields.minRatio', language),
      bonusPointsPerHour: serverT('admin.settings.fields.bonusPointsPerHour', language),
      hitAndRunThreshold: serverT('admin.settings.fields.hitAndRunThreshold', language),
      requiredSeedingMinutes: serverT('admin.settings.fields.requiredSeedingMinutes', language),
      defaultAnnounceInterval: serverT('admin.settings.fields.defaultAnnounceInterval', language),
      minAnnounceInterval: serverT('admin.settings.fields.minAnnounceInterval', language),
      whitelistedClients: serverT('admin.settings.fields.whitelistedClients', language),
      blacklistedClients: serverT('admin.settings.fields.blacklistedClients', language),
      allowedFingerprints: serverT('admin.settings.fields.allowedFingerprints', language),
      rssDefaultCount: serverT('admin.settings.fields.rssDefaultCount', language),
      inviteExpiryHours: serverT('admin.settings.fields.inviteExpiryHours', language),
      maxInvitesPerUser: serverT('admin.settings.fields.maxInvitesPerUser', language),
      storageType: serverT('admin.settings.fields.storageType', language),
      s3Bucket: serverT('admin.settings.fields.s3Bucket', language),
      s3Region: serverT('admin.settings.fields.s3Region', language),
      s3AccessKeyId: serverT('admin.settings.fields.s3AccessKeyId', language),
      s3SecretAccessKey: serverT('admin.settings.fields.s3SecretAccessKey', language),
      smtpHost: serverT('admin.settings.fields.smtpHost', language),
      smtpPort: serverT('admin.settings.fields.smtpPort', language),
      smtpUser: serverT('admin.settings.fields.smtpUser', language),
      smtpPass: serverT('admin.settings.fields.smtpPass', language),
      smtpFrom: serverT('admin.settings.fields.smtpFrom', language),
      ghostLeechingCheck: serverT('admin.settings.fields.ghostLeechingCheck', language),
      cheatingClientCheck: serverT('admin.settings.fields.cheatingClientCheck', language),
      ipAbuseCheck: serverT('admin.settings.fields.ipAbuseCheck', language),
      announceRateCheck: serverT('admin.settings.fields.announceRateCheck', language),
      invalidStatsCheck: serverT('admin.settings.fields.invalidStatsCheck', language),
      peerBanCheck: serverT('admin.settings.fields.peerBanCheck', language),
      maxStatsJumpMultiplier: serverT('admin.settings.fields.maxStatsJumpMultiplier', language),
      brandingName: serverT('admin.settings.fields.brandingName', language),
      showHomePageStats: serverT('admin.settings.fields.showHomePageStats', language),
    }
  };

  return (
    <AdminDashboardWrapper>
      <LanguageSync serverLanguage={language} />
      <div className="fixed bottom-4 left-4 z-50">
        <LanguageSelector currentLanguage={language} />
      </div>
      <Suspense fallback={<SettingsSkeleton />}> 
        <SettingsContent translations={translations} />
      </Suspense>
    </AdminDashboardWrapper>
  );
}



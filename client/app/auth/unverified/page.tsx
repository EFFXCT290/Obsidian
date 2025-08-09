import { headers } from 'next/headers';
import AuthCard from '../shared/AuthCard';
import { serverT, getPreferredLanguage } from '@/app/lib/server-i18n';
import { LanguageSync } from '@/app/components/LanguageSync';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import ResendVerificationButton from './components/ResendVerificationButton.client';
import LogoutButton from './components/LogoutButton.client';

export default async function UnverifiedPage() {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);
  const title = serverT('auth.unverified.title', language);
  const message = serverT('auth.unverified.message', language);
  const resend = serverT('auth.unverified.resend', language);

  return (
    <>
      <LanguageSync serverLanguage={language} />
      <AuthCard title={title}>
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{message}</p>
          <div className="flex gap-2">
            <ResendVerificationButton label={resend} />
            <LogoutButton label={serverT('auth.login.logout', language)} toast={serverT('auth.notification.successLogout', language)} />
          </div>
        </div>
      </AuthCard>
      <LanguageSelector currentLanguage={language} />
    </>
  );
}



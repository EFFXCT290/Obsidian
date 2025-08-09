import { headers } from 'next/headers';
import { apiClient } from '@/lib/api';
import AuthCard from '../../shared/AuthCard';
import { serverT, getPreferredLanguage } from '@/app/lib/server-i18n';
import { LanguageSync } from '../../../components/LanguageSync';
import { LanguageSelector } from '../../../components/LanguageSelector';
// no Suspense needed here
import { SignUpForm } from '../components/SignUpForm';

type ValidInviteInfo = {
  valid: true;
  code: string;
  createdAt: string;
  expiresAt?: string | null;
  createdBy?: { id: string; username: string } | null;
  usedById?: string | null;
};

type InvalidInviteInfo = { valid: false };
type InviteInfo = ValidInviteInfo | InvalidInviteInfo;

function isValidInvite(info: InviteInfo): info is ValidInviteInfo {
  return info.valid === true;
}

export default async function InviteSignupPage({ params }: { params: Promise<{ code: string }> }) {
  const hdrs = await headers();
  const language = await getPreferredLanguage(hdrs);
  const { code } = await params;
  const title = serverT('auth.register.title', language);
  let inviteInfo: InviteInfo;
  try {
    inviteInfo = await apiClient.getInviteByCode(code) as InviteInfo;
  } catch {
    inviteInfo = { valid: false };
  }

  const usernameLabel = serverT('auth.register.username', language);
  const emailLabel = serverT('auth.register.email', language);
  const passwordLabel = serverT('auth.register.password', language);
  const confirmPasswordLabel = serverT('auth.register.confirmPassword', language);
  const submitButton = serverT('auth.register.submit', language);

  return (
    <>
      <LanguageSync serverLanguage={language} />
      <AuthCard title={title}>
        <div className="space-y-4">
          <div className="p-4 rounded border border-border bg-surface">
            {isValidInvite(inviteInfo) ? (
              <div className="text-sm text-text">
                <div><span className="text-text-secondary">{serverT('auth.register.inviteBanner.invitedBy', language)}:</span> <span className="font-semibold">{inviteInfo.createdBy?.username || '—'}</span></div>
                <div><span className="text-text-secondary">{serverT('auth.register.inviteBanner.code', language)}:</span> <span className="font-mono">{inviteInfo.code}</span></div>
                <div><span className="text-text-secondary">{serverT('auth.register.inviteBanner.expires', language)}:</span> <span className="text-green font-semibold">{inviteInfo.expiresAt ? new Date(inviteInfo.expiresAt).toLocaleString() : '—'}</span></div>
              </div>
          ) : (
              <div className="text-error">{serverT('auth.register.inviteBanner.invalid', language)}</div>
          )}
        </div>
          {isValidInvite(inviteInfo) && (
            <SignUpForm registrationMode="INVITE" inviteCode={inviteInfo.code} hideInviteUi serverTranslations={{
            title,
            usernameLabel,
            emailLabel,
            passwordLabel,
            confirmPasswordLabel,
            submitButton,
            hasAccount: serverT('auth.register.hasAccount', language),
            loginLink: serverT('auth.register.login', language),
            usernameError: serverT('auth.register.errors.username', language),
            emailError: serverT('auth.register.errors.email', language),
            passwordRequirementsError: serverT('auth.register.errors.passwordRequirements', language),
            passwordMatchError: serverT('auth.register.errors.passwordMatch', language),
            invalidCredentialsError: serverT('auth.register.errors.invalidCredentials', language),
            successRegister: serverT('auth.notification.successRegister', language),
            errorNotification: serverT('auth.notification.error', language),
            // minimal placeholders to satisfy types
            usernamePlaceholder: serverT('auth.placeholders.username', language),
            emailPlaceholder: serverT('auth.placeholders.email', language),
            passwordPlaceholder: serverT('auth.placeholders.password', language),
            confirmPasswordPlaceholder: serverT('auth.placeholders.confirmPassword', language),
            registerLoading: serverT('auth.register.loading', language),
            registrationClosedTitle: serverT('auth.register.registrationClosed', language),
            registrationClosedMessage: serverT('auth.register.registrationClosedMessage', language),
            registrationClosedDescription: serverT('auth.register.registrationClosedDescription', language),
            goToLogin: serverT('auth.register.goToLogin', language),
            alreadyHaveAccount: serverT('auth.register.alreadyHaveAccount', language),
            signInHere: serverT('auth.register.signInHere', language),
            securityRecommendations: serverT('auth.register.securityRecommendations', language),
            weak: serverT('auth.register.passwordStrength.weak', language),
            fair: serverT('auth.register.passwordStrength.fair', language),
            good: serverT('auth.register.passwordStrength.good', language),
            strong: serverT('auth.register.passwordStrength.strong', language),
            minLength: serverT('auth.register.passwordRequirements.minLength', language),
            uppercase: serverT('auth.register.passwordRequirements.uppercase', language),
            lowercase: serverT('auth.register.passwordRequirements.lowercase', language),
            number: serverT('auth.register.passwordRequirements.number', language),
            special: serverT('auth.register.passwordRequirements.special', language),
            inviteOnlyTitle: serverT('auth.register.inviteOnly.title', language),
            inviteOnlyMessage: serverT('auth.register.inviteOnly.message', language),
          }} />
        )}
        </div>
      </AuthCard>
      <LanguageSelector currentLanguage={language} />
    </>
  );
}



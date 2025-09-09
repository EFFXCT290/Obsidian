/**
 * Login page component - matches original tracker design
 * Server Component with server-side translations
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import { serverT, getPreferredLanguage } from '@/app/lib/server-i18n';
import AuthCard from '../shared/AuthCard';
import SignInForm from './components/SignInForm';
import { FormFieldSkeleton, ButtonSkeleton, TextSkeleton } from '../../components/ui/Skeleton';
import { LanguageSync } from '../../components/LanguageSync';
import { LanguageSelector } from '../../components/LanguageSelector';

function SignInLoading({ loginLabel, passwordLabel, loginPlaceholder, passwordPlaceholder }: { loginLabel: string; passwordLabel: string; loginPlaceholder: string; passwordPlaceholder: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <FormFieldSkeleton label={loginLabel} placeholder={loginPlaceholder} />
        <FormFieldSkeleton label={passwordLabel} placeholder={passwordPlaceholder} />
        <ButtonSkeleton />
      </div>
      <div className="space-y-4">
        <div className="text-center">
          <TextSkeleton width="w-32" />
        </div>
        <div className="text-center">
          <TextSkeleton width="w-48" />
        </div>
      </div>
    </div>
  );
}

export default async function LoginPage() {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  // Translations
  const title = serverT('auth.login.title', language);
  const loginLabel = serverT('auth.login.login', language);
  const passwordLabel = serverT('auth.login.password', language);
  const loginPlaceholder = serverT('auth.placeholders.login', language);
  const passwordPlaceholder = serverT('auth.placeholders.password', language);
  const submitButton = serverT('auth.login.submit', language);
  const loadingText = serverT('auth.login.loading', language);
  const forgotPassword = serverT('auth.login.forgotPassword', language);
  const noAccount = serverT('auth.login.noAccount', language);
  const signUpLink = serverT('auth.login.signUpLink', language);
  const loginRequired = serverT('auth.login.errors.loginRequired', language);
  const loginMinLength = serverT('auth.login.errors.loginMinLength', language);
  const passwordRequired = serverT('auth.login.errors.passwordRequired', language);
  const passwordMinLength = serverT('auth.login.errors.passwordMinLength', language);
  const userBanned = serverT('auth.errors.userBanned', language);
  const invalidCredentials = serverT('auth.login.errors.invalidCredentials', language);
  const successLogin = serverT('auth.login.success', language);
  const errorNotification = serverT('auth.login.error', language);

  return (
    <>
      <LanguageSync serverLanguage={language} />
      <AuthCard title={title}>
        <Suspense fallback={<SignInLoading loginLabel={loginLabel} passwordLabel={passwordLabel} loginPlaceholder={loginPlaceholder} passwordPlaceholder={passwordPlaceholder} />}>
          <SignInForm
            registrationMode={'open'}
            serverTranslations={{
              loginLabel,
              passwordLabel,
              loginPlaceholder,
              passwordPlaceholder,
              submitButton,
              loadingText,
              forgotPassword,
              noAccount,
              signUpLink,
              loginRequired,
              loginMinLength,
              passwordRequired,
              passwordMinLength,
              userBanned,
              invalidCredentials,
              successLogin,
              errorNotification,
            }}
          />
        </Suspense>
      </AuthCard>
      <LanguageSelector currentLanguage={language} />
    </>
  );
}

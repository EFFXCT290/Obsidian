/**
 * Register page component - Optimized for maximum performance
 * Server Component with direct database access and server-side translations
 * Minimal client-side JavaScript for better performance
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import { serverT, getPreferredLanguage } from '@/app/lib/server-i18n';
import AuthCard from '../shared/AuthCard';
import { SignUpForm } from './components/SignUpForm';
import { FormFieldSkeleton, ButtonSkeleton, TextSkeleton } from '../../components/ui/Skeleton';
import { LanguageSync } from '../../components/LanguageSync';
import { LanguageSelector } from '../../components/LanguageSelector';

// Enhanced loading component with theme-consistent styling
function SignUpLoading({ language }: { language: string }) {
  return (
    <div className="space-y-6">
      {/* Form fields skeleton */}
      <div className="space-y-4">
        <FormFieldSkeleton label={serverT('auth.register.username', language)} placeholder={serverT('auth.placeholders.username', language)} />
        <FormFieldSkeleton label={serverT('auth.register.email', language)} placeholder={serverT('auth.placeholders.email', language)} />
        <FormFieldSkeleton label={serverT('auth.register.password', language)} placeholder={serverT('auth.placeholders.password', language)} />
        <FormFieldSkeleton label={serverT('auth.register.confirmPassword', language)} placeholder={serverT('auth.placeholders.confirmPassword', language)} />
        <ButtonSkeleton />
      </div>

      {/* Links skeleton */}
      <div className="space-y-4">
        <div className="text-center">
          <TextSkeleton width="w-48" />
        </div>
      </div>
    </div>
  );
}

export default async function RegisterPage() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);
  
  // Check authentication server-side
  // const session = await auth();
  
  // Redirect authenticated users to dashboard
  // if (session) {
  //   redirect('/dashboard');
  // }
  
  // Direct database access - no HTTP overhead
  const registrationMode = 'open'; // await getRegistrationMode();

  // Server-side translations with debug logging
  const title = serverT('auth.register.title', language);
  const usernameLabel = serverT('auth.register.username', language);
  const emailLabel = serverT('auth.register.email', language);
  const passwordLabel = serverT('auth.register.password', language);
  const confirmPasswordLabel = serverT('auth.register.confirmPassword', language);
  const submitButton = serverT('auth.register.submit', language);
  // Placeholders & loading
  const usernamePlaceholder = serverT('auth.placeholders.username', language);
  const emailPlaceholder = serverT('auth.placeholders.email', language);
  const passwordPlaceholder = serverT('auth.placeholders.password', language);
  const confirmPasswordPlaceholder = serverT('auth.placeholders.confirmPassword', language);
  const registerLoading = serverT('auth.register.loading', language);
  const hasAccount = serverT('auth.register.hasAccount', language);
  const loginLink = serverT('auth.register.login', language);
  
  // Error messages
  const usernameError = serverT('auth.register.errors.username', language);
  const emailError = serverT('auth.register.errors.email', language);
  const passwordRequirementsError = serverT('auth.register.errors.passwordRequirements', language);
  const passwordMatchError = serverT('auth.register.errors.passwordMatch', language);
  const invalidCredentialsError = serverT('auth.register.errors.invalidCredentials', language);
  const successRegister = serverT('auth.notification.successRegister', language);
  const errorNotification = serverT('auth.notification.error', language);
  
  // Registration closed messages
  const registrationClosedTitle = serverT('auth.register.registrationClosed', language);
  const registrationClosedMessage = serverT('auth.register.registrationClosedMessage', language);
  const registrationClosedDescription = serverT('auth.register.registrationClosedDescription', language);
  const goToLogin = serverT('auth.register.goToLogin', language);
  const alreadyHaveAccount = serverT('auth.register.alreadyHaveAccount', language);
  const signInHere = serverT('auth.register.signInHere', language);
  
  // Password strength translations
  const securityRecommendations = serverT('auth.register.securityRecommendations', language);
  const weak = serverT('auth.register.passwordStrength.weak', language);
  const fair = serverT('auth.register.passwordStrength.fair', language);
  const good = serverT('auth.register.passwordStrength.good', language);
  const strong = serverT('auth.register.passwordStrength.strong', language);
  const minLength = serverT('auth.register.passwordRequirements.minLength', language);
  const uppercase = serverT('auth.register.passwordRequirements.uppercase', language);
  const lowercase = serverT('auth.register.passwordRequirements.lowercase', language);
  const number = serverT('auth.register.passwordRequirements.number', language);
  const special = serverT('auth.register.passwordRequirements.special', language);

  // Debug logging
  console.log('🎯 SignUp Page Server Translations:', {
    language,
    title,
    usernameLabel,
    emailLabel,
    passwordLabel,
    confirmPasswordLabel,
    submitButton,
    hasAccount,
    loginLink,
    registrationMode
  });

  return (
    <>
      <LanguageSync serverLanguage={language} />
      <AuthCard title={title}>
        <Suspense fallback={<SignUpLoading language={language} />}>
          <SignUpForm 
            registrationMode={registrationMode}
            language={language}
            serverTranslations={{
              title,
              usernameLabel,
              emailLabel,
              passwordLabel,
              confirmPasswordLabel,
              submitButton,
              hasAccount,
              loginLink,
              usernameError,
              emailError,
              passwordRequirementsError,
              passwordMatchError,
              invalidCredentialsError,
              successRegister,
              errorNotification,
              // Placeholders & loading
              usernamePlaceholder,
              emailPlaceholder,
              passwordPlaceholder,
              confirmPasswordPlaceholder,
              registerLoading,
              registrationClosedTitle,
              registrationClosedMessage,
              registrationClosedDescription,
              goToLogin,
              alreadyHaveAccount,
              signInHere,
              // Password strength translations
              securityRecommendations,
              weak,
              fair,
              good,
              strong,
              minLength,
              uppercase,
              lowercase,
              number,
              special
            }}
          />
        </Suspense>
      </AuthCard>
      
      {/* Language Selector - Bottom Left Corner */}
      <LanguageSelector currentLanguage={language} />
    </>
  );
}

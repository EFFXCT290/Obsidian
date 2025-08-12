/**
 * SignUpForm Component - Optimized for maximum performance and UX
 * Client component with instant validation and minimal JS
 * Enhanced accessibility and error handling
 * Supports server-side translations for better performance
 */

'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import Link from 'next/link';
import AuthInput from '../../shared/AuthInput';
import PasswordStrengthBar from '@/app/auth/shared/PasswordStrengthBar';
import { useRouter } from 'next/navigation';
import { showNotification } from '@/app/utils/notifications';
import { API_BASE_URL } from '@/lib/api';

interface SignUpFormProps {
  registrationMode: string;
  language?: string;
  // If provided (from invite link), we will hide invite UI and submit this code
  inviteCode?: string;
  // Hide banners/inputs related to invite mode when true (used in invite link page)
  hideInviteUi?: boolean;
  serverTranslations?: {
    title: string;
    usernameLabel: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    submitButton: string;
    // placeholders & loading
    usernamePlaceholder?: string;
    emailPlaceholder?: string;
    passwordPlaceholder?: string;
    confirmPasswordPlaceholder?: string;
    registerLoading?: string;
    hasAccount: string;
    loginLink: string;
    usernameError: string;
    emailError: string;
    passwordRequirementsError: string;
    passwordMatchError: string;
    invalidCredentialsError: string;
    successRegister: string;
    errorNotification: string;
    registrationClosedTitle: string;
    registrationClosedMessage: string;
    registrationClosedDescription: string;
    goToLogin: string;
    alreadyHaveAccount: string;
    signInHere: string;
    // Password strength translations
    securityRecommendations: string;
    weak: string;
    fair: string;
    good: string;
    strong: string;
    minLength: string;
    uppercase: string;
    lowercase: string;
    number: string;
    special: string;
    inviteOnlyTitle?: string;
    inviteOnlyMessage?: string;
  };
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function SignUpForm({ 
  registrationMode: _registrationMode, 
  serverTranslations,
  inviteCode: prefilledInviteCode,
  hideInviteUi = false,
}: SignUpFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: prefilledInviteCode || ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get server translations with fallbacks
  const getServerTranslation = useCallback((key: string, fallbackKey: string): string => {
    if (serverTranslations && key in serverTranslations) {
      const value = serverTranslations[key as keyof typeof serverTranslations];
      return (value as string) ?? t(fallbackKey);
    }
    return t(fallbackKey);
  }, [serverTranslations, t]);

  // Validation functions
  const validateUsername = useCallback((username: string): string | null => {
    if (!username.trim()) {
      return getServerTranslation('usernameError', 'auth.register.errors.username');
    }
    if (username.length < 3) {
      return getServerTranslation('usernameError', 'auth.register.errors.username');
    }
    if (username.length > 20) {
      return getServerTranslation('usernameError', 'auth.register.errors.username');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return getServerTranslation('usernameError', 'auth.register.errors.username');
    }
    return null;
  }, [getServerTranslation]);

  const validateEmail = useCallback((email: string): string | null => {
    if (!email.trim()) {
      return getServerTranslation('emailError', 'auth.register.errors.email');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return getServerTranslation('emailError', 'auth.register.errors.email');
    }
    return null;
  }, [getServerTranslation]);

  const validatePassword = useCallback((password: string): string | null => {
    if (!password) {
      return getServerTranslation('passwordRequirementsError', 'auth.register.errors.passwordRequirements');
    }
    if (password.length < 6) {
      return getServerTranslation('passwordRequirementsError', 'auth.register.errors.passwordRequirements');
    }
    return null;
  }, [getServerTranslation]);

  const validateConfirmPassword = useCallback((confirmPassword: string, password: string): string | null => {
    if (!confirmPassword) {
      return getServerTranslation('passwordRequirementsError', 'auth.register.errors.passwordRequirements');
    }
    if (confirmPassword !== password) {
      return getServerTranslation('passwordMatchError', 'auth.register.errors.passwordMatch');
    }
    return null;
  }, [getServerTranslation]);

  // Instant validation on field change
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
    
    // Validate the field
    let error: string | null = null;
    
    switch (field) {
      case 'username':
        error = validateUsername(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [validateUsername, validateEmail, validatePassword, validateConfirmPassword, formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    // Validate all fields
    const newErrors: FormErrors = {};
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    
    if (usernameError) newErrors.username = usernameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    setErrors({});

    try {
      // Use the Fastify backend API instead of Next.js API route
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          inviteCode: (_registrationMode?.toUpperCase?.() === 'INVITE') ? (prefilledInviteCode || formData.inviteCode) : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || getServerTranslation('errorNotification', 'auth.notification.error'));
      }

      // Store user data (no token since user needs to verify email first)
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        email: data.email,
        username: data.username,
        role: data.role,
        passkey: data.passkey
      }));
      
      showNotification(getServerTranslation('successRegister', 'auth.notification.successRegister'), 'success');
      
      // Redirect to login page since user needs to verify email
      router.push('/auth/signin');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : getServerTranslation('errorNotification', 'auth.register.error');
      setErrors({ general: errorMessage });
      showNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Registration mode banners */}
      {(_registrationMode?.toUpperCase?.() === 'CLOSED') && (
        <div className="p-3 rounded border border-border bg-surface text-text">
          <div className="text-sm font-semibold mb-1">{serverTranslations?.registrationClosedTitle || t('auth.register.registrationClosed')}</div>
          <div className="text-xs text-text-secondary">{serverTranslations?.registrationClosedMessage || t('auth.register.registrationClosedMessage')}</div>
        </div>
      )}
      {(_registrationMode?.toUpperCase?.() === 'INVITE') && !hideInviteUi && (
        <div className="p-3 rounded border border-border bg-surface text-text">
          <div className="text-sm font-semibold mb-1">{serverTranslations?.inviteOnlyTitle || 'Invite-only'}</div>
          <div className="text-xs text-text-secondary">{serverTranslations?.inviteOnlyMessage || 'Registration requires a valid invitation code.'}</div>
        </div>
      )}
      {/* Username field */}
      <AuthInput
        label={getServerTranslation('usernameLabel', 'auth.register.username')}
        name="username"
        type="text"
        value={formData.username}
        onChange={(e) => handleFieldChange('username', e.target.value)}
        error={errors.username}
        placeholder={getServerTranslation('usernamePlaceholder', 'auth.placeholders.username')}
        disabled={loading}
        required
      />

      {/* Email field */}
      <AuthInput
        label={getServerTranslation('emailLabel', 'auth.register.email')}
        name="email"
        type="email"
        value={formData.email}
        onChange={(e) => handleFieldChange('email', e.target.value)}
        error={errors.email}
        placeholder={getServerTranslation('emailPlaceholder', 'auth.placeholders.email')}
        disabled={loading}
        required
      />

      {/* Password field */}
      <AuthInput
        label={getServerTranslation('passwordLabel', 'auth.register.password')}
        name="password"
        type="password"
        value={formData.password}
        onChange={(e) => handleFieldChange('password', e.target.value)}
        error={errors.password}
        placeholder={getServerTranslation('passwordPlaceholder', 'auth.placeholders.password')}
        disabled={loading}
        required
      />

      {/* Invite code when in INVITE mode */}
      {(_registrationMode?.toUpperCase?.() === 'INVITE') && !prefilledInviteCode && !hideInviteUi && (
        <AuthInput
          label={serverTranslations?.inviteOnlyTitle || 'Invitation Code'}
          name="inviteCode"
          type="text"
          value={formData.inviteCode || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, inviteCode: e.target.value }))}
          placeholder={serverTranslations?.inviteOnlyMessage || 'Enter your invitation code'}
          disabled={loading}
          required
        />
      )}

      {/* Password strength bar */}
      {formData.password && (
        <PasswordStrengthBar
          password={formData.password}
          serverTranslations={{
            securityRecommendations: getServerTranslation('securityRecommendations', 'auth.register.securityRecommendations'),
            weak: getServerTranslation('weak', 'auth.register.passwordStrength.weak'),
            fair: getServerTranslation('fair', 'auth.register.passwordStrength.fair'),
            good: getServerTranslation('good', 'auth.register.passwordStrength.good'),
            strong: getServerTranslation('strong', 'auth.register.passwordStrength.strong'),
            minLength: getServerTranslation('minLength', 'auth.register.passwordRequirements.minLength'),
            uppercase: getServerTranslation('uppercase', 'auth.register.passwordRequirements.uppercase'),
            lowercase: getServerTranslation('lowercase', 'auth.register.passwordRequirements.lowercase'),
            number: getServerTranslation('number', 'auth.register.passwordRequirements.number'),
            special: getServerTranslation('special', 'auth.register.passwordRequirements.special')
          }}
        />
      )}

      {/* Confirm Password field */}
      <AuthInput
        label={getServerTranslation('confirmPasswordLabel', 'auth.register.confirmPassword')}
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        placeholder={getServerTranslation('confirmPasswordPlaceholder', 'auth.placeholders.confirmPassword')}
        disabled={loading}
        required
      />

      {/* General error */}
      {errors.general && (
        <div className="text-error text-sm text-center bg-error/10 p-3 rounded-md">
          {errors.general}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || isSubmitting}
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? getServerTranslation('registerLoading', 'auth.register.loading') : getServerTranslation('submitButton', 'auth.register.submit')}
      </button>

      {/* Sign in link */}
      <div className="text-center text-sm">
        <span className="text-text-secondary">
          {getServerTranslation('hasAccount', 'auth.register.hasAccount')}{' '}
        </span>
        <Link 
          href="/auth/signin" 
          className="text-primary hover:text-primary-dark transition-colors"
        >
          {getServerTranslation('loginLink', 'auth.register.login')}
        </Link>
      </div>
    </form>
  );
}

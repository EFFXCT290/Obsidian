/**
 * SignInForm Component - matches original tracker UX
 */

'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import Link from 'next/link';
import AuthInput from '@/app/auth/shared/AuthInput';
import { useRouter } from 'next/navigation';
import { showNotification } from '@/app/utils/notifications';

interface SignInFormProps {
  registrationMode: string;
  language?: string;
  serverTranslations?: Record<string, string>;
}

interface FormData { login: string; password: string; }
interface FormErrors { login?: string; password?: string; general?: string; }

export default function SignInForm({ registrationMode, language = 'es', serverTranslations }: SignInFormProps) {
  const { t } = useI18n();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({ login: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getServerTranslation = useCallback((key: string, fallbackKey: string) => {
    if (serverTranslations && key in serverTranslations) return serverTranslations[key as keyof typeof serverTranslations] as string;
    return t(fallbackKey);
  }, [serverTranslations, t]);

  const validateField = useCallback((name: keyof FormData, value: string): string | undefined => {
    if (name === 'login') {
      if (!value.trim()) return getServerTranslation('loginRequired', 'auth.errors.loginRequired');
      if (value.length < 3) return getServerTranslation('loginMinLength', 'auth.errors.loginMinLength');
    }
    if (name === 'password') {
      if (!value) return getServerTranslation('passwordRequired', 'auth.errors.passwordRequired');
      if (value.length < 6) return getServerTranslation('passwordMinLength', 'auth.errors.passwordMinLength');
    }
    return undefined;
  }, [getServerTranslation]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
    const error = validateField(name as keyof FormData, value);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  }, [errors, validateField]);

  const isFormValid = useCallback(() => {
    return formData.login.trim() && formData.password && formData.login.length >= 3 && formData.password.length >= 6 && !Object.values(errors).some(Boolean);
  }, [formData, errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: FormErrors = {};
    const loginError = validateField('login', formData.login);
    const passwordError = validateField('password', formData.password);
    if (loginError) newErrors.login = loginError;
    if (passwordError) newErrors.password = passwordError;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsSubmitting(true); setLoading(true); setErrors({});
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: formData.login, password: formData.password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || getServerTranslation('errorNotification', 'auth.login.error'));

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (!data.emailVerified) {
        router.push('/auth/unverified?login=' + encodeURIComponent(formData.login));
        return;
      }

      showNotification(getServerTranslation('successLogin', 'auth.login.success'), 'success');
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : getServerTranslation('errorNotification', 'auth.notification.error');
      setErrors({ general: msg });
    } finally {
      setLoading(false); setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label={getServerTranslation('formAriaLabel', 'auth.login.formAriaLabel')}>
        {errors.general && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3" role="alert" aria-live="polite">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <AuthInput
          label={getServerTranslation('loginLabel', 'auth.login')}
          type="text"
          name="login"
          value={formData.login}
          onChange={handleInputChange}
          error={errors.login}
          required
          autoComplete="username"
          autoFocus
          placeholder={getServerTranslation('loginPlaceholder', 'auth.placeholders.login')}
        />

        <AuthInput
          label={getServerTranslation('passwordLabel', 'auth.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          required
          autoComplete="current-password"
          placeholder={getServerTranslation('passwordPlaceholder', 'auth.placeholders.password')}
        />

        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="w-full bg-primary text-background py-2 px-4 rounded hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-describedby="submit-status"
        >
          {loading ? getServerTranslation('loadingText', 'auth.login.loading') : getServerTranslation('submitButton', 'auth.login.submit')}
        </button>
        <div id="submit-status" className="sr-only" aria-live="polite">
          {loading ? getServerTranslation('submitting', 'common.submitting') : getServerTranslation('formReady', 'common.formReady')}
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth/forgot-password" className="text-primary hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
          {getServerTranslation('forgotPassword', 'auth.signin.forgotPassword')}
        </Link>
      </div>

      {registrationMode !== 'closed' && (
        <div className="mt-4 text-center text-sm">
          <span className="text-text-secondary">{getServerTranslation('noAccount', 'auth.signin.noAccount')}{' '}</span>
          <Link href="/auth/signup" className="text-primary hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
            {getServerTranslation('signUpLink', 'auth.signin.signUpLink')}
          </Link>
        </div>
      )}
    </>
  );
}

/**
 * SignInForm Component - Optimized for maximum performance and UX
 * Client component with instant validation and minimal JS
 * Enhanced accessibility and error handling
 * Supports server-side translations for better performance
 */

'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import Link from 'next/link';
import AuthInput from '../../shared/AuthInput';
import toast from 'react-hot-toast';
import { authApi } from '@/app/lib/api';

interface SignInFormProps {
  registrationMode?: string;
  language?: string;
  serverTranslations?: {
    loginLabel: string;
    passwordLabel: string;
    loginPlaceholder: string;
    passwordPlaceholder: string;
    submitButton: string;
    loadingText: string;
    forgotPassword: string;
    noAccount: string;
    signUpLink: string;
    loginRequired: string;
    loginMinLength: string;
    passwordRequired: string;
    passwordMinLength: string;
    userBanned: string;
    invalidCredentials: string;
    successLogin: string;
    errorNotification: string;
  };
}

interface FormData {
  login: string;
  password: string;
}

interface FormErrors {
  login?: string;
  password?: string;
  general?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    emailVerified: boolean;
  };
}

export default function SignInForm({ 
  registrationMode = 'open', 
  language = 'es',
  serverTranslations 
}: SignInFormProps) {
  const { t } = useI18n();
  
  const [formData, setFormData] = useState<FormData>({
    login: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use server translations if available, fallback to client translations
  const getTranslation = useCallback((key: string, fallbackKey?: string) => {
    // Try server translations first
    if (serverTranslations) {
      const serverKey = key as keyof typeof serverTranslations;
      if (serverTranslations[serverKey]) {
        return serverTranslations[serverKey];
      }
    }
    
    // Fallback to client translations
    return t(fallbackKey || key);
  }, [serverTranslations, t]);

  // Get specific server translations with fallbacks
  const getServerTranslation = useCallback((key: string, fallbackKey: string) => {
    if (serverTranslations && key in serverTranslations) {
      return serverTranslations[key as keyof typeof serverTranslations];
    }
    return t(fallbackKey);
  }, [serverTranslations, t]);

  // Instant validation
  const validateField = useCallback((name: keyof FormData, value: string): string | undefined => {
    if (name === 'login') {
      if (!value.trim()) {
        return getServerTranslation('loginRequired', 'auth.errors.loginRequired') || 'El campo de login es requerido';
      }
      if (value.length < 3) {
        return getServerTranslation('loginMinLength', 'auth.errors.loginMinLength') || 'El login debe tener al menos 3 caracteres';
      }
    }
    
    if (name === 'password') {
      if (!value) {
        return getServerTranslation('passwordRequired', 'auth.errors.passwordRequired') || 'La contraseña es requerida';
      }
      if (value.length < 6) {
        return getServerTranslation('passwordMinLength', 'auth.errors.passwordMinLength') || 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    
    return undefined;
  }, [getServerTranslation]);

  // Handle input changes with instant validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Instant validation
    const error = validateField(name as keyof FormData, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [errors, validateField]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return formData.login.trim() && 
           formData.password && 
           formData.login.length >= 3 && 
           formData.password.length >= 6 &&
           !Object.values(errors).some(error => error);
  }, [formData, errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    // Validate all fields
    const newErrors: FormErrors = {};
    const loginError = validateField('login', formData.login);
    const passwordError = validateField('password', formData.password);
    
    if (loginError) newErrors.login = loginError;
    if (passwordError) newErrors.password = passwordError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    setErrors({});

    try {
      // Determine if login is email or username
      const isEmail = formData.login.includes('@');
      const loginData = isEmail 
        ? { email: formData.login, password: formData.password }
        : { username: formData.login, password: formData.password };

      const response = await authApi.login(loginData) as LoginResponse;
      
      // Store token in localStorage
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      toast.success(getServerTranslation('successLogin', 'auth.notification.successLogin'));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      let errorMessage = getServerTranslation('errorNotification', 'auth.notification.error');
      
      if (error instanceof Error && error.message) {
        if (error.message.includes('Invalid credentials')) {
          errorMessage = getServerTranslation('invalidCredentials', 'auth.register.errors.invalidCredentials');
        } else if (error.message.includes('Account is not active')) {
          errorMessage = getServerTranslation('userBanned', 'auth.errors.userBanned');
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        noValidate
        aria-label="Formulario de inicio de sesión"
      >
        {/* General error display */}
        {errors.general && (
          <div 
            className="rounded-md bg-red-50 border border-red-200 p-3"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <AuthInput
          label={getTranslation('loginLabel', 'auth.login')}
          type="text"
          name="login"
          value={formData.login}
          onChange={handleInputChange}
          error={errors.login}
          required
          autoComplete="username"
          autoFocus
          placeholder={getTranslation('loginPlaceholder', 'auth.placeholders.login')}
        />
        
        <AuthInput
          label={getTranslation('passwordLabel', 'auth.password')}
          type="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          required
          autoComplete="current-password"
          placeholder={getTranslation('passwordPlaceholder', 'auth.placeholders.password')}
        />
        
        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="w-full bg-primary text-background py-2 px-4 rounded 
                   hover:bg-primary-dark transition-colors font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-describedby="submit-status"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {getServerTranslation('loadingText', 'common.loading')}
            </span>
          ) : (
            getServerTranslation('submitButton', 'auth.signin.button')
          )}
        </button>
        
        <div id="submit-status" className="sr-only" aria-live="polite">
          {loading ? 'Enviando formulario...' : 'Formulario listo'}
        </div>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link 
          href="/auth/forgot-password"
          className="text-primary hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          {getServerTranslation('forgotPassword', 'auth.signin.forgotPassword')}
        </Link>
      </div>

      {/* Only show registration link if registration is not closed */}
      {registrationMode !== 'closed' && (
        <div className="mt-4 text-center text-sm">
          <span className="text-text-secondary">
            {getServerTranslation('noAccount', 'auth.signin.noAccount')}{' '}
          </span>
          <Link 
            href="/auth/signup"
            className="text-primary hover:text-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            {getServerTranslation('signUpLink', 'auth.signin.signUpLink')}
          </Link>
        </div>
      )}
    </>
  );
}

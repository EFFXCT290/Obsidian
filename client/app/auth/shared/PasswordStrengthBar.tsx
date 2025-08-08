/**
 * Password Strength Bar component - Optimized for server-side translations
 * Displays the strength of a password with visual feedback and security recommendations
 * Uses server translations to prevent flashing on page reload
 */

import React from 'react';
import { useI18n } from '@/app/hooks/useI18n';

interface PasswordStrengthBarProps {
  password: string;
  serverTranslations?: {
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
  };
}

const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ 
  password, 
  serverTranslations 
}) => {
  const { t } = useI18n();

  // Get server translations with fallbacks
  const getServerTranslation = (key: string, fallbackKey: string) => {
    if (serverTranslations && key in serverTranslations) {
      return serverTranslations[key as keyof typeof serverTranslations];
    }
    return t(fallbackKey);
  };

  const calculateStrength = (): { strength: number; message: string } => {
    let strength = 0;

    // Individual validations (20% each)
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;

    let message = getServerTranslation('weak', 'auth.register.passwordStrength.weak');
    if (strength > 20) message = getServerTranslation('fair', 'auth.register.passwordStrength.fair');
    if (strength > 60) message = getServerTranslation('good', 'auth.register.passwordStrength.good');
    if (strength > 80) message = getServerTranslation('strong', 'auth.register.passwordStrength.strong');

    return { strength, message };
  };

  const { strength, message } = calculateStrength();

  const getBarColor = () => {
    if (strength <= 20) return 'bg-[var(--password-weak)]';     // Weak
    if (strength <= 60) return 'bg-[var(--password-fair)]';     // Fair
    if (strength <= 80) return 'bg-[var(--password-good)]';     // Good
    return 'bg-primary';                                        // Strong - uses the existing primary color
  };

  // Check individual requirements
  const requirements = [
    { 
      met: password.length >= 8, 
      text: getServerTranslation('minLength', 'auth.register.passwordRequirements.minLength')
    },
    { 
      met: /[A-Z]/.test(password), 
      text: getServerTranslation('uppercase', 'auth.register.passwordRequirements.uppercase')
    },
    { 
      met: /[a-z]/.test(password), 
      text: getServerTranslation('lowercase', 'auth.register.passwordRequirements.lowercase')
    },
    { 
      met: /[0-9]/.test(password), 
      text: getServerTranslation('number', 'auth.register.passwordRequirements.number')
    },
    { 
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password), 
      text: getServerTranslation('special', 'auth.register.passwordRequirements.special')
    }
  ];

  return (
    <div className="mt-1 mb-4">
      {/* Security Recommendations Header */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-text mb-2">
          {getServerTranslation('securityRecommendations', 'auth.register.securityRecommendations')}
        </h4>
        
        {/* Requirements List */}
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center text-xs">
              <span className={`mr-2 ${req.met ? 'text-green-500' : 'text-gray-400'}`}>
                {req.met ? '✓' : '○'}
              </span>
              <span className={req.met ? 'text-text' : 'text-text-secondary'}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strength Bar */}
      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: `${strength}%` }}
        />
      </div>
      
      {/* Strength Info */}
      {password && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-secondary">{message}</span>
          <span className="text-xs text-text-secondary">{strength}%</span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthBar;

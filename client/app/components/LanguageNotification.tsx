/**
 * Language Change Notification Component
 * 
 * Shows a brief notification when the language is changed.
 * Provides visual feedback to the user about the language switch.
 */

'use client';

import { useState, useEffect } from 'react';

interface LanguageNotificationProps {
  language: string;
  translations: {
    changed: string;
    spanish: string;
    english: string;
  };
}

/**
 * Language Change Notification Component
 * 
 * Displays a toast notification when language is changed.
 * Features:
 * - Auto-dismissing notification
 * - Smooth animations
 * - Responsive design
 * - Accessible notifications
 * 
 * @param language - The new language code
 * @param translations - Translation strings for the notification
 */
export function LanguageNotification({ language, translations }: LanguageNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Language display names
  const languageNames = {
    es: translations.spanish,
    en: translations.english
  };

  useEffect(() => {
    // Show notification when language changes
    if (currentLanguage !== language) {
      setCurrentLanguage(language);
      setIsVisible(true);
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [language, currentLanguage, translations]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-surface border border-border rounded-lg shadow-lg px-4 py-3 flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
        <div className="flex-shrink-0">
          <span className="text-lg">
            {language === 'es' ? '🇪🇸' : '🇺🇸'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text">
            {translations.changed.replace('{{language}}', languageNames[language as keyof typeof languageNames])}
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="flex-shrink-0 text-text-secondary hover:text-text transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Language Selector Component
 * 
 * A dropdown component that allows users to switch between available languages.
 * It updates the language cookie and triggers a page refresh to apply changes.
 */

'use client';

import { useState, useEffect } from 'react';

interface LanguageSelectorProps {
  currentLanguage: string;
  className?: string;
  translations?: {
    spanish: string;
    english: string;
    title: string;
  };
}

/**
 * Language Selector Component
 * 
 * Provides a dropdown interface for language selection.
 * Features:
 * - Shows current language with flag/name
 * - Dropdown with all available languages
 * - Updates cookie and refreshes page on change
 * - Responsive design with proper styling
 * 
 * @param currentLanguage - The currently active language
 * @param className - Optional CSS classes for styling
 */
export function LanguageSelector({ currentLanguage, className = '', translations }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  // Available languages with their display names
  const languages = [
    { code: 'es', name: translations?.spanish || 'Español', flag: '🇪🇸' },
    { code: 'en', name: translations?.english || 'English', flag: '🇺🇸' }
  ];

  const currentLang = languages.find(lang => lang.code === selectedLanguage) || languages[0];

  /**
   * Handle language change
   * Updates the cookie and refreshes the page to apply the new language
   */
  const handleLanguageChange = (languageCode: string) => {
    // Update cookie
    document.cookie = `i18nextLng=${languageCode}; path=/; max-age=31536000`;
    
    // Update local state
    setSelectedLanguage(languageCode);
    
    // Close dropdown
    setIsOpen(false);
    
    // Refresh page to apply new language
    window.location.reload();
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`language-selector relative ${className}`}>
      {/* Current Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-surface border border-border rounded-lg hover:bg-accent-background transition-colors text-text"
        aria-label={translations?.title || "Select language"}
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">
          {currentLang.name}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-accent-background transition-colors ${
                  selectedLanguage === language.code
                    ? 'bg-primary/10 text-primary'
                    : 'text-text'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm font-medium">{language.name}</span>
                {selectedLanguage === language.code && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

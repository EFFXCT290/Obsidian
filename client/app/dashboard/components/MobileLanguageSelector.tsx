'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/app/hooks/useI18n';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';

interface MobileLanguageSelectorProps {
  currentLanguage?: string;
}

export default function MobileLanguageSelector({ currentLanguage = 'es' }: MobileLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    // Update cookie (same as desktop version)
    document.cookie = `i18nextLng=${langCode}; path=/; max-age=31536000`;
    
    // Reload the page to apply the new language
    window.location.reload();
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm text-text bg-background border border-border rounded-lg hover:bg-surface-light transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{currentLang.flag}</span>
          <span className="truncate">{currentLang.name}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-lg shadow-lg z-[60] max-h-32 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center space-x-2 w-full px-3 py-2 text-sm text-left hover:bg-surface-light transition-colors first:rounded-t-lg last:rounded-b-lg ${
                lang.code === currentLanguage ? 'bg-primary/10 text-primary' : 'text-text'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="truncate">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/app/lib/utils"

/**
 * LanguageSelector Component
 * 
 * A dropdown component that allows users to switch between different languages.
 * Features:
 * - Displays current language with flag and code
 * - Dropdown menu with available languages
 * - Automatic synchronization with i18next
 * - Prevents hydration mismatches
 * - Responsive design with smooth animations
 */
export function LanguageSelector({ currentLanguage }: { currentLanguage?: string }) {
  // State to control dropdown visibility
  const [isOpen, setIsOpen] = useState(false)
  // State to track current language
  const [currentLang, setCurrentLang] = useState(currentLanguage ?? 'es')

  // Available languages configuration with flags and display names
  const languages = [
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "en", name: "English", flag: "🇺🇸" }
  ]

  // Find the current language object for display
  const currentLanguageObj = languages.find(lang => lang.code === currentLang) || languages[0]

  // Initialize from cookie if no prop provided
  useEffect(() => {
    if (!currentLanguage) {
      try {
        const match = document.cookie.match(/(?:^|; )i18nextLng=([^;]+)/)
        const lngFromCookie = match ? decodeURIComponent(match[1]) : undefined
        if (lngFromCookie) {
          setCurrentLang(lngFromCookie)
        }
      } catch {}
    }
  }, [currentLanguage])

  /**
   * Handles language change when user selects a new language
   * Updates local state, closes dropdown, and changes i18next language
   * @param languageCode - The language code to switch to
   */
  const handleLanguageChange = (languageCode: string) => {
    setCurrentLang(languageCode)
    setIsOpen(false)
    
    // Update cookie
    document.cookie = `i18nextLng=${languageCode}; path=/; max-age=31536000`
    
    // Refresh page to apply new language
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="relative">
        {/* Main button that toggles the dropdown */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-[var(--color-accent-background)] text-[var(--color-text)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {/* Language flag emoji */}
          <span className="text-lg">{currentLanguageObj.flag}</span>
          {/* Language code in uppercase */}
          <span className="text-sm font-medium">
            {currentLanguageObj.code.toUpperCase()}
          </span>
          {/* Dropdown arrow that rotates when open */}
          <svg
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown menu with language options */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-[var(--color-accent-background)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden min-w-[140px] z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={(e) => {
                  e.stopPropagation() // Prevent event bubbling to overlay
                  handleLanguageChange(language.code)
                }}
                className={cn(
                  "flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-[color-mix(in oklab,var(--color-accent-background)_90%,black)] transition-colors duration-150 text-[var(--color-text)]",
                  // Highlight current language
                  currentLang === language.code && "bg-[color-mix(in oklab,var(--color-primary)_10%,var(--color-accent-background))] text-[var(--color-primary)]"
                )}
              >
                {/* Language flag */}
                <span className="text-lg">{language.flag}</span>
                {/* Language name */}
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {language.name}
                </span>
                {/* Checkmark for current language */}
                {currentLang === language.code && (
                  <svg
                    className="w-4 h-4 text-[var(--color-primary)] ml-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

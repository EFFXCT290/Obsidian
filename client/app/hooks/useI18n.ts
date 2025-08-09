/**
 * useI18n Hook - Client-side internationalization
 * Provides translation function for client components
 */

import { useCallback } from 'react';

// Simple translation function that uses the current language from cookies
export function useI18n() {
  // Minimal fallback-aware translation helper for client components
  const t = useCallback((key: string, fallback?: string): string => {
    // Until full client i18n is wired, prefer provided fallback text
    return fallback ?? key;
  }, []);

  return { t };
}

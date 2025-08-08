/**
 * useI18n Hook - Client-side internationalization
 * Provides translation function for client components
 */

import { useCallback } from 'react';

// Simple translation function that uses the current language from cookies
export function useI18n() {
  const t = useCallback((key: string, options?: any): string => {
    // For now, return the key as fallback
    // In a real implementation, this would use i18next or similar
    return key;
  }, []);

  return { t };
}

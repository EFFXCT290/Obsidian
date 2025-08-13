/**
 * useI18n Hook - Client-side internationalization
 * Provides translation function for client components
 */

'use client';

import { useCallback, useMemo } from 'react';
import es from '@/app/locales/es.json';
import en from '@/app/locales/en.json';
import { useI18nResources } from './I18nProvider';

type Resources = typeof es & typeof en;

function getCookieLanguage(): 'es' | 'en' {
  try {
    if (typeof document === 'undefined') return 'es';
    const match = document.cookie.match(/(?:^|; )i18nextLng=([^;]+)/);
    const lng = match ? decodeURIComponent(match[1]) : '';
    if (lng === 'en' || lng === 'es') return lng;
  } catch {}
  const nav = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language.toLowerCase() : 'es';
  if (nav.startsWith('en')) return 'en';
  return 'es';
}

function getByKeyPath(obj: unknown, keyPath: string): unknown {
  const parts = keyPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined;
    const record = current as Record<string, unknown>;
    if (!(part in record)) return undefined;
    current = record[part];
  }
  return current;
}

// Client-side translation hook using cookie language and bundled resources
export function useI18n() {
  const provided = useI18nResources();
  const language = useMemo(() => getCookieLanguage(), []);
  const resources: Resources = useMemo(() => {
    if (provided) return provided as Resources;
    return ({ ...(language === 'en' ? en : es) }) as Resources;
  }, [provided, language]);

  const t = useCallback((key: string, fallback?: string): string => {
    const val = getByKeyPath(resources, key);
    if (typeof val === 'string') return val as string;
    return fallback ?? key;
  }, [resources]);

  return { t };
}

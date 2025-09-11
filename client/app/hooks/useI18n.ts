/**
 * useI18n Hook - Client-side internationalization
 * Provides translation function for client components
 */

'use client';

import { useCallback, useMemo } from 'react';
import es from '@/app/locales/es.json';
import en from '@/app/locales/en.json';
import zh from '@/app/locales/zh.json';
import { useI18nResources } from './I18nProvider';

const allLanguages = { en, es, zh } as const;
type Lang = keyof typeof allLanguages;
const AVAIL_LANG = Object.keys(allLanguages) as Lang[];
type Resources = typeof allLanguages[Lang];

function isLang(x: string): x is Lang {
  return (AVAIL_LANG as readonly string[]).includes(x);
}

function getCookieLanguage(): Lang {
  try {
    if (typeof document === 'undefined') return 'es';
    const match = document.cookie.match(/(?:^|; )i18nextLng=([^;]+)/);
    const lng = match ? decodeURIComponent(match[1]) : '';
    if (isLang(lng)) return lng;
  } catch {}
  const nav = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language.toLowerCase() : 'es';
  const lng = nav.slice(0, 2);
  if (isLang(lng)) return lng;
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
export function useI18n(initialLanguage?: string) {
  const provided = useI18nResources();
  const language = useMemo(() => {
    // Use initial language if provided (from server), otherwise detect from cookie
    if (initialLanguage && (initialLanguage === 'en' || initialLanguage === 'es')) {
      return initialLanguage;
    }
    return getCookieLanguage();
  }, [initialLanguage]);
  const resources: Resources = useMemo(() => {
    if (provided) return provided as Resources;
    if (isLang(language)) return allLanguages[language];
    return es;
  }, [provided, language]);

  const t = useCallback((key: string, fallback?: string): string => {
    const val = getByKeyPath(resources, key);
    if (typeof val === 'string') return val as string;
    return fallback ?? key;
  }, [resources]);

  return { t };
}

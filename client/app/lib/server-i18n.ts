/**
 * Server-side i18n utilities
 * Provides translation functions for Server Components
 * Supports both server-side rendering and client-side hydration
 */

import esTranslations from "../locales/es.json";
import enTranslations from "../locales/en.json";
import zhTranslations from '../locales/zh.json';
import { cookies } from "next/headers";

// Translation resources for server-side use
const serverResources = {
  es: esTranslations,
  en: enTranslations,
  zh: zhTranslations,
} as const;

// Default language
const DEFAULT_LANGUAGE = "es";

/**
 * Get user's preferred language from headers
 * Supports Accept-Language header and custom headers
 */
export async function getLanguageFromHeaders(headers: Headers): Promise<string> {
  // Check for custom language header first
  const customLang = headers.get("x-language");
  if (customLang && isLanguageSupported(customLang)) {
    return customLang;
  }

  // Check Accept-Language header
  const acceptLanguage = headers.get("accept-language");
  if (acceptLanguage) {
    // Parse Accept-Language header
    const languages = acceptLanguage
      .split(",")
      .map(lang => lang.split(";")[0].trim().toLowerCase());
    
    // Check for available language
    for (const lang of languages) {
      const lng = lang.slice(0, 2);
      if(isLanguageSupported(lng)) return lng;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Get user's preferred language from cookies
 * Reads the i18nextLng cookie set by the client
 */
export async function getLanguageFromCookies(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const languageCookie = cookieStore.get("i18nextLng");
    
    if (languageCookie && isLanguageSupported(languageCookie.value)) {
      return languageCookie.value;
    }
  } catch (error) {
    // If cookies() fails (e.g., in middleware), return default
    console.warn("Could not read language cookie:", error);
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Get user's preferred language with fallback strategy
 * Priority: Cookies > Headers > Default
 */
export async function getPreferredLanguage(headers: Headers): Promise<string> {
  // First try to get language from cookies (user's explicit choice)
  const cookieLanguage = await getLanguageFromCookies();
  if (cookieLanguage !== DEFAULT_LANGUAGE) {
    return cookieLanguage;
  }
  
  // Fallback to header detection
  return await getLanguageFromHeaders(headers);
}

/**
 * Server-side translation function
 * Works in Server Components and API routes
 */
export function serverT(key: string, language: string = DEFAULT_LANGUAGE): string {
  const resources = serverResources[language as keyof typeof serverResources] || serverResources.es;
  
  // Navigate through nested keys (e.g., "auth.signin.title")
  const keys = key.split(".");
  let value: unknown = resources;
  
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Return the key if translation not found
      return key;
    }
  }
  
  return typeof value === "string" ? value : key;
}

/**
 * Get all translations for a specific language
 * Useful for preloading translations
 */
export function getTranslations(language: string = DEFAULT_LANGUAGE) {
  return serverResources[language as keyof typeof serverResources] || serverResources.es;
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(serverResources);
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return language in serverResources;
}

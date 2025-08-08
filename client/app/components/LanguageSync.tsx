/**
 * Language Sync Component
 * 
 * This component synchronizes the server-side language detection
 * with the client-side language state. It ensures that the
 * language detected on the server is properly reflected on the client.
 */

'use client';

import { useEffect } from 'react';

interface LanguageSyncProps {
  serverLanguage: string;
}

/**
 * Language Sync Component
 * 
 * Synchronizes server-side language detection with client-side state.
 * This ensures that the language detected on the server (from headers/cookies)
 * is properly reflected in the client-side language state.
 * 
 * @param serverLanguage - The language detected on the server
 */
export function LanguageSync({ serverLanguage }: LanguageSyncProps) {
  useEffect(() => {
    // Set the language cookie to match server detection
    document.cookie = `i18nextLng=${serverLanguage}; path=/; max-age=31536000`;
    
    // Log the language sync for debugging
    console.log('🌐 Language sync:', { serverLanguage });
  }, [serverLanguage]);

  // This component doesn't render anything
  return null;
}

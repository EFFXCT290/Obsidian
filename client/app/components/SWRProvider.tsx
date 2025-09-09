"use client";

import { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';

/**
 * SWRProvider
 * Proveedor global de SWR con caché persistente en localStorage.
 * Esto permite que los datos se reutilicen entre recargas y rutas.
 */
export default function SWRProvider({ children }: PropsWithChildren) {
  // Proveedor de caché basado en localStorage (patrón oficial SWR)
  const localStorageProvider = () => {
    const map = new Map<string, unknown>(
      JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('app-swr-cache') || '[]' : '[]')
    );
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        try {
          const cache = JSON.stringify(Array.from(map.entries()));
          localStorage.setItem('app-swr-cache', cache);
        } catch {
          // ignore quota errors
        }
      });
    }
    return map;
  };

  return (
    <SWRConfig
      value={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: localStorageProvider as any,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2 * 60 * 1000,
        errorRetryCount: 2,
        errorRetryInterval: 1000,
        fetcher: async (key: string) => {
          const res = await fetch(key, { cache: 'no-store' });
          if (!res.ok) throw new Error(`Request failed: ${res.status}`);
          return res.json();
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}



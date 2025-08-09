/**
 * Global Error Page
 * Displays a global error message for server-side errors
 * This is the root error boundary for the entire app
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useI18n } from '@/app/hooks/useI18n';
import { LanguageSelector } from '@/app/components/LanguageSelector';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col bg-background text-text">
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center p-8 bg-surface border border-border rounded-lg max-w-2xl w-[90%]">
              <h1 className="text-6xl text-error leading-none font-mono">500</h1>
              <p className="text-2xl text-text mt-4 font-medium">
                {t('errors.global.title', 'Error Global del Servidor')}
              </p>

              <div className="my-6 p-4 bg-background rounded border border-border">
                <code className="text-orange font-mono text-sm">
                  {error.message || t('errors.global.message', 'Ha ocurrido un error crítico en el servidor')}
                </code>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-primary text-background font-semibold rounded hover:bg-primary-dark transition-colors"
                >
                  {t('errors.global.retry', 'Reintentar')}
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 border border-border text-text rounded hover:border-primary hover:bg-surface transition-colors"
                >
                  {t('errors.global.home', 'Ir al Inicio')}
                </Link>
              </div>
            </div>
          </main>
          <LanguageSelector />
        </div>
      </body>
    </html>
  );
}



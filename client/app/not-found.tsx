/**
 * Not Found Page
 * Displays a 404 error message when a page is not found
 * Includes navigation options to return to the main page
 */

'use client';

import Link from 'next/link';
import { useI18n } from '@/app/hooks/useI18n';
import { LanguageSelector } from '@/app/components/LanguageSelector';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center p-8 bg-surface border border-border rounded-lg max-w-2xl w-[90%]">
          <h1 className="text-6xl text-error leading-none font-mono">404</h1>
          <p className="text-2xl text-text mt-4 font-medium">
            {t('errors.404.title', 'Página No Encontrada')}
          </p>

          <p className="text-text-secondary mt-4 mb-6">
            {t('errors.404.message', 'La página que buscas no existe o ha sido movida')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              href="/"
              className="px-6 py-3 bg-primary text-background font-semibold rounded hover:bg-primary-dark transition-colors"
            >
              {t('errors.404.home', 'Ir al Inicio')}
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-border text-text rounded hover:border-primary hover:bg-surface transition-colors"
            >
              {t('errors.404.back', 'Volver Atrás')}
            </button>
          </div>
        </div>
      </main>
      <LanguageSelector />
    </div>
  );
}



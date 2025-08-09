/**
 * Home Page - Simplified version for Fastify API
 * 
 * This page displays the main landing page for the torrent tracker.
 * It connects to the Fastify API to show site statistics and provides
 * navigation to authentication pages.
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { serverT, getPreferredLanguage } from './lib/server-i18n';
import { LanguageSync } from './components/LanguageSync';
import { LanguageSelector } from './components/LanguageSelector';
import { LanguageNotification } from './components/LanguageNotification';

/**
 * Loading component for the home page
 */
// Skeleton intentionally omitted from export to avoid unused warnings

/**
 * Statistics component that fetches data from the API
 */
async function SiteStatistics() {
  try {
    const stats = await apiClient.getStats();
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-4 bg-surface rounded-lg border border-border">
          <div className="text-2xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-text-secondary">Users</div>
        </div>
        <div className="text-center p-4 bg-surface rounded-lg border border-border">
          <div className="text-2xl font-bold text-green">{stats.totalTorrents.toLocaleString()}</div>
          <div className="text-sm text-text-secondary">Torrents</div>
        </div>
        <div className="text-center p-4 bg-surface rounded-lg border border-border">
          <div className="text-2xl font-bold text-orange">{stats.totalDownloads.toLocaleString()}</div>
          <div className="text-sm text-text-secondary">Downloads</div>
        </div>
        <div className="text-center p-4 bg-surface rounded-lg border border-border">
          <div className="text-2xl font-bold text-yellow">{stats.totalUploadFormatted}</div>
          <div className="text-sm text-text-secondary">Uploaded</div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return (
      <div className="text-center p-4 bg-error/10 border border-error/20 rounded-lg mb-8">
        <p className="text-error">Unable to load site statistics</p>
        <p className="text-sm text-text-secondary">API connection failed</p>
      </div>
    );
  }
}

/**
 * Format bytes to human readable format
 */
// formatBytes helper removed (no longer used)

/**
 * Main home page component
 */
export default async function Home() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);
  // Load branding
  let brandingName = 'Obsidian Tracker';
  try {
    const branding = await apiClient.getBranding();
    brandingName = branding.brandingName || brandingName;
  } catch {}
  
  // Server-side translations
  // const title = serverT('home.title', language);
  const subtitle = serverT('home.subtitle', language);
  const welcomeTitle = serverT('home.welcome.title', language);
  const welcomeDescription = serverT('home.welcome.description', language);
  const footerDescription = serverT('home.footer.description', language);
  const loginText = serverT('home.footer.login', language);
  const registerText = serverT('home.footer.register', language);
  const aboutText = serverT('home.footer.about', language);
  const statsText = serverT('home.footer.stats', language);
    const apiText = serverT('home.footer.api', language);

  // Language selector translations
  // const languageSelectorTranslations = {
  //   spanish: serverT('language.selector.spanish', language),
  //   english: serverT('language.selector.english', language),
  //   title: serverT('language.selector.title', language)
  // };

  // Language notification translations
  const languageNotificationTranslations = {
    changed: serverT('language.notification.changed', language),
    spanish: serverT('language.notification.spanish', language),
    english: serverT('language.notification.english', language)
  };

  return (
    <>
      <LanguageSync serverLanguage={language} />
      <LanguageNotification 
        language={language} 
        translations={languageNotificationTranslations}
      />
      <div className="min-h-screen flex flex-col bg-background text-text">
        {/* Language Selector */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector currentLanguage={language} />
        </div>
        
        <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Obsidian logo"
            width={160}
            height={160}
            quality={100}
            priority
            sizes="160px"
            className="mx-auto mb-8"
            draggable={false}
          />
          <h1 className="text-6xl tracking-tighter mb-4">
            {(() => {
              const parts = brandingName.trim().split(/\s+/);
              if (parts.length >= 2) {
                const first = parts.slice(0, -1).join(' ');
                const last = parts[parts.length - 1];
                return (
                  <>
                    <span className="text-purple-500">{first} </span>
                    <span className="text-green">{last}</span>
                  </>
                );
              }
              return <span className="text-purple-500">{brandingName}</span>;
            })()}
          </h1>
          <p className="text-text-secondary text-lg">
            {subtitle}
          </p>
        </div>
        
        {/* Site Statistics */}
        <Suspense fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-4 bg-surface rounded-lg border border-border animate-pulse">
                <div className="h-8 bg-text-secondary rounded mb-2"></div>
                <div className="h-4 bg-text-secondary rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        }>
          <SiteStatistics />
        </Suspense>
        
        <div className="flex space-x-6 mb-8">
          <Link 
            href="/auth/signin"
            className="px-8 py-3 bg-primary text-background rounded-lg hover:bg-primary-dark transition-colors font-medium text-lg"
          >
            {loginText}
          </Link>
          <Link 
            href="/auth/signup"
            className="px-8 py-3 bg-surface border border-border text-text rounded-lg hover:bg-accent-background transition-colors font-medium text-lg"
          >
            {registerText}
          </Link>
        </div>

        <div className="text-center text-text-secondary">
          <p className="mb-4">
            {welcomeTitle}
          </p>
          <p className="text-sm">
            {welcomeDescription}
          </p>
        </div>
      </main>

      <footer className="text-center p-8 bg-surface border-t border-border">
        <p className="text-text-secondary mb-4">
          {footerDescription}
        </p>
        <nav className="flex justify-center space-x-4">
          <Link href="/about" className="text-text hover:text-primary transition-colors">
            {aboutText}
          </Link>
          <span className="text-border">|</span>
          <Link href="/stats" className="text-text hover:text-primary transition-colors">
            {statsText}
          </Link>
          <span className="text-border">|</span>
          <Link href="/api" className="text-text hover:text-primary transition-colors">
            {apiText}
          </Link>
        </nav>
      </footer>
    </div>
    </>
  );
}

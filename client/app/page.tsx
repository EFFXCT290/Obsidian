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
import { API_BASE_URL } from '@/lib/api';
import { serverT, getPreferredLanguage } from './lib/server-i18n';
import { LanguageSync } from './components/LanguageSync';
import { LanguageSelector } from './components/LanguageSelector';
import { LanguageNotification } from './components/LanguageNotification';

/**
 * Loading component for the home page
 */
// Skeleton intentionally omitted from export to avoid unused warnings

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Statistics component that fetches data from the API
 */
async function SiteStatistics({language}: {language: string}) {
  const usersText = serverT('common.users', language);
  const torrentsText = serverT('common.torrents', language);
  const downloadsText = serverT('common.downloads', language);
  const uploadedText = serverT('common.uploaded', language);
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    const stats = await response.json();
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto px-4">
        <div className="text-center p-3 sm:p-4 bg-surface rounded-lg border border-border">
          <div className="text-lg sm:text-2xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-xs sm:text-sm text-text-secondary">{usersText}</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-surface rounded-lg border border-border">
          <div className="text-lg sm:text-2xl font-bold text-green">{stats.totalTorrents.toLocaleString()}</div>
          <div className="text-xs sm:text-sm text-text-secondary">{torrentsText}</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-surface rounded-lg border border-border">
          <div className="text-lg sm:text-2xl font-bold text-orange">{stats.totalDownloads.toLocaleString()}</div>
          <div className="text-xs sm:text-sm text-text-secondary">{downloadsText}</div>
        </div>
        <div className="text-center p-3 sm:p-4 bg-surface rounded-lg border border-border">
          <div className="text-lg sm:text-2xl font-bold text-yellow">{formatBytes(stats.totalUploadBytes)}</div>
          <div className="text-xs sm:text-sm text-text-secondary">{uploadedText}</div>
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
 * Main home page component
 */
export default async function Home() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);
  // Load branding and configuration
  let brandingName = 'Obsidian Tracker';
  let showHomePageStats = true;
  try {
    const response = await fetch(`${API_BASE_URL}/config/branding`);
    const branding = await response.json();
    brandingName = branding.brandingName || brandingName;
    showHomePageStats = branding.showHomePageStats ?? true;
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
    english: serverT('language.notification.english', language),
    chinese: serverT('language.notification.chinese', language),
  };

  return (
    <>
      <LanguageSync serverLanguage={language} />
      <LanguageNotification 
        language={language} 
        translations={languageNotificationTranslations}
      />
      <div className="min-h-screen flex flex-col bg-background text-text">
        {/* Language Selector - Mobile: top-left */}
        <LanguageSelector currentLanguage={language} className="absolute top-2 left-2 sm:hidden" />
        
        {/* Language Selector - Desktop: bottom-left */}
        <LanguageSelector currentLanguage={language} className="hidden sm:block absolute bottom-4 left-4" />
        
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <Image
            src="/logo.png"
            alt="Obsidian logo"
            width={160}
            height={160}
            quality={100}
            priority
            sizes="(max-width: 640px) 140px, 160px"
            className="mx-auto mb-6 sm:mb-8 w-32 h-32 sm:w-40 sm:h-40"
            draggable={false}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tighter mb-3 sm:mb-4">
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
          <p className="text-text-secondary text-base sm:text-lg px-4">
            {subtitle}
          </p>
        </div>
        
        {/* Site Statistics */}
        {showHomePageStats && (
          <Suspense fallback={
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-4xl mx-auto px-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center p-3 sm:p-4 bg-surface rounded-lg border border-border animate-pulse">
                  <div className="h-6 sm:h-8 bg-text-secondary rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-text-secondary rounded w-12 sm:w-16 mx-auto"></div>
                </div>
              ))}
            </div>
          }>
            <SiteStatistics language={language} />
          </Suspense>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 sm:space-x-6 mb-6 sm:mb-8 px-4">
          <Link 
            href="/auth/signin"
            className="px-6 sm:px-8 py-3 bg-primary text-background rounded-lg hover:bg-primary-dark transition-colors font-medium text-base sm:text-lg text-center"
          >
            {loginText}
          </Link>
          <Link 
            href="/auth/signup"
            className="px-6 sm:px-8 py-3 bg-surface border border-border text-text rounded-lg hover:bg-accent-background transition-colors font-medium text-base sm:text-lg text-center"
          >
            {registerText}
          </Link>
        </div>

        <div className="text-center text-text-secondary px-4 max-w-2xl mx-auto">
          <p className="mb-3 sm:mb-4 text-base sm:text-lg">
            {welcomeTitle}
          </p>
          <p className="text-sm sm:text-base">
            {welcomeDescription}
          </p>
        </div>
      </main>

      <footer className="text-center p-4 sm:p-8 bg-surface border-t border-border">
        <p className="text-text-secondary mb-4 text-sm sm:text-base px-4">
          {footerDescription}
        </p>
        <nav className="flex justify-center items-center space-x-4">
          <Link href="/about" className="text-text hover:text-primary transition-colors text-sm sm:text-base">
            {aboutText}
          </Link>
          <span className="text-border">|</span>
          <Link href="/stats" className="text-text hover:text-primary transition-colors text-sm sm:text-base">
            {statsText}
          </Link>
          <span className="text-border">|</span>
          <Link href="/api" className="text-text hover:text-primary transition-colors text-sm sm:text-base">
            {apiText}
          </Link>
        </nav>
      </footer>
    </div>
    </>
  );
}

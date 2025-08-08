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
import { apiClient, SiteStats } from '@/lib/api';
import { serverT, getPreferredLanguage } from './lib/server-i18n';
import { LanguageSync } from './components/LanguageSync';
import { LanguageSelector } from './components/LanguageSelector';
import { LanguageNotification } from './components/LanguageNotification';

/**
 * Loading component for the home page
 */
function HomeLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <div className="h-16 bg-gradient-to-r from-primary to-accent-background rounded-lg mb-4 animate-pulse"></div>
          <div className="h-6 bg-text-secondary rounded w-64 mx-auto animate-pulse"></div>
        </div>
        
        <div className="flex space-x-6 mb-8">
          <div className="w-32 h-12 bg-primary rounded-lg animate-pulse"></div>
          <div className="w-32 h-12 bg-surface rounded-lg animate-pulse"></div>
        </div>

        <div className="text-center">
          <div className="h-4 bg-text-secondary rounded w-80 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-text-secondary rounded w-64 mx-auto animate-pulse"></div>
        </div>
      </main>

      <footer className="text-center p-8 bg-surface border-t border-border">
        <div className="h-4 bg-text-secondary rounded w-96 mx-auto mb-4 animate-pulse"></div>
        <div className="flex justify-center space-x-4">
          <div className="h-4 bg-text-secondary rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-border rounded w-1"></div>
          <div className="h-4 bg-text-secondary rounded w-16 animate-pulse"></div>
          <div className="h-4 bg-border rounded w-1"></div>
          <div className="h-4 bg-text-secondary rounded w-16 animate-pulse"></div>
        </div>
      </footer>
    </div>
  );
}

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
          <div className="text-2xl font-bold text-yellow">{stats.totalUpload}</div>
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
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Main home page component
 */
export default async function Home() {
  // Get headers for language detection
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);
  
  // Server-side translations
  const title = serverT('home.title', language);
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
  const languageSelectorTranslations = {
    spanish: serverT('language.selector.spanish', language),
    english: serverT('language.selector.english', language),
    title: serverT('language.selector.title', language)
  };

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
          <LanguageSelector 
            currentLanguage={language} 
            translations={languageSelectorTranslations}
          />
        </div>
        
        <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl tracking-tighter mb-4">
            <span className="text-text">Obsidian</span>
            <span className="text-green">Tracker</span>
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

import { ReactNode, Suspense } from 'react';
import { headers } from 'next/headers';
import { serverT, getPreferredLanguage } from '@/app/lib/server-i18n';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import { API_BASE_URL } from '@/lib/api';

interface DashboardWrapperProps {
  children: ReactNode;
}

export default async function DashboardWrapper({ children }: DashboardWrapperProps) {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  const navItems = [
    { href: '/dashboard', label: serverT('sidebar.nav.home', language), icon: 'Home' },
    { href: '/categories', label: serverT('sidebar.nav.categories', language), icon: 'ListUl' },
    { href: '/requests', label: serverT('sidebar.nav.requests', language), icon: 'HelpCircle' },
    { href: '/announcements', label: serverT('sidebar.nav.announcements', language), icon: 'News' },
    { href: '/wiki', label: serverT('sidebar.nav.wiki', language), icon: 'BookOpen' },
    { href: '/rss', label: serverT('sidebar.nav.rss', language), icon: 'Rss' },
    { href: '/bookmarks', label: serverT('sidebar.nav.bookmarks', language), icon: 'Bookmark' },
  ];

  // Load branding from API
  let brandingName = 'Obsidian Tracker';
  try {
    const response = await fetch(`${API_BASE_URL}/config/branding`);
    const branding = await response.json();
    brandingName = branding.brandingName || brandingName;
  } catch {}

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="h-16 bg-surface border-b border-border fixed top-0 left-0 right-0 z-30" />
      }>
        <DashboardHeader language={language} brandingName={brandingName} />
      </Suspense>

      <Suspense fallback={
        <div className="w-64 bg-surface border-r border-border h-screen fixed left-0 top-16 z-20" />
      }>
        <DashboardSidebar navItems={navItems} />
      </Suspense>

      <main className="flex-1 ml-64 pt-16 p-6">
        {children}
      </main>

      {/* Language Selector - Bottom Left Corner */}
      <LanguageSelector currentLanguage={language} />
    </div>
  );
}



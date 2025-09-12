import { ReactNode, Suspense } from 'react';
import { headers } from 'next/headers';
import { serverT, getPreferredLanguage } from '@/app/lib/server-i18n';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import { API_BASE_URL } from '@/lib/api';
import { MobileSidebarProvider } from '../context/MobileSidebarContext';

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
    <MobileSidebarProvider>
      <div className="h-screen bg-background overflow-hidden">
        <Suspense fallback={
          <div className="h-16 bg-surface border-b border-border fixed top-0 left-0 right-0 z-50" />
        }>
          <DashboardHeader language={language} brandingName={brandingName} />
        </Suspense>

        <Suspense fallback={
          <div className="w-64 bg-surface border-r border-border h-[calc(100vh-4rem)] fixed left-0 top-16 z-20" />
        }>
          <DashboardSidebar navItems={navItems} brandingName={brandingName} currentLanguage={language} />
        </Suspense>

        <main className="h-full lg:ml-64 pt-16 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </MobileSidebarProvider>
  );
}



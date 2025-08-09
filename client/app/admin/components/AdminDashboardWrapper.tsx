import { Suspense } from 'react';
import { headers } from 'next/headers';
import { getPreferredLanguage, serverT } from '@/app/lib/server-i18n';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import type { AdminNavItem } from './AdminSidebarClient';

export default async function AdminDashboardWrapper({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const language = await getPreferredLanguage(headersList);

  const items: AdminNavItem[] = [
    { href: '/admin/dashboard', label: serverT('admin.nav.dashboard', language), icon: 'Home' },
    { href: '/admin/users', label: serverT('admin.nav.users', language), icon: 'Group' },
    { href: '/admin/categories', label: serverT('admin.nav.categories', language), icon: 'ListUl' },
    { href: '/admin/announcements', label: serverT('admin.nav.announcements', language), icon: 'News' },
    { href: '/admin/wiki', label: serverT('admin.nav.wiki', language), icon: 'BookOpen' },
    { href: '/admin/peerban', label: serverT('admin.nav.peerban', language), icon: 'Shield' },
    { href: '/admin/settings', label: serverT('admin.nav.settings', language), icon: 'Cog' },
    { href: '/admin/requests', label: serverT('admin.nav.requests', language), icon: 'HelpCircle' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="h-16 bg-surface border-b border-border fixed top-0 left-0 right-0 z-30" />}> 
        <AdminHeader language={language} />
      </Suspense>
      <Suspense fallback={<div className="w-64 bg-surface border-r border-border h-screen fixed left-0 top-16 z-20" />}> 
        <AdminSidebar items={items} />
      </Suspense>
      <main className="flex-1 ml-64 pt-20 p-6">
        {children}
      </main>
    </div>
  );
}



import { Suspense } from 'react';
import { serverT } from '@/app/lib/server-i18n';
import Image from 'next/image';
import AdminUserMenu from './AdminUserMenu.client';

export default function AdminHeader({ brandingName = 'Obsidian Tracker', language = 'es' }: { brandingName?: string; language?: string }) {
  return (
    <header className="bg-surface border-b border-border h-16 fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center">
          <Image src="/logo.png" alt="Obsidian logo" width={32} height={32} priority className="mr-2" />
          <h1 className="text-xl font-bold text-primary">{brandingName}</h1>
          <span className="ml-3 px-2 py-0.5 text-xs rounded bg-primary/10 text-primary border border-primary/30">Admin</span>
        </div>
        <div className="flex items-center space-x-4">
          <AdminUserMenu translations={{
            backToSite: serverT('admin.backToSite', language),
            profile: serverT('header.userMenu.profile', language),
            logout: serverT('header.userMenu.logout', language),
          }} />
        </div>
      </div>
    </header>
  );
}



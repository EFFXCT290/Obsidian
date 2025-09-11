import { Suspense } from 'react';
import Image from 'next/image';
import { serverT } from '@/app/lib/server-i18n';
import UserStatsBar from './UserStatsBar';
import UploadButton from './UploadButton';
import DashboardUserMenu from './DashboardUserMenu';
import MobileMenuButton from './MobileMenuButton';

interface DashboardHeaderProps {
  brandingName?: string;
  language?: string;
}

export default function DashboardHeader({ brandingName = 'Obsidian Tracker', language = 'es' }: DashboardHeaderProps) {
  const translations = {
    searchPlaceholder: serverT('header.search.placeholder', language),
    upload: serverT('header.upload', language),
  };

  return (
    <header className="bg-surface border-b border-border h-16 fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <MobileMenuButton className="lg:hidden mr-2" />
          
          {/* Logo and branding - visible on desktop */}
          <div className="hidden lg:flex items-center space-x-3">
            <Image 
              src="/logo.png" 
              alt="Obsidian logo" 
              width={32} 
              height={32} 
              priority 
              className="flex-shrink-0"
            />
            <h1 className="text-lg font-bold text-primary leading-tight">
              {brandingName}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Suspense fallback={<div className="flex w-24 sm:w-32 h-3 bg-text-secondary/10 rounded animate-pulse" /> }>
            <UserStatsBar />
          </Suspense>

          <form className="hidden md:block" action="/search" method="GET">
            <input
              type="text"
              name="q"
              placeholder={translations.searchPlaceholder}
              className="w-48 lg:w-64 px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </form>

          <Suspense fallback={<div className="hidden md:flex w-24 h-8 bg-text-secondary/10 rounded animate-pulse" /> }>
            <UploadButton uploadText={translations.upload} />
          </Suspense>

          <Suspense fallback={
            <div className="flex items-center space-x-2 px-3 py-2">
              <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
              <div className="hidden md:block w-24 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
              <div className="w-4 h-4 bg-text-secondary/10 rounded animate-pulse"></div>
            </div>
          }>
            <DashboardUserMenu translations={{
              profile: serverT('header.userMenu.profile', language),
              adminPanel: serverT('header.userMenu.adminPanel', language),
              moderatorPanel: serverT('header.userMenu.moderatorPanel', language),
              logout: serverT('header.userMenu.logout', language)
            }} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}



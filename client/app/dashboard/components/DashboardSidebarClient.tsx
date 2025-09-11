'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/app/hooks/useI18n';
import { useMobileSidebar } from '../context/MobileSidebarContext';
import SidebarHeader from './SidebarHeader';
import { LanguageSelector } from '@/app/components/LanguageSelector';
import MobileLanguageSelector from './MobileLanguageSelector';
import { Home } from '@styled-icons/boxicons-regular/Home';
import { HelpCircle } from '@styled-icons/boxicons-regular/HelpCircle';
import { News } from '@styled-icons/boxicons-regular/News';
import { Rss } from '@styled-icons/boxicons-regular/Rss';
import { Bookmark } from '@styled-icons/boxicons-regular/Bookmark';
import { ListUl } from '@styled-icons/boxicons-regular/ListUl';
import { BookOpen } from '@styled-icons/boxicons-regular/BookOpen';

const iconMap = { Home, HelpCircle, News, Rss, Bookmark, ListUl, BookOpen };

interface ServerNavItem { href: string; label: string; icon: string }
export default function DashboardSidebarClient({ serverNavItems, brandingName, currentLanguage }: { serverNavItems?: ServerNavItem[]; brandingName?: string; currentLanguage?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { closeSidebar } = useMobileSidebar();

  const navItems = serverNavItems || [
    { href: '/dashboard', label: t('sidebar.nav.home'), icon: 'Home' },
    { href: '/categories', label: t('sidebar.nav.categories'), icon: 'ListUl' },
    { href: '/requests', label: t('sidebar.nav.requests'), icon: 'HelpCircle' },
    { href: '/announcements', label: t('sidebar.nav.announcements'), icon: 'News' },
    { href: '/wiki', label: t('sidebar.nav.wiki'), icon: 'BookOpen' },
    { href: '/rss', label: t('sidebar.nav.rss'), icon: 'Rss' },
    { href: '/bookmarks', label: t('sidebar.nav.bookmarks'), icon: 'Bookmark' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      {brandingName && <SidebarHeader brandingName={brandingName} />}
      
      {/* Navigation - Scrollable if needed */}
      <nav className="flex-1 p-4 overflow-y-auto min-h-0">
        <ul className="space-y-2">
          {navItems.map(item => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                    pathname === item.href ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-text hover:bg-surface-light'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Language Selector - Fixed at bottom */}
      <div className="flex-shrink-0 p-3 bg-surface relative">
        {/* Desktop Language Selector */}
        <div className="hidden lg:block">
          <LanguageSelector currentLanguage={currentLanguage} />
        </div>
        
        {/* Mobile Language Selector */}
        <div className="lg:hidden border-t border-border">
          <MobileLanguageSelector currentLanguage={currentLanguage} />
        </div>
      </div>
    </div>
  );
}



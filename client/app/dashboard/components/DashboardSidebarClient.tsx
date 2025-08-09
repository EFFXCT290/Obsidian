'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/app/hooks/useI18n';
import { Home } from '@styled-icons/boxicons-regular/Home';
import { HelpCircle } from '@styled-icons/boxicons-regular/HelpCircle';
import { News } from '@styled-icons/boxicons-regular/News';
import { Rss } from '@styled-icons/boxicons-regular/Rss';
import { Bookmark } from '@styled-icons/boxicons-regular/Bookmark';
import { ListUl } from '@styled-icons/boxicons-regular/ListUl';
import { BookOpen } from '@styled-icons/boxicons-regular/BookOpen';

const iconMap = { Home, HelpCircle, News, Rss, Bookmark, ListUl, BookOpen };

interface ServerNavItem { href: string; label: string; icon: string }
export default function DashboardSidebarClient({ serverNavItems }: { serverNavItems?: ServerNavItem[] }) {
  const pathname = usePathname();
  const { t } = useI18n();

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
    <nav className="p-4">
      <ul className="space-y-2">
        {navItems.map(item => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
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
  );
}



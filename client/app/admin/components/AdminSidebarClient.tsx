'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// import { useI18n } from '@/app/hooks/useI18n';
import { Home } from '@styled-icons/boxicons-regular/Home';
import { Group } from '@styled-icons/boxicons-regular/Group';
import { Cog } from '@styled-icons/boxicons-regular/Cog';
import { ListUl } from '@styled-icons/boxicons-regular/ListUl';
import { News } from '@styled-icons/boxicons-regular/News';
import { BookOpen } from '@styled-icons/boxicons-regular/BookOpen';
import { Shield } from '@styled-icons/boxicons-regular/Shield';
import { HelpCircle } from '@styled-icons/boxicons-regular/HelpCircle';
import { CheckShield } from '@styled-icons/boxicons-regular/CheckShield';
import { Folder } from '@styled-icons/boxicons-regular/Folder';
import { Rss } from '@styled-icons/boxicons-regular/Rss';
import { Award } from '@styled-icons/boxicons-regular/Award';

const iconMap = { Home, Group, Cog, ListUl, News, BookOpen, Shield, HelpCircle, CheckShield, Folder, Rss, Award } as const;

export interface AdminNavItem { href: string; label: string; icon: keyof typeof iconMap }

export default function AdminSidebarClient({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  // const { t } = useI18n();

  return (
    <nav className="p-4">
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  active ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-text hover:bg-surface-light'
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



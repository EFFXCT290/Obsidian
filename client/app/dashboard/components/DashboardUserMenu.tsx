'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { User } from '@styled-icons/boxicons-regular/User';
import { Lock } from '@styled-icons/boxicons-regular/Lock';
import { LogOutCircle } from '@styled-icons/boxicons-regular/LogOutCircle';

import { API_BASE_URL } from '@/lib/api';

interface DashboardUserMenuProps {
  translations: {
    profile: string;
    adminPanel: string;
    moderatorPanel: string;
    logout: string;
  };
}

interface CurrentUserResponse {
  id: string;
  email: string;
  username: string;
  role?: string;
  avatarUrl?: string;
  avatarFileId?: string;
}

export default function DashboardUserMenu({ translations }: DashboardUserMenuProps) {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState<boolean>(true);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers: Record<string, string> = {};
        try {
          const token = localStorage.getItem('authToken');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch {}
        const res = await fetch(`${API_BASE_URL}/auth/profile`, { headers, cache: 'no-store' });
        const data: CurrentUserResponse = await res.json();
        if (!cancelled) setUser(data || null);
      } catch {
        if (!cancelled) setUser(null);
      }
      if (!cancelled) setIsFetchingUser(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Loading skeleton to avoid content popping (matches original style)
  if (isFetchingUser) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
        <div className="hidden md:block w-24 h-4 bg-text-secondary/10 rounded animate-pulse" />
        <div className="w-4 h-4 bg-text-secondary/10 rounded animate-pulse" />
      </div>
    );
  }

  // Try to read from localStorage if API hasn't returned yet
  let localUserName: string | undefined;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (raw) {
      const parsed = JSON.parse(raw) as { username?: string; email?: string };
      localUserName = parsed.username || parsed.email;
    }
  } catch {}
  const displayName = user?.username || user?.email || localUserName || 'User';
  const role = user?.role;

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } catch {}
    window.location.href = '/auth/signin';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-surface-light transition-colors"
      >
        {user?.avatarUrl ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <img src={`${API_BASE_URL}${user.avatarUrl}`} alt="User avatar" className="w-full h-full object-cover" />
          </div>
        ) : (
          <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden md:block text-text font-medium">{displayName}</span>
        <ChevronDown size={18} className="text-text-secondary" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50">
          <Link
            href="/profile"
            className="block px-4 py-3 text-text hover:bg-surface-light transition-colors"
            onClick={() => setOpen(false)}
          >
            <User size={18} className="mr-2 inline" /> {translations.profile}
          </Link>
          {(role === 'ADMIN' || role === 'OWNER' || role === 'FOUNDER') && (
            <Link
              href="/admin/dashboard"
              className="block px-4 py-3 text-text hover:bg-surface-light transition-colors"
              onClick={() => setOpen(false)}
            >
              <Lock size={18} className="mr-2 inline" /> {translations.adminPanel}
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-text hover:bg-surface-light transition-colors"
          >
            <LogOutCircle size={18} className="mr-2 inline" /> {translations.logout}
          </button>
        </div>
      )}
    </div>
  );
}



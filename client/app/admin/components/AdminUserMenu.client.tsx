"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { ArrowBack } from '@styled-icons/boxicons-regular/ArrowBack';
import { User as UserIcon } from '@styled-icons/boxicons-regular/User';
import { LogOutCircle } from '@styled-icons/boxicons-regular/LogOutCircle';
import { useCurrentUserAvatar } from '@/app/hooks/useAvatar';

interface AdminUserMenuProps {
  translations: {
    backToSite: string;
    profile: string;
    logout: string;
  };
}

type CurrentUser = {
  id: string;
  email?: string | null;
  username?: string | null;
  role?: string | null;
};

type CurrentUserResponse = { user?: CurrentUser | null };

export default function AdminUserMenu({ translations }: AdminUserMenuProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const { avatarUrl, isLoading: avatarLoading } = useCurrentUserAvatar();
  const [mounted, setMounted] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  // Cargar usuario actual desde el proxy del cliente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsFetchingUser(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/user/current', { headers, cache: 'no-store' });
        const data: CurrentUserResponse = await res.json();
        if (!cancelled) setUser(data.user || null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsFetchingUser(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Asegurar coincidencia con SSR: mostrar skeleton hasta montar en cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isFetchingUser) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
        <div className="hidden md:block w-24 h-4 bg-text-secondary/10 rounded animate-pulse" />
        <div className="w-4 h-4 bg-text-secondary/10 rounded animate-pulse" />
      </div>
    );
  }

  const displayName = user?.username || user?.email || 'Admin';

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } catch {}
    window.location.href = '/auth/signin';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-surface-light transition-colors">
        {avatarUrl ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src={avatarUrl} alt="User avatar" fill className="object-cover" />
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
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg z-50">
          <Link href="/dashboard" className="block px-4 py-3 text-text hover:bg-surface-light transition-colors border-b border-border" onClick={() => setOpen(false)}>
            <ArrowBack size={18} className="mr-2 inline" /> {translations.backToSite}
          </Link>
          <Link href="/profile" className="block px-4 py-3 text-text hover:bg-surface-light transition-colors" onClick={() => setOpen(false)}>
            <UserIcon size={18} className="mr-2 inline" /> {translations.profile}
          </Link>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-text hover:bg-surface-light transition-colors">
            <LogOutCircle size={18} className="mr-2 inline" /> {translations.logout}
          </button>
        </div>
      )}
    </div>
  );
}



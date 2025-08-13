'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { User } from '@styled-icons/boxicons-regular/User';
import { API_BASE_URL } from '@/lib/api';

interface Props {
  user?: { id: string; username: string; uploaded?: string; downloaded?: string; ratio?: number; avatarUrl?: string | null };
  loading?: boolean;
}

export default function UploaderInfo({ user, loading = false }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const avatarSrc = useMemo(() => {
    const raw = user?.avatarUrl || '';
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }, [user?.avatarUrl]);

  const formatBytes = (val?: string) => {
    const num = Number(val || '0');
    const sizes = ['B','KB','MB','GB','TB'];
    if (!num) return '0 B';
    const i = Math.floor(Math.log(num) / Math.log(1024));
    return `${(num / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4 flex items-center"><User size={20} className="mr-2" />Subido por</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden" suppressHydrationWarning>
            {loading ? (
              <div className="w-full h-full bg-primary/10" />
            ) : mounted && avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt="avatar"
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center"><User size={20} className="text-primary" /></div>
            )}
          </div>
          <div>
            {loading ? (
              <>
                <div className="w-24 h-4 bg-text-secondary/10 rounded animate-pulse mb-1"></div>
                <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <p className="text-text font-medium">{user?.username || 'Usuario'}</p>
                <p className="text-text-secondary text-sm">Ratio: {(user?.ratio ?? 0).toFixed(2)}</p>
              </>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Subido</span>
            {loading ? <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div> : <span className="text-text">{formatBytes(user?.uploaded)}</span>}
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Descargado</span>
            {loading ? <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div> : <span className="text-text">{formatBytes(user?.downloaded)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}



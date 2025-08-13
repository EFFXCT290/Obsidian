'use client';

import { useEffect, useState } from 'react';
import { User } from '@styled-icons/boxicons-regular/User';
import Image from 'next/image';
import { API_BASE_URL } from '@/lib/api';
import { useI18n } from '@/app/hooks/useI18n';

interface Props {
  uploader: { id: string; username: string; avatarUrl?: string | null; uploaded?: string; downloaded?: string; ratio?: number } | null;
  loading: boolean;
}

export default function UploaderPanel({ uploader, loading }: Props) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const formatBytes = (n?: string) => {
    const v = Number(n || 0);
    if (!v) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let val = v;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(2)} ${units[i]}`;
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
        <User size={20} className="mr-2" />
        {t('torrentDetail.uploader.title','Subido por')}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          {loading || !mounted ? (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
          ) : uploader?.avatarUrl ? (
            <Image
              src={uploader.avatarUrl?.startsWith('http') ? uploader.avatarUrl : `${API_BASE_URL}${uploader.avatarUrl}`}
              alt="Avatar"
              width={40}
              height={40}
              unoptimized
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
          )}
          <div>
            {loading || !mounted ? (
              <>
                <div className="w-24 h-4 bg-text-secondary/10 rounded animate-pulse mb-1"></div>
                <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <p className="text-text font-medium" suppressHydrationWarning>{uploader?.username || t('torrentDetail.uploader.anonymous','Anónimo')}</p>
                {uploader?.ratio !== undefined && (
                  <p className="text-text-secondary text-sm" suppressHydrationWarning>{t('torrentDetail.uploader.ratio','Ratio')}: {Number(uploader.ratio || 0).toFixed(2)}</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('torrentDetail.uploader.uploaded','Subido')}</span>
              {loading || !mounted || !uploader ? (
                <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              ) : (
                <span className="text-text" suppressHydrationWarning>{formatBytes(uploader.uploaded)}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t('torrentDetail.uploader.downloaded','Descargado')}</span>
              {loading || !mounted || !uploader ? (
                <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              ) : (
                <span className="text-text" suppressHydrationWarning>{formatBytes(uploader.downloaded)}</span>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}



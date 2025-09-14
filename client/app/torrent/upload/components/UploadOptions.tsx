"use client";

import React from 'react';
import { useI18n } from '@/app/hooks/useI18n';

interface Props {
  anonymous: boolean;
  freeleech: boolean;
  isVip: boolean;
  onAnonymousChange: (val: boolean) => void;
  onFreeleechChange: (val: boolean) => void;
  onVipChange: (val: boolean) => void;
  loading?: boolean;
  userIsVip?: boolean;
  userRole?: string;
}

export default function UploadOptions({ anonymous, freeleech, isVip, onAnonymousChange, onFreeleechChange, onVipChange, loading = false, userIsVip = false, userRole }: Props) {
  const { t } = useI18n();
  
  // Determine if user can see VIP option (VIP users or admins)
  const canSeeVipOption = userIsVip || (userRole && ['ADMIN', 'OWNER', 'FOUNDER'].includes(userRole));
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="h-16 bg-text-secondary/10 rounded animate-pulse" />
        <div className="h-16 bg-text-secondary/10 rounded animate-pulse" />
        <div className="h-16 bg-text-secondary/10 rounded animate-pulse" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-surface border border-border rounded-lg p-4">
      <label className="flex items-start space-x-3 cursor-pointer select-none">
        <input type="checkbox" className="mt-1" checked={anonymous} onChange={(e) => onAnonymousChange(e.target.checked)} />
        <span>
          <span className="block text-text font-medium">{t('upload.options.anonymous.label', 'Subida anónima')}</span>
          <span className="block text-sm text-text-secondary">{t('upload.options.anonymous.desc', 'Oculta tu nombre de usuario como uploader')}</span>
        </span>
      </label>
      <label className="flex items-start space-x-3 cursor-pointer select-none">
        <input type="checkbox" className="mt-1" checked={freeleech} onChange={(e) => onFreeleechChange(e.target.checked)} />
        <span>
          <span className="block text-text font-medium">{t('upload.options.freeleech.label', 'Freeleech')}</span>
          <span className="block text-sm text-text-secondary">{t('upload.options.freeleech.desc', 'No cuenta tráfico de descarga')}</span>
        </span>
      </label>
      {canSeeVipOption && (
        <label className="flex items-start space-x-3 cursor-pointer select-none">
          <input type="checkbox" className="mt-1" checked={isVip} onChange={(e) => onVipChange(e.target.checked)} />
          <span>
            <span className="block text-text font-medium">{t('upload.options.vipTorrent.label', 'Torrent VIP')}</span>
            <span className="block text-sm text-text-secondary">{t('upload.options.vipTorrent.desc', 'Solo usuarios VIP pueden descargar')}</span>
          </span>
        </label>
      )}
    </div>
  );
}



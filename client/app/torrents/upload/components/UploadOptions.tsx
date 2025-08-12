'use client';

import React from 'react';
import { useI18n } from '@/app/hooks/useI18n';

interface Props {
  anonymous: boolean;
  freeleech: boolean;
  onAnonymousChange: (v: boolean) => void;
  onFreeleechChange: (v: boolean) => void;
  loading?: boolean;
}

export default function UploadOptions({ anonymous, freeleech, onAnonymousChange, onFreeleechChange, loading = false }: Props) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-text-secondary/10 rounded animate-pulse" />
          <div className="w-32 h-5 bg-text-secondary/10 rounded animate-pulse" />
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-text-secondary/10 rounded animate-pulse" />
          <div className="w-32 h-5 bg-text-secondary/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center space-x-3">
        <input type="checkbox" checked={anonymous} onChange={(e) => onAnonymousChange(e.target.checked)} />
        <span className="text-text">{t('upload.options.anonymous', 'Subir como anónimo')}</span>
      </label>
      <label className="flex items-center space-x-3">
        <input type="checkbox" checked={freeleech} onChange={(e) => onFreeleechChange(e.target.checked)} />
        <span className="text-text">{t('upload.options.freeleech', 'Marcar como freeleech')}</span>
      </label>
    </div>
  );
}



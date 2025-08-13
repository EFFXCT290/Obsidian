"use client";

import React from 'react';
import { useI18n } from '@/app/hooks/useI18n';

interface Props { loading?: boolean }

export default function UploadTips({ loading = false }: Props) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="mt-8">
        <div className="w-32 h-5 bg-text-secondary/10 rounded animate-pulse mb-2"></div>
        <div className="w-full h-20 bg-text-secondary/10 rounded animate-pulse"></div>
      </div>
    );
  }
  return (
    <div className="mt-8 bg-surface border border-border rounded-lg p-4 text-sm text-text-secondary">
      <p className="mb-2 font-medium text-text">{t('upload.tips.title', 'Consejos')}</p>
      <ul className="list-disc list-inside space-y-1">
        <li>{t('upload.tips.items.0', 'Asegúrate de que el archivo .torrent es válido y corresponde al contenido.')}</li>
        <li>{t('upload.tips.items.1', 'Proporciona una descripción clara y concisa.')}</li>
        <li>{t('upload.tips.items.2', 'Elige la categoría y el source más adecuados.')}</li>
        <li>{t('upload.tips.items.3', 'Usa etiquetas relevantes para mejorar el descubrimiento.')}</li>
      </ul>
    </div>
  );
}



'use client';

import React from 'react';
import { useI18n } from '@/app/hooks/useI18n';

export default function UploadTips({ loading = false }: { loading?: boolean }) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="mt-8">
        <div className="w-48 h-6 bg-text-secondary/10 rounded animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full h-4 bg-text-secondary/10 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-text mb-2">{t('upload.tips.title', 'Consejos')}</h2>
      <ul className="list-disc list-inside text-text-secondary space-y-1">
        <li>{t('upload.tips.items.0', 'Asegúrate de que el archivo .torrent es válido y corresponde al contenido.')}</li>
        <li>{t('upload.tips.items.1', 'Proporciona una descripción clara y concisa.')}</li>
        <li>{t('upload.tips.items.2', 'Elige la categoría y el source más adecuados.')}</li>
        <li>{t('upload.tips.items.3', 'Usa etiquetas relevantes para mejorar el descubrimiento.')}</li>
      </ul>
    </div>
  );
}



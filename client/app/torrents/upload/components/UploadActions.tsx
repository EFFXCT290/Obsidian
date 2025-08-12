'use client';

import React from 'react';
import { useI18n } from '@/app/hooks/useI18n';

interface Props {
  isValid: boolean;
  hasFile: boolean;
  isUploading: boolean;
  disabledReasons?: string[];
  notes?: string[];
  loading?: boolean;
}

export default function UploadActions({ isValid, hasFile, isUploading, disabledReasons = [], notes = [], loading = false }: Props) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="flex space-x-4">
        <div className="w-24 h-10 bg-text-secondary/10 rounded animate-pulse"></div>
        <div className="w-32 h-10 bg-text-secondary/10 rounded animate-pulse"></div>
      </div>
    );
  }
  const disabled = !isValid || !hasFile || isUploading;
  return (
    <div className="space-y-3">
      {disabled && !isUploading && (disabledReasons.length > 0 || notes.length > 0) && (
        <div className="bg-surface rounded-lg border border-border p-3 text-sm text-text-secondary space-y-2">
          {disabledReasons.length > 0 && (
            <div>
              <p className="mb-1 text-text">{t('upload.actions.panelTitle', 'Para habilitar el botón de subida, completa:')}</p>
              <ul className="list-disc list-inside space-y-1">
                {disabledReasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {notes.length > 0 && (
            <div className="text-xs text-text-secondary">
              {notes.map((n) => (
                <p key={n}>• {n}</p>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex space-x-4">
        <button type="submit" disabled={disabled} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50">
          {isUploading ? t('upload.actions.uploading', 'Subiendo…') : t('upload.actions.upload', 'Subir')}
        </button>
        <button type="reset" className="px-4 py-2 border border-border text-text rounded-md hover:bg-surface-light">{t('upload.actions.reset', 'Restablecer')}</button>
      </div>
    </div>
  );
}



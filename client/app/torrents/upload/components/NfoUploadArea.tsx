'use client';

import React from 'react';
import { Upload } from '@styled-icons/boxicons-regular/Upload';
import { File } from '@styled-icons/boxicons-regular/File';
import { X } from '@styled-icons/boxicons-regular/X';
import { useI18n } from '@/app/hooks/useI18n';

interface Props {
  uploadedNfo: File | null;
  onNfoSelect: (file: File) => void;
  onNfoRemove: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  loading?: boolean;
}

export default function NfoUploadArea({ uploadedNfo, onNfoSelect, onNfoRemove, onDragOver, onDragLeave, onDrop, isDragOver, loading = false }: Props) {
  const { t } = useI18n();
  if (loading) {
    return (
      <div className="bg-surface rounded-lg border-2 border-dashed border-border p-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-text-secondary/10 rounded-lg animate-pulse"></div>
        <div className="w-48 h-4 bg-text-secondary/10 rounded animate-pulse mx-auto mb-2"></div>
        <div className="w-32 h-4 bg-text-secondary/10 rounded animate-pulse mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg border-2 border-dashed border-border p-8">
      <div
        className={`text-center transition-colors ${isDragOver ? 'border-primary bg-primary/5' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {!uploadedNfo ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-background border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <File size={24} className="text-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-text mb-2">{t('upload.areas.nfo.title', 'Adjuntar NFO (opcional)')}</h3>
            <p className="text-text-secondary mb-4">{t('upload.areas.nfo.subtitle', 'Solo archivos .nfo')}</p>
            <label className="inline-block px-6 py-3 bg-primary text-background rounded-lg hover:bg-primary-dark transition-colors cursor-pointer">
              {t('upload.areas.nfo.select', 'Seleccionar NFO')}
              <input
                type="file"
                accept=".nfo"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onNfoSelect(file);
                }}
              />
            </label>
          </>
        ) : (
          <div className="flex items-center justify-center space-x-4">
            <File size={48} className="text-green-500" />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-text">{uploadedNfo.name}</h3>
              <p className="text-text-secondary">{(uploadedNfo.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={onNfoRemove} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label={t('upload.areas.nfo.remove', 'Quitar NFO')}>
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



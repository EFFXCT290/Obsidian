"use client";

import React from 'react';
import { useI18n } from '@/app/hooks/useI18n';
import { Upload } from '@styled-icons/boxicons-regular/Upload';

interface Props {
  uploadedFile: File | null;
  isDragOver: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  loading?: boolean;
}

export default function TorrentUploadArea({ uploadedFile, isDragOver, onFileSelect, onFileRemove, onDragOver, onDragLeave, onDrop, loading = false }: Props) {
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
    <div
      className={`bg-surface rounded-lg border-2 border-dashed p-6 transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border'}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="text-center">
        <Upload size={36} className="mx-auto text-text-secondary mb-3" />
        {!uploadedFile ? (
          <>
            <p className="text-text mb-2">{t('upload.areas.torrent.title', 'Archivo .torrent')}</p>
            <p className="text-text-secondary text-sm mb-4">{t('upload.areas.torrent.subtitle', 'Arrastra y suelta o selecciona el archivo')}</p>
            <label className="inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 cursor-pointer">
              {t('upload.areas.torrent.select', 'Seleccionar .torrent')}
              <input
                type="file"
                accept=".torrent"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelect(file);
                }}
              />
            </label>
          </>
        ) : (
          <div className="flex items-center justify-between bg-surface-light border border-border rounded-md px-3 py-2">
            <div className="text-sm text-text truncate">{uploadedFile.name}</div>
            <button type="button" onClick={onFileRemove} className="text-red-500 hover:text-red-600 text-sm">Remove</button>
          </div>
        )}
      </div>
    </div>
  );
}



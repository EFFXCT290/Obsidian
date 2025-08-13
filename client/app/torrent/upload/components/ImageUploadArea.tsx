"use client";

import React, { useRef } from 'react';
import { X } from '@styled-icons/boxicons-regular/X';
import { Image as ImageIcon } from '@styled-icons/boxicons-regular/Image';
import { useI18n } from '@/app/hooks/useI18n';

interface Props {
  uploadedImage: File | null;
  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  loading?: boolean;
}

export default function ImageUploadArea({ uploadedImage, imagePreview, onImageSelect, onImageRemove, onDragOver, onDragLeave, onDrop, isDragOver, loading = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
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
        className={`text-center transition-colors ${isDragOver ? 'bg-primary/5' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {!uploadedImage ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-background border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <ImageIcon size={24} className="text-text-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-text mb-2">{t('upload.areas.image.title', 'Imagen de póster (opcional)')}</h3>
            <p className="text-text-secondary mb-4">{t('upload.areas.image.subtitle', 'JPG, PNG, GIF, WEBP')}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-6 py-3 bg-primary text-background rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t('upload.areas.image.select', 'Seleccionar imagen')}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageSelect(file);
              }}
            />
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow-lg" />
            )}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text">{uploadedImage.name}</h3>
              <p className="text-text-secondary">{(uploadedImage.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={onImageRemove} className="p-2 text-text-secondary hover:text-text transition-colors" aria-label={t('upload.areas.image.remove', 'Quitar imagen')}>
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



"use client";

import React from 'react';

interface Props { loading?: boolean }

export default function UploadTips({ loading = false }: Props) {
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
      <p className="mb-2 font-medium text-text">Consejos de subida</p>
      <ul className="list-disc list-inside space-y-1">
        <li>Incluye una descripción clara y las etiquetas adecuadas.</li>
        <li>La imagen del póster es opcional, pero recomendable.</li>
        <li>El archivo .torrent debe ser privado y contener tu passkey.</li>
      </ul>
    </div>
  );
}



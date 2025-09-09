'use client';

import React, { useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  categoryId: string;
  categoryName: string;
  targetParentId: string | null;
  inheritedPreview?: string[]; // names from target
  ownPreview?: string[];       // names from current
  onClose: () => void;
  onMoved: () => void;
}

export default function MoveCategorySourcesDialog({ open, categoryId, categoryName, targetParentId, inheritedPreview = [], ownPreview = [], onClose, onMoved }: Props) {
  const [keepOwn, setKeepOwn] = useState(true);
  const [inheritNew, setInheritNew] = useState(true);
  const [removingOwn, setRemovingOwn] = useState(false);

  const headers = useMemo(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, []);

  if (!open) return null;

  const confirm = async () => {
    let sourcesOption: 'keep_and_inherit' | 'inherit_only' | 'keep_only' = 'keep_and_inherit';
    if (removingOwn && inheritNew) sourcesOption = 'inherit_only';
    if (keepOwn && !inheritNew) sourcesOption = 'keep_only';
    try {
      const res = await fetch(`${API_BASE_URL}/admin/category/move`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ categoryId, newParentId: targetParentId, newOrder: 0, forceReorder: true, sourcesOption })
      });
      if (!res.ok) throw new Error('No se pudo mover la categoría');
      toast.success('Categoría movida');
      onMoved();
      onClose();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Error moviendo categoría';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border text-text rounded-lg shadow-xl w-full max-w-lg p-5">
        <h3 className="text-base font-semibold text-text">Mover &quot;{categoryName}&quot;</h3>
        <div className="mt-3 space-y-3">
          <div className="text-sm text-text-secondary">Gestión de sources al mover:</div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={keepOwn} onChange={(e) => { setKeepOwn(e.target.checked); setRemovingOwn(!e.target.checked && inheritNew); }} />
            Mantener sources propios {ownPreview.length > 0 && <span className="text-text-secondary">({ownPreview.join(', ')})</span>}
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={inheritNew} onChange={(e) => { setInheritNew(e.target.checked); setRemovingOwn(!keepOwn && e.target.checked); }} />
            Heredar del nuevo padre {inheritedPreview.length > 0 && <span className="text-text-secondary">({inheritedPreview.join(', ')})</span>}
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={removingOwn} disabled={keepOwn && inheritNew} onChange={(e) => setRemovingOwn(e.target.checked)} />
            Eliminar sources propios
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border border-border text-text rounded-md hover:bg-surface-light">Cancelar</button>
          <button onClick={confirm} className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90">Confirmar</button>
        </div>
      </div>
    </div>
  );
}



'use client';

import React, { useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface CategoryLite {
  id: string;
  name: string;
  children?: { id: string }[];
}

interface Props {
  open: boolean;
  category: CategoryLite | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function ConfirmDeleteCategoryModal({ open, category, onClose, onDeleted }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const hasChildren = !!(category && category.children && category.children.length > 0);

  const headers = useMemo(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, []);

  if (!open || !category) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/category/${category.id}`, {
        method: 'DELETE',
        headers,
        // Solo hay dos niveles: si es categoría (tiene subcategorías), cascada = true; si es subcategoría, no es necesario
        body: JSON.stringify({ cascade: hasChildren })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err && err.requiresCascade) {
          toast.error('Esta categoría tiene subcategorías. Confirma la eliminación para borrar también sus subcategorías.');
        } else {
          toast.error(err.error || 'Error eliminando la categoría');
        }
        return;
      }

      toast.success('Categoría eliminada');
      onDeleted();
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Error eliminando la categoría');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border text-text rounded-lg shadow-xl w-full max-w-lg p-5">
        <h3 className="text-base font-semibold">Eliminar "{category.name}"</h3>
        <div className="mt-3 space-y-3">
          {hasChildren ? (
            <p className="text-sm text-text-secondary">
              Esta categoría tiene {category.children?.length || 0} subcategorías. Al confirmar, se eliminarán esta categoría, sus subcategorías y los sources asociados.
            </p>
          ) : (
            <p className="text-sm text-text-secondary">
              Vas a eliminar esta subcategoría. Se eliminarán también sus sources asociados.
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border border-border text-text rounded-md hover:bg-surface-light" disabled={submitting}>Cancelar</button>
          <button onClick={handleConfirm} className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60" disabled={submitting}>
            {submitting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}



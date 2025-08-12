'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';
import Sortable from 'sortablejs';

interface SourceItem {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
}

interface Props {
  categoryId: string;
  categoryName: string;
  open: boolean;
  onClose: () => void;
}

export default function SourcesManagementModal({ categoryId, categoryName, open, onClose }: Props) {
  const [ownSources, setOwnSources] = useState<SourceItem[]>([]);
  const [inheritedSources, setInheritedSources] = useState<SourceItem[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [loading, setLoading] = useState(false);
  const ownContainerRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  const headers = useMemo(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, []);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/admin/category/${categoryId}/sources`, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load sources');
        const data = await res.json();
        setOwnSources(data.own || []);
        setInheritedSources(data.inherited || []);
      } catch (e) {
        console.error(e);
        toast.error('Error al cargar los sources');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, categoryId, headers]);

  // Initialize Sortable for own sources
  useEffect(() => {
    if (!open) return;
    if (!ownContainerRef.current) return;
    if (sortableRef.current) {
      try { sortableRef.current.destroy(); } catch {}
      sortableRef.current = null;
    }
    sortableRef.current = new Sortable(ownContainerRef.current, {
      group: { name: 'ownSources', put: false, pull: false },
      animation: 150,
      handle: '.drag-handle',
      onEnd: async () => {
        try {
          const orderedSourceIds = Array.from(ownContainerRef.current!.querySelectorAll('[data-id]')).map((el) => (el as HTMLElement).dataset.id!).filter(Boolean);
          const res = await fetch(`${API_BASE_URL}/admin/category/${categoryId}/sources/reorder`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ orderedSourceIds })
          });
          if (!res.ok) throw new Error('No se pudo reordenar');
          toast.success('Reordenado');
        } catch (e: any) {
          toast.error(e.message || 'Error reordenando');
        }
      }
    });
    return () => {
      try { sortableRef.current?.destroy(); } catch {}
      sortableRef.current = null;
    };
  }, [open, ownSources]);

  const addSource = async () => {
    if (!newSourceName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/category/${categoryId}/sources`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newSourceName.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo agregar el source');
      }
      setNewSourceName('');
      toast.success('Source agregado');
      // reload
      const reload = await fetch(`${API_BASE_URL}/admin/category/${categoryId}/sources`, { headers, cache: 'no-store' });
      const data = await reload.json();
      setOwnSources(data.own || []);
      setInheritedSources(data.inherited || []);
    } catch (e: any) {
      toast.error(e.message || 'Error agregando source');
    }
  };

  const removeSource = async (sourceId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/category/${categoryId}/sources/${sourceId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('No se pudo eliminar');
      toast.success('Source eliminado');
      const reload = await fetch(`${API_BASE_URL}/admin/category/${categoryId}/sources`, { headers, cache: 'no-store' });
      const data = await reload.json();
      setOwnSources(data.own || []);
      setInheritedSources(data.inherited || []);
    } catch (e: any) {
      toast.error(e.message || 'Error eliminando');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border text-text rounded-lg shadow-xl w-full max-w-xl p-5">
        <h2 className="text-lg font-semibold mb-2 text-text">{categoryName} - Sources</h2>
        {loading ? (
          <div className="text-sm text-text-secondary">Cargando...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-text">Heredados</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {inheritedSources.length === 0 && (
                  <span className="text-sm text-text-secondary">Ninguno</span>
                )}
                {inheritedSources.map((s) => (
                  <span key={s.id} className="text-xs px-2 py-1 rounded-full bg-surface-light text-text-secondary border border-border">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-text">Propios (arrastrar para reordenar)</div>
              <div ref={ownContainerRef} className="mt-2 flex flex-wrap gap-2">
                {ownSources.length === 0 && (
                  <span className="text-sm text-text-secondary">Ninguno</span>
                )}
                {ownSources.map((s) => (
                  <span key={s.id} data-id={s.id} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <span className="drag-handle cursor-grab">⋮⋮</span>
                    {s.name}
                    <button className="text-red-500 hover:text-red-600" onClick={() => removeSource(s.id)}>×</button>
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nuevo source (e.g., BluRay)"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                />
                <button onClick={addSource} className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90">Añadir</button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border border-border text-text rounded-md hover:bg-surface-light">Cerrar</button>
        </div>
      </div>
    </div>
  );
}



'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import Image from 'next/image';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { showNotification } from '@/app/utils/notifications';
import { useI18n } from '@/app/hooks/useI18n';
import { InfoCircle, X } from '@styled-icons/boxicons-regular';
import TorrentFiles from './TorrentFiles';
import CommentsSection from './CommentsSection';
import ActionsPanel from './ActionsPanel';
import NfoPanel from './NfoPanel';
import UploaderPanel from './UploaderPanel';

interface TorrentResponse {
  id: string;
  name: string;
  description: string | null;
  infoHash: string;
  size: string | number;
  createdAt: string;
  posterUrl?: string | null;
  seeders?: number;
  leechers?: number;
  completed?: number;
  category?: string;
  tags?: string[];
  files?: { path: string; size: number }[];
  uploader?: { id: string; username: string; avatarUrl?: string | null; uploaded?: string; downloaded?: string; ratio?: number } | null;
  bookmarked?: boolean;
  userVote?: 'up' | 'down' | null;
  isApproved?: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  rejectedBy?: { id: string; username: string };
  rejectedAt?: string;
}

// Legacy comment types removed

// Legacy CommentItem interface removed; replaced by CommentsSection

export default function TorrentDetailContent({ torrentId }: { torrentId: string }) {
  const { t } = useI18n();
  const [, setDownloading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [posterVisible, setPosterVisible] = useState(true);
  const [showRejectionInfoModal, setShowRejectionInfoModal] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  const { data, error, isLoading, mutate } = useSWR<TorrentResponse>(
    torrentId ? `${API_BASE_URL}/torrent/${torrentId}` : null,
    async (key: string) => {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const res = await fetch(key, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch torrent');
      return res.json();
    }
  );

  const sizeHuman = useMemo(() => {
    const num = typeof data?.size === 'string' ? Number(data.size) : (data?.size || 0);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let val = num;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(2)} ${units[i]}`;
  }, [data?.size]);

  // Safely parse various date string/number formats into a valid Date or return null
  const parsePossiblyInvalidDate = (value?: string): Date | null => {
    if (!value) return null;
    // Try ISO first
    try {
      const iso = parseISO(value);
      if (isValid(iso)) return iso;
    } catch {}
    // Try numeric timestamp (seconds or ms)
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && asNumber) {
      const ts = asNumber > 1e12 ? asNumber : asNumber * 1000;
      const d = new Date(ts);
      if (isValid(d)) return d;
    }
    // Fallback to Date parsing
    const fallback = new Date(value);
    return isValid(fallback) ? fallback : null;
  };

  const createdAtFormatted = useMemo(() => {
    if (!hasMounted || !data?.createdAt) return ' ';
    const d = parsePossiblyInvalidDate(data.createdAt);
    return d ? format(d, 'dd/MM/yyyy HH:mm', { locale: es }) : 'Fecha no válida';
  }, [hasMounted, data?.createdAt]);

  const handleDownload = async () => {
    try {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      setDownloading(true);
      // 1) Crear token temporal
      const tokenRes = await fetch(`${API_BASE_URL}/torrent/${torrentId}/download-token`, { method: 'POST', headers });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData?.downloadUrl) throw new Error(tokenData?.error || 'No se pudo generar el enlace');
      // 2) Descargar .torrent usando el token
      const fileRes = await fetch(tokenData.downloadUrl, { headers });
      if (!fileRes.ok) throw new Error('Fallo la descarga');
      const blob = await fileRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.name || 'torrent'}.torrent`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showNotification(t('common.downloadStarted','Descarga iniciada'), 'success');
    } catch {
      showNotification(t('torrentDetail.actions.downloadError','No se pudo descargar el torrent'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleBookmark = async () => {
    try {
      // For POST we send JSON; for DELETE avoid Content-Type to prevent bad JSON parse on empty body
      const baseHeaders: Record<string, string> = {};
      try {
        const token = localStorage.getItem('authToken');
        if (token) baseHeaders['Authorization'] = `Bearer ${token}`;
      } catch {}
      if (!data?.bookmarked) {
        const headers: Record<string, string> = { ...baseHeaders, 'Content-Type': 'application/json' };
        const res = await fetch(`${API_BASE_URL}/bookmarks`, { method: 'POST', headers, body: JSON.stringify({ torrentId }) });
        if (!res.ok) throw new Error('bookmark-failed');
        mutate({ ...(data as TorrentResponse), bookmarked: true }, false);
        showNotification(t('torrentDetail.actions.bookmarkAdded','Marcado como favorito'), 'success');
      } else {
        const res = await fetch(`${API_BASE_URL}/bookmarks/${torrentId}`, { method: 'DELETE', headers: baseHeaders });
         if (!res.ok) throw new Error('bookmark-remove-failed');
        mutate({ ...(data as TorrentResponse), bookmarked: false }, false);
         showNotification(t('torrentDetail.actions.bookmarkRemoved','Eliminado de favoritos'), 'success');
      }
      // Revalidar inmediatamente para persistir estado al recargar
      await mutate();
    } catch {
      showNotification(t('torrentDetail.actions.bookmarkError','Operación de favorito fallida'), 'error');
    }
  };

  useEffect(() => {
    if (hasMounted && error) {
      showNotification(t('torrentDetail.actions.loadError','No se pudo cargar el torrent'), 'error');
    }
  }, [error, hasMounted, t]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      {hasMounted && error ? (
        <div className="mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4">{t('torrentDetail.header.notFound','No encontrado')}</div>
        </div>
      ) : null}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text" suppressHydrationWarning>
          {hasMounted && data ? data.name : ' '}
        </h1>
        <div className="text-sm text-text-secondary mt-1 flex items-center gap-2" suppressHydrationWarning>
          <span>{createdAtFormatted}</span>
          {hasMounted && data && data.isRejected && (
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 text-xs rounded bg-red-500/10 text-red-500 border border-red-500/20">
                {t('torrentDetail.header.rejected','Rechazado')}
              </span>
              {data.rejectionReason && (
                <button
                  onClick={() => setShowRejectionInfoModal(true)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title={t('torrentDetail.header.viewRejectionReason','Ver motivo del rechazo')}
                >
                  <InfoCircle size={14} />
                </button>
              )}
            </div>
          )}
          {hasMounted && data && data.isApproved === false && !data.isRejected && (
            <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              {t('torrentDetail.header.pendingApproval','Pendiente de aprobación')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Poster and description */}
          <div className="bg-surface border border-border rounded p-4">
            {hasMounted && data?.posterUrl && posterVisible && (
              <div className="mb-4 flex justify-center">
                <Image
                  src={data.posterUrl?.startsWith('http') ? data.posterUrl : `${API_BASE_URL}${data.posterUrl}`}
                  alt="Poster"
                  width={800}
                  height={400}
                  unoptimized
                  className="max-h-[400px] max-w-full rounded object-contain"
                  onError={() => setPosterVisible(false)}
                />
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div>
                <div className="text-text-secondary">{t('torrentDetail.fields.size','Tamaño')}</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted ? sizeHuman : ' '}</div>
              </div>
              <div>
                <div className="text-text-secondary">{t('torrentDetail.fields.seeders','Seeders')}</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted && data ? (data.seeders ?? 0) : ' '}</div>
              </div>
              <div>
                <div className="text-text-secondary">{t('torrentDetail.fields.leechers','Leechers')}</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted && data ? (data.leechers ?? 0) : ' '}</div>
              </div>
              <div>
                <div className="text-text-secondary">{t('torrentDetail.fields.completed','Completados')}</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted && data ? (data.completed ?? 0) : ' '}</div>
              </div>
            </div>
            <div className="mb-2 text-sm text-text-secondary" suppressHydrationWarning>
              {hasMounted && data ? `${t('torrentDetail.fields.category','Categoría')}: ${data.category || 'General'}` : ' '}
            </div>
            <div className="text-text whitespace-pre-wrap text-sm" suppressHydrationWarning>
              {hasMounted && data ? (data.description || t('torrentDetail.fields.noDescription','Sin descripción')) : ' '}
            </div>

            {/* Tags */}
            <div className="mt-6">
              <span className="text-text-secondary block text-sm mb-2">{t('torrentDetail.fields.tags','Tags')}</span>
              {hasMounted && (data?.tags?.length || 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data?.tags?.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{tag}</span>
                  ))}
                </div>
              ) : (
                <span className="text-text-secondary text-sm">{t('torrentDetail.fields.noTags','Sin tags')}</span>
              )}
            </div>
          </div>

          {/* Files list */}
          <TorrentFiles files={(data?.files || []) as { path: string; size: number }[]} loading={!hasMounted || isLoading} />

          {/* NFO (if available) */}
          <NfoPanel torrentId={torrentId} />

          {/* Comments */}
          {hasMounted && data && data.isApproved === false ? (
            <div className="bg-surface border border-border rounded p-6 text-sm text-text-secondary">
              {t('torrentDetail.comments.disabled','Los comentarios están desactivados hasta que el torrent sea aprobado.')}
            </div>
          ) : (
            <CommentsSection torrentId={torrentId} />
          )}
        </div>

        {/* Sidebar actions */}
        <div className="space-y-4">
          {hasMounted && data && data.isApproved === false ? (
            <div className="bg-surface rounded-lg border border-border p-6 text-sm text-text-secondary">
              {t('torrentDetail.actions.disabled','Las acciones están desactivadas hasta que el torrent sea aprobado.')}
            </div>
          ) : (
          <ActionsPanel
            torrentId={torrentId}
            isBookmarked={!!data?.bookmarked}
            onBookmark={handleBookmark}
            onDownload={handleDownload}
            userVote={data?.userVote ?? null}
            onVotePersist={async (newVote: 'up' | 'down' | null) => {
              try {
                if (data) await mutate({ ...data, userVote: newVote }, false);
              } catch {}
            }}
          />
          )}

          <UploaderPanel uploader={data?.uploader || null} loading={!hasMounted || isLoading} />
        </div>
      </div>

      {/* Rejection Info Modal */}
      {showRejectionInfoModal && data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">
                {t('torrentDetail.modals.rejectionInfo.title','Información del Rechazo')}
              </h3>
              <button
                onClick={() => setShowRejectionInfoModal(false)}
                className="text-text-secondary hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('torrentDetail.modals.rejectionInfo.reason','Motivo del rechazo:')}
                </label>
                <div className="bg-background border border-border rounded-lg p-3 text-text">
                  {data.rejectionReason || t('torrentDetail.modals.rejectionInfo.noReason','No se especificó motivo')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('torrentDetail.modals.rejectionInfo.rejectedBy','Rechazado por:')}
                </label>
                <div className="text-text">
                  {data.rejectedBy?.username || t('torrentDetail.modals.rejectionInfo.unknown','Desconocido')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('torrentDetail.modals.rejectionInfo.rejectedAt','Fecha de rechazo:')}
                </label>
                <div className="text-text">
                  {data.rejectedAt ? 
                    format(parsePossiblyInvalidDate(data.rejectedAt) || new Date(), 'dd/MM/yyyy HH:mm', { locale: es }) : 
                    t('torrentDetail.modals.rejectionInfo.unknown','Desconocido')
                  }
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowRejectionInfoModal(false)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('torrentDetail.modals.rejectionInfo.close','Cerrar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CommentsPanel has been replaced by CommentsSection for feature parity with NexusTracker v2.

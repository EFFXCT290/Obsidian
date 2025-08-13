'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import Image from 'next/image';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { showNotification } from '@/app/utils/notifications';
import { Like } from '@styled-icons/boxicons-regular/Like';
import { Dislike } from '@styled-icons/boxicons-regular/Dislike';
import { Download } from '@styled-icons/boxicons-regular/Download';
import { Magnet } from '@styled-icons/boxicons-regular/Magnet';
import { Bookmark } from '@styled-icons/boxicons-regular/Bookmark';
import { BookmarkMinus } from '@styled-icons/boxicons-regular/BookmarkMinus';
import { Copy } from '@styled-icons/boxicons-regular/Copy';
import { User } from '@styled-icons/boxicons-regular/User';
import TorrentFiles from './TorrentFiles';
import CommentsSection from './CommentsSection';

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
}

// Legacy comment types removed

// Legacy CommentItem interface removed; replaced by CommentsSection

export default function TorrentDetailContent({ torrentId }: { torrentId: string }) {
  const [, setDownloading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [posterVisible, setPosterVisible] = useState(true);
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
      showNotification('Descarga iniciada', 'success');
    } catch {
      showNotification('No se pudo descargar el torrent', 'error');
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
        if (!res.ok) throw new Error('Error al guardar');
        mutate({ ...(data as TorrentResponse), bookmarked: true }, false);
        showNotification('Marcado como favorito', 'success');
      } else {
        const res = await fetch(`${API_BASE_URL}/bookmarks/${torrentId}`, { method: 'DELETE', headers: baseHeaders });
        if (!res.ok) throw new Error('Error al eliminar');
        mutate({ ...(data as TorrentResponse), bookmarked: false }, false);
        showNotification('Eliminado de favoritos', 'success');
      }
      // Revalidar inmediatamente para persistir estado al recargar
      await mutate();
    } catch {
      showNotification('Operación de favorito fallida', 'error');
    }
  };

  useEffect(() => {
    if (hasMounted && error) {
      showNotification('No se pudo cargar el torrent', 'error');
    }
  }, [error, hasMounted]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      {hasMounted && error ? (
        <div className="mb-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4">No encontrado</div>
        </div>
      ) : null}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text" suppressHydrationWarning>
          {hasMounted && data ? data.name : ' '}
        </h1>
        <div className="text-sm text-text-secondary mt-1 flex items-center gap-2" suppressHydrationWarning>
          <span>{createdAtFormatted}</span>
          {hasMounted && data && data.isApproved === false && (
            <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              Pendiente de aprobación
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
                <div className="text-text-secondary">Tamaño</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted ? sizeHuman : ' '}</div>
              </div>
              <div>
                <div className="text-text-secondary">Seeders</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted && data ? (data.seeders ?? 0) : ' '}</div>
              </div>
              <div>
                <div className="text-text-secondary">Leechers</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted && data ? (data.leechers ?? 0) : ' '}</div>
              </div>
              <div>
                <div className="text-text-secondary">Completados</div>
                <div className="text-text font-medium" suppressHydrationWarning>{hasMounted && data ? (data.completed ?? 0) : ' '}</div>
              </div>
            </div>
            <div className="mb-2 text-sm text-text-secondary" suppressHydrationWarning>
              {hasMounted && data ? `Categoría: ${data.category || 'General'}` : ' '}
            </div>
            <div className="text-text whitespace-pre-wrap text-sm" suppressHydrationWarning>
              {hasMounted && data ? (data.description || 'Sin descripción') : ' '}
            </div>

            {/* Tags */}
            <div className="mt-6">
              <span className="text-text-secondary block text-sm mb-2">Tags</span>
              {hasMounted && (data?.tags?.length || 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data?.tags?.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{tag}</span>
                  ))}
                </div>
              ) : (
                <span className="text-text-secondary text-sm">Sin tags</span>
              )}
            </div>
          </div>

          {/* Files list */}
          <TorrentFiles files={(data?.files || []) as { path: string; size: number }[]} loading={!hasMounted || isLoading} />

          {/* NFO (if available) */}
          <NfoPanel torrentId={torrentId} />

          {/* Comments */}
          <CommentsSection torrentId={torrentId} />
        </div>

        {/* Sidebar actions */}
        <div className="space-y-4">
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

          <UploaderPanel uploader={data?.uploader || null} loading={!hasMounted || isLoading} />
        </div>
      </div>
    </div>
  );
}

function NfoPanel({ torrentId }: { torrentId: string }) {
  const { data, isLoading } = useSWR<string>(
    `${API_BASE_URL}/torrent/${torrentId}/nfo`,
    async (key: string) => {
      const headers: Record<string, string> = {};
      try {
        const token = localStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch {}
      const res = await fetch(key, { headers });
      if (!res.ok) return '';
      const text = await res.text();
      return text;
    }
  );
  if (isLoading || !data) return null;
  return (
    <div className="bg-surface border border-border rounded p-4">
      <div className="text-text font-semibold mb-2">Archivo NFO</div>
      <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-96 overflow-auto">{data}</pre>
    </div>
  );
}

function UploaderPanel({ uploader, loading }: { uploader: { id: string; username: string; avatarUrl?: string | null; uploaded?: string; downloaded?: string; ratio?: number } | null; loading: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const formatBytes = (n?: string) => {
    const v = Number(n || 0);
    if (!v) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let val = v;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(2)} ${units[i]}`;
  };
  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
        <User size={20} className="mr-2" />
        Subido por
      </h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          {loading || !mounted ? (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
          ) : uploader?.avatarUrl ? (
            <Image
              src={uploader.avatarUrl?.startsWith('http') ? uploader.avatarUrl : `${API_BASE_URL}${uploader.avatarUrl}`}
              alt="Avatar"
              width={40}
              height={40}
              unoptimized
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
          )}
          <div>
            {loading || !mounted ? (
              <>
                <div className="w-24 h-4 bg-text-secondary/10 rounded animate-pulse mb-1"></div>
                <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                <p className="text-text font-medium" suppressHydrationWarning>{uploader?.username || 'Anónimo'}</p>
                {uploader?.ratio !== undefined && (
                  <p className="text-text-secondary text-sm" suppressHydrationWarning>Ratio: {Number(uploader.ratio || 0).toFixed(2)}</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Subido</span>
              {loading || !mounted || !uploader ? (
                <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              ) : (
                <span className="text-text" suppressHydrationWarning>{formatBytes(uploader.uploaded)}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Descargado</span>
              {loading || !mounted || !uploader ? (
                <div className="w-16 h-3 bg-text-secondary/10 rounded animate-pulse"></div>
              ) : (
                <span className="text-text" suppressHydrationWarning>{formatBytes(uploader.downloaded)}</span>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

function ActionsPanel({ torrentId, isBookmarked, onBookmark, onDownload, userVote, onVotePersist }: { torrentId: string; isBookmarked: boolean; onBookmark: () => void; onDownload: () => void; userVote: 'up' | 'down' | null; onVotePersist: (v: 'up' | 'down' | null) => void; }) {
  const [generating, setGenerating] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(userVote ?? null);
  const [mounted, setMounted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setVote(userVote ?? null); }, [userVote]);
  const displayBookmarked = mounted ? isBookmarked : false;

  const handleMagnet = async () => {
    try {
      setGenerating(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = localStorage.getItem('authToken'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
      const res = await fetch(`${API_BASE_URL}/torrent/${torrentId}/magnet`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok || !data?.magnetLink) throw new Error('No se pudo generar magnet');
      window.location.href = data.magnetLink;
    } catch {
      showNotification('No se pudo generar el enlace magnet', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const sendVote = async (type: 'up' | 'down') => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = localStorage.getItem('authToken'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
      const res = await fetch(`${API_BASE_URL}/torrent/${torrentId}/vote`, { method: 'POST', headers, body: JSON.stringify({ type }) });
      if (!res.ok) throw new Error('Voting failed');
      const newVote = vote === type ? null : type;
      setVote(newVote);
      onVotePersist(newVote);
      showNotification('Voto registrado', 'success');
    } catch {
      showNotification('No se pudo votar', 'error');
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4">Acciones</h3>
      <div className="space-y-3">
        <div className="flex space-x-2">
          <button
            onClick={onDownload}
            className="flex-1 bg-primary text-background py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Download size={20} />
            <span>Torrent</span>
          </button>
          <button
            onClick={handleMagnet}
            disabled={generating}
            className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            title={generating ? 'Generando…' : 'Magnet'}
          >
            <Magnet size={20} />
            <span>{generating ? 'Generando…' : 'Magnet'}</span>
          </button>
        </div>
        <button
          onClick={onBookmark}
          className="w-full bg-surface-light border border-border text-text py-3 px-4 rounded-lg hover:bg-surface transition-colors flex items-center justify-center space-x-2"
          suppressHydrationWarning
        >
          {displayBookmarked ? (
            <>
              <BookmarkMinus size={20} />
              <span>Quitar de favoritos</span>
            </>
          ) : (
            <>
              <Bookmark size={20} />
              <span>Añadir a favoritos</span>
            </>
          )}
        </button>
        <div className="flex space-x-2">
          {(() => {
            const isUpActive = mounted && vote === 'up';
            const upClass = isUpActive
              ? 'bg-green-500/10 border-green-500/20 text-green-500'
              : 'bg-surface-light border-border text-text hover:bg-surface';
            return (
              <button
                onClick={() => sendVote('up')}
                className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center space-x-1 ${upClass}`}
              >
                <Like size={16} />
                <span>Me gusta</span>
              </button>
            );
          })()}
          {(() => {
            const isDownActive = mounted && vote === 'down';
            const downClass = isDownActive
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-surface-light border-border text-text hover:bg-surface';
            return (
              <button
                onClick={() => sendVote('down')}
                className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center space-x-1 ${downClass}`}
              >
                <Dislike size={16} />
                <span>No me gusta</span>
              </button>
            );
          })()}
        </div>
        <button
          onClick={async () => {
            try {
              setLinkCopied(true);
              if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(window.location.href);
              } else {
                const textArea = document.createElement('textarea');
                textArea.value = window.location.href;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
              }
              showNotification('Enlace copiado', 'success');
            } catch {
              showNotification('No se pudo copiar el enlace', 'error');
            } finally {
              setTimeout(() => setLinkCopied(false), 2000);
            }
          }}
          className={`w-full border py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
            linkCopied ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-surface-light border-border text-text hover:bg-surface'
          }`}
        >
          <Copy size={16} />
          <span>Copiar enlace</span>
        </button>
      </div>
    </div>
  );
}

// CommentsPanel has been replaced by CommentsSection for feature parity with NexusTracker v2.



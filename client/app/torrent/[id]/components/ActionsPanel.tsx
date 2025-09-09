'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { showNotification } from '@/app/utils/notifications';
import { useI18n } from '@/app/hooks/useI18n';
import { Like } from '@styled-icons/boxicons-regular/Like';
import { Dislike } from '@styled-icons/boxicons-regular/Dislike';
import { Download } from '@styled-icons/boxicons-regular/Download';
import { Magnet } from '@styled-icons/boxicons-regular/Magnet';
import { Bookmark } from '@styled-icons/boxicons-regular/Bookmark';
import { BookmarkMinus } from '@styled-icons/boxicons-regular/BookmarkMinus';
import { Copy } from '@styled-icons/boxicons-regular/Copy';

interface Props {
  torrentId: string;
  isBookmarked: boolean;
  onBookmark: () => void;
  onDownload: () => void;
  userVote: 'up' | 'down' | null;
  onVotePersist: (v: 'up' | 'down' | null) => void;
}

export default function ActionsPanel({ torrentId, isBookmarked, onBookmark, onDownload, userVote, onVotePersist }: Props) {
  const { t } = useI18n();
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
      const headers: Record<string, string> = {};
      try { const token = localStorage.getItem('authToken'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
      
      // 1) Create magnet token
      const tokenRes = await fetch(`${API_BASE_URL}/torrent/${torrentId}/magnet-token`, { method: 'POST', headers });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData?.magnetUrl) throw new Error(tokenData?.error || t('torrentDetail.actions.magnetError','No se pudo generar magnet'));
      
      // 2) Get magnet link using the token
      const magnetRes = await fetch(tokenData.magnetUrl, { headers });
      const magnetData = await magnetRes.json();
      if (!magnetRes.ok || !magnetData?.magnetLink) throw new Error(t('torrentDetail.actions.magnetError','No se pudo generar magnet'));
      
      window.location.href = magnetData.magnetLink;
    } catch {
      showNotification(t('torrentDetail.actions.magnetError','No se pudo generar el enlace magnet'), 'error');
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
      showNotification(t('torrentDetail.actions.voteOk','Voto registrado'), 'success');
    } catch {
      showNotification(t('torrentDetail.actions.voteError','No se pudo votar'), 'error');
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4">{t('torrentDetail.actions.title','Acciones')}</h3>
      <div className="space-y-3">
        <div className="flex space-x-2">
          <button
            onClick={onDownload}
            className="flex-1 bg-primary text-background py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Download size={20} />
            <span>{t('torrentDetail.actions.torrent','Torrent')}</span>
          </button>
          <button
            onClick={handleMagnet}
            disabled={generating}
            className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            title={generating ? t('torrentDetail.actions.magnetGenerating','Generando…') : t('torrentDetail.actions.magnet','Magnet')}
          >
            <Magnet size={20} />
            <span>{generating ? t('torrentDetail.actions.magnetGenerating','Generando…') : t('torrentDetail.actions.magnet','Magnet')}</span>
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
              <span>{t('torrentDetail.actions.removeBookmark','Quitar de favoritos')}</span>
            </>
          ) : (
            <>
              <Bookmark size={20} />
              <span>{t('torrentDetail.actions.addBookmark','Añadir a favoritos')}</span>
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
                <span>{t('torrentDetail.actions.like','Me gusta')}</span>
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
                <span>{t('torrentDetail.actions.dislike','No me gusta')}</span>
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
              showNotification(t('torrentDetail.actions.copied','Enlace copiado'), 'success');
            } catch {
              showNotification(t('torrentDetail.actions.copyError','No se pudo copiar el enlace'), 'error');
            } finally {
              setTimeout(() => setLinkCopied(false), 2000);
            }
          }}
          className={`w-full border py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
            linkCopied ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-surface-light border-border text-text hover:bg-surface'
          }`}
        >
          <Copy size={16} />
          <span>{t('torrentDetail.actions.copyLink','Copiar enlace')}</span>
        </button>
      </div>
    </div>
  );
}



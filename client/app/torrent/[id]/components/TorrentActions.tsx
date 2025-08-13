'use client';

import { useState } from 'react';
import { Download } from '@styled-icons/boxicons-regular/Download';
import { Bookmark } from '@styled-icons/boxicons-regular/Bookmark';
import { BookmarkMinus } from '@styled-icons/boxicons-regular/BookmarkMinus';
import { Like } from '@styled-icons/boxicons-regular/Like';
import { Dislike } from '@styled-icons/boxicons-regular/Dislike';
import { Copy } from '@styled-icons/boxicons-regular/Copy';
import { Magnet } from '@styled-icons/boxicons-regular/Magnet';

interface Props {
  onDownload: () => Promise<void> | void;
  onMagnet: () => Promise<void> | void;
  bookmarked: boolean;
  onToggleBookmark: () => Promise<void> | void;
  userVote: 'up' | 'down' | null;
  onVote: (type: 'up' | 'down') => Promise<void> | void;
  onCopyLink: () => Promise<void> | void;
}

export default function TorrentActions({ onDownload, onMagnet, bookmarked, onToggleBookmark, userVote, onVote, onCopyLink }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-text mb-4">Acciones</h3>
      <div className="space-y-3">
        <div className="flex space-x-2">
          <button onClick={async () => { try { setDownloading(true); await onDownload(); } finally { setDownloading(false); } }} disabled={downloading} className="flex-1 bg-primary text-background py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
            <Download size={20} />
            <span>{downloading ? 'Descargando…' : 'Torrent'}</span>
          </button>
          <button onClick={async () => { try { setGenerating(true); await onMagnet(); } finally { setGenerating(false); } }} disabled={generating} className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2" title={generating ? 'Generando…' : 'Magnet'}>
            <Magnet size={20} />
            <span>Magnet</span>
          </button>
        </div>
        <button onClick={() => onToggleBookmark()} className="w-full bg-surface-light border border-border text-text py-3 px-4 rounded-lg hover:bg-surface transition-colors flex items-center justify-center space-x-2">
          {bookmarked ? (<><BookmarkMinus size={20} /><span>Quitar de favoritos</span></>) : (<><Bookmark size={20} /><span>Añadir a favoritos</span></>)}
        </button>
        <div className="flex space-x-2">
          <button onClick={() => onVote('up')} className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center space-x-1 ${userVote === 'up' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-surface-light border-border text-text hover:bg-surface'}`}>
            <Like size={16} />
            <span>Me gusta</span>
          </button>
          <button onClick={() => onVote('down')} className={`flex-1 py-2 px-3 rounded-lg border transition-colors flex items-center justify-center space-x-1 ${userVote === 'down' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-surface-light border-border text-text hover:bg-surface'}`}>
            <Dislike size={16} />
            <span>No me gusta</span>
          </button>
        </div>
        <button onClick={async () => { setLinkCopied(true); await onCopyLink(); setTimeout(() => setLinkCopied(false), 1500); }} className={`w-full border py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${linkCopied ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-surface-light border-border text-text hover:bg-surface'}`}>
          <Copy size={16} />
          <span>Copiar enlace</span>
        </button>
      </div>
    </div>
  );
}



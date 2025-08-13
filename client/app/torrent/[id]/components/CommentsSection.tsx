'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useI18n } from '@/app/hooks/useI18n';
import { showNotification } from '@/app/utils/notifications';
import { Comment as CommentIcon } from '@styled-icons/boxicons-regular/Comment';
import { Send } from '@styled-icons/boxicons-regular/Send';
import { X } from '@styled-icons/boxicons-regular/X';
import { API_BASE_URL } from '@/lib/api';

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  userVote: 'upvote' | 'downvote' | null;
  _count: { upvotes: number; downvotes: number };
  replies?: CommentData[];
  parentId?: string | null;
  isOP?: boolean;
}

interface CommentsResponse {
  comments: CommentData[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const MAX_DEPTH = 4;

export default function CommentsSection({ torrentId }: { torrentId: string }) {
  const { t } = useI18n();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const tRef = useRef(t);
  tRef.current = t;

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/torrent/${torrentId}/comments?page=${pagination.page}&limit=${pagination.limit}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error loading comments');
      const data: CommentsResponse = await res.json();
      setComments(data.comments || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch {
      showNotification(t('torrentDetail.actions.errorLoading','Error cargando comentarios'), 'error');
    } finally {
      setLoading(false);
    }
  }, [torrentId, pagination.page, pagination.limit, t]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Determine login status from localStorage token
  useEffect(() => {
    try {
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
    } catch { setIsLoggedIn(false); }
  }, []);

  // Modal controls: Escape to close and external event to open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && showModal) setShowModal(false); };
    const handleOpenModal = () => { if (isLoggedIn) setShowModal(true); };
    const openModalListener: EventListener = () => handleOpenModal();
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    window.addEventListener('openCommentModal', openModalListener);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      window.removeEventListener('openCommentModal', openModalListener);
    };
  }, [showModal, isLoggedIn]);

  const formatDate = (iso: string): string => {
    try { return new Date(iso).toLocaleString('es-ES'); } catch { return iso; }
  };

  // Close modal helper is inlined where used to avoid unused warnings

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) { showNotification(t('torrentDetail.comments.empty','Mensaje vacío'), 'error'); return; }
    try {
      setSubmitting(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = localStorage.getItem('authToken'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
      const res = await fetch(`${API_BASE_URL}/torrent/${torrentId}/comments`, { method: 'POST', headers, body: JSON.stringify({ content: newComment.trim() }) });
      if (!res.ok) throw new Error('Error creating comment');
      await fetchComments();
      setNewComment('');
      setShowModal(false);
      showNotification(t('torrentDetail.comments.created','Comentario agregado'), 'success');
    } catch {
      showNotification(t('torrentDetail.comments.createError','No se pudo crear el comentario'), 'error');
    } finally { setSubmitting(false); }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) { showNotification(t('torrentDetail.comments.empty','Mensaje vacío'), 'error'); return; }
    try {
      setSubmitting(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = localStorage.getItem('authToken'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
      const res = await fetch(`${API_BASE_URL}/torrent/${torrentId}/comments`, { method: 'POST', headers, body: JSON.stringify({ content: replyContent.trim(), parentId }) });
      if (!res.ok) throw new Error('Error creating reply');
      await fetchComments();
      setReplyingTo(null);
      setReplyContent('');
      showNotification(t('torrentDetail.comments.replied','Respuesta publicada'), 'success');
    } catch {
      showNotification(t('torrentDetail.comments.replyError','No se pudo responder'), 'error');
    } finally { setSubmitting(false); }
  };

  const handleVote = async (commentId: string, type: 'upvote' | 'downvote') => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = localStorage.getItem('authToken'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch {}
      const value = type === 'upvote' ? 1 : -1;
      const res = await fetch(`${API_BASE_URL}/comments/${commentId}/vote`, { method: 'POST', headers, body: JSON.stringify({ value }) });
      if (!res.ok) throw new Error('Error voting');
      await fetchComments();
    } catch {
      showNotification(t('torrentDetail.actions.voteError','Error al votar'), 'error');
    }
  };

  const calculateScore = (up: number, down: number) => up - down;

  const UserAvatar = ({ avatarUrl, username }: { avatarUrl?: string | null; username: string }) => {
    const [failed, setFailed] = useState(false);
    const initial = (username || '?').charAt(0).toUpperCase();
    const src = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`) : null;
    if (!src || failed) {
      return (
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-background font-medium text-xs">
          {initial}
        </div>
      );
    }
    return (
      <div className="relative w-6 h-6 rounded-full overflow-hidden">
        <Image
          src={src}
          alt={`${username} avatar`}
          fill
          unoptimized
          className="object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  };

  const renderComment = (comment: CommentData, depth = 0) => {
    const isReplying = replyingTo === comment.id;
    const canReply = depth < MAX_DEPTH - 1;
    const score = calculateScore(comment._count?.upvotes || 0, comment._count?.downvotes || 0);
    return (
      <div key={comment.id} className="mb-4">
        <div className="flex">
          {depth > 0 && (
            <div className="flex flex-col items-center mr-3 min-w-[24px]">
              <div className="w-px bg-border h-full min-h-[60px]" style={{ marginLeft: `${(depth - 1) * 8}px` }}></div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <UserAvatar avatarUrl={comment.user?.avatarUrl || null} username={comment.user?.username || 'Usuario'} />
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-text">{comment.user?.username || 'Usuario'}</span>
                {comment.isOP && (
                  <span className="px-2 py-1 text-xs bg-green/10 text-green rounded font-medium border border-green/20">OP</span>
                )}
                <span className="text-xs text-text-secondary">{formatDate(comment.createdAt)}</span>
              </div>
            </div>
            <div className="text-sm text-text leading-relaxed whitespace-pre-wrap mb-3">{comment.content}</div>
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-1">
                <button type="button" onClick={() => handleVote(comment.id, 'upvote')} className={`p-1.5 rounded hover:bg-surface transition-colors ${comment.userVote === 'upvote' ? 'text-green' : 'text-text-secondary'}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
                <span className={`text-sm font-medium min-w-[20px] text-center ${score > 0 ? 'text-green' : score < 0 ? 'text-error' : 'text-text-secondary'}`}>{score}</span>
                <button type="button" onClick={() => handleVote(comment.id, 'downvote')} className={`p-1.5 rounded hover:bg-surface transition-colors ${comment.userVote === 'downvote' ? 'text-error' : 'text-text-secondary'}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
              </div>
              {canReply && isLoggedIn && (
                <button type="button" onClick={() => setReplyingTo(isReplying ? null : comment.id)} className="text-xs text-text-secondary hover:text-text hover:bg-surface px-2 py-1 rounded transition-colors flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <span>{t('torrentDetail.comments.reply','Responder')}</span>
                </button>
              )}
            </div>
            {isReplying && (
              <div className="mb-3">
                <form onSubmit={e => { e.preventDefault(); handleSubmitReply(comment.id); }}>
                  <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder={t('torrentDetail.comments.placeholder','Escribe tu respuesta...')} className="w-full p-3 border border-border rounded-md text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent mb-2 bg-background text-text" rows={3} />
                  <div className="flex space-x-2">
                    <button type="submit" className="px-3 py-1.5 bg-primary text-background text-sm rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors" disabled={submitting || !replyContent.trim()}>{t('torrentDetail.comments.send','Enviar')}</button>
                    <button type="button" className="px-3 py-1.5 border border-border text-text text-sm rounded-md hover:bg-surface transition-colors" onClick={() => { setReplyingTo(null); setReplyContent(''); }}>{t('torrentDetail.comments.cancel','Cancelar')}</button>
                  </div>
                </form>
              </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">{comment.replies.map(r => renderComment(r, depth + 1))}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text flex items-center">
          <CommentIcon size={20} className="mr-2" />
          {t('torrentDetail.fields.commentsTitle','Comentarios')}
        </h2>
        <button
          onClick={() => (isLoggedIn ? setShowModal(true) : showNotification(t('torrentDetail.comments.loginRequired','Inicia sesión para comentar'), 'error'))}
          className="px-3 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          disabled={!isLoggedIn}
        >
          {t('torrentDetail.comments.addComment','Añadir comentario')}
        </button>
      </div>

      {loading ? (
    <div className="space-y-4">
          <div className="mb-4"><div className="flex"><div className="flex-1 min-w-0"><div className="flex items-center space-x-2 mb-2"><div className="w-6 h-6 bg-text-secondary/10 rounded-full animate-pulse"></div><div className="flex items-center space-x-2"><div className="w-20 h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-12 h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-16 h-4 bg-text-secondary/10 rounded animate-pulse"></div></div></div><div className="text-sm leading-relaxed mb-3 space-y-2"><div className="w-full h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-3/4 h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-1/2 h-4 bg-text-secondary/10 rounded animate-pulse"></div></div><div className="flex items-center space-x-4 mb-3"><div className="flex items-center space-x-1"><div className="w-6 h-6 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-8 h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-6 h-6 bg-text-secondary/10 rounded animate-pulse"></div></div><div className="w-16 h-4 bg-text-secondary/10 rounded animate-pulse"></div></div></div></div></div>
          <div className="mb-4"><div className="flex"><div className="flex flex-col items-center mr-3 min-w-[24px]"><div className="w-px bg-border h-full min-h-[60px]"></div></div><div className="flex-1 min-w-0"><div className="flex items-center space-x-2 mb-2"><div className="w-6 h-6 bg-text-secondary/10 rounded-full animate-pulse"></div><div className="flex items-center space-x-2"><div className="w-16 h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-16 h-4 bg-text-secondary/10 rounded animate-pulse"></div></div></div><div className="text-sm leading-relaxed mb-3 space-y-2"><div className="w-full h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-2/3 h-4 bg-text-secondary/10 rounded animate-pulse"></div></div><div className="flex items-center space-x-4 mb-3"><div className="flex items-center space-x-1"><div className="w-6 h-6 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-8 h-4 bg-text-secondary/10 rounded animate-pulse"></div><div className="w-6 h-6 bg-text-secondary/10 rounded animate-pulse"></div></div><div className="w-16 h-4 bg-text-secondary/10 rounded animate-pulse"></div></div></div></div></div>
        </div>
      ) : comments.length === 0 ? (
          <div className="text-center py-8 text-text-secondary"><CommentIcon size={48} className="mx-auto mb-4 opacity-50" /><p>{t('torrentDetail.comments.empty','No hay comentarios')}</p></div>
      ) : (
        <div className="space-y-4">{comments.map(c => renderComment(c, 0))}</div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page === 1} className="px-3 py-2 border border-border text-text rounded hover:bg-surface-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
             <span className="px-3 py-2 text-text-secondary">{t('torrentDetail.comments.page','Página')} {pagination.page} {t('torrentDetail.comments.of','de')} {pagination.totalPages}</span>
            <button onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page === pagination.totalPages} className="px-3 py-2 border border-border text-text rounded hover:bg-surface-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-surface rounded-lg border border-border p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">{t('torrentDetail.comments.newCommentTitle','Nuevo comentario')}</h3>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmitComment}>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('torrentDetail.comments.placeholder','Escribe tu comentario...')} className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors resize-none mb-4" rows={4} maxLength={280} disabled={submitting} autoFocus />
              <div className="flex items-center justify-between mb-4"><span className="text-text-secondary text-sm">{newComment.length}/280</span></div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowModal(false)} disabled={submitting} className="flex-1 px-4 py-2 border border-border text-text rounded-lg hover:bg-surface-light transition-colors disabled:opacity-50">{t('torrentDetail.comments.cancel','Cancelar')}</button>
                <button type="submit" disabled={submitting || !newComment.trim()} className="flex-1 px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"><Send size={16} /><span>{submitting ? t('torrentDetail.comments.sending','Enviando…') : t('torrentDetail.comments.send','Enviar')}</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



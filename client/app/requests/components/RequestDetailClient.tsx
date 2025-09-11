'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowToLeft, User, Calendar, Tag, Message, Plus, Search, Show, X } from '@styled-icons/boxicons-regular';
import { useI18n } from '@/app/hooks/useI18n';
import { API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';

interface Request {
  id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'FILLED' | 'CLOSED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
  filledBy?: {
    id: string;
    username: string;
  };
  filledTorrent?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

interface Torrent {
  id: string;
  name: string;
  size: number;
  freeleech?: boolean;
  uploader: {
    id: string;
    username: string;
  };
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  replies?: Comment[];
  hasMoreReplies?: boolean;
}

interface RequestDetailClientProps {
  requestId: string;
  onBack: () => void;
}

export default function RequestDetailClient({ requestId, onBack }: RequestDetailClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [torrentsLoading, setTorrentsLoading] = useState(false);
  const [showFillModal, setShowFillModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const loadRequest = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error(t('requests.failedToLoadRequest', 'Failed to load request'));
      }
      const data = await response.json();
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error(t('requests.errorLoadingRequest', 'Error loading request'));
    } finally {
      setLoading(false);
    }
  }, [requestId, t]);

  const loadComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/comments`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error(t('requests.failedToLoadComments', 'Failed to load comments'));
      }
      const data = await response.json();
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  }, [requestId, t]);

  const loadTorrents = useCallback(async () => {
    try {
      setTorrentsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      let url = `${API_BASE_URL}/torrent/list?limit=50&sort=newest`;
      if (searchTerm) {
        url += `&q=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error(t('requests.failedToLoadTorrents', 'Failed to load torrents'));
      }
      const data = await response.json();
      setTorrents(data.torrents || []);
    } catch (error) {
      console.error('Error loading torrents:', error);
      toast.error(t('requests.errorLoadingTorrents', 'Error loading torrents'));
    } finally {
      setTorrentsLoading(false);
    }
  }, [searchTerm, t]);

  useEffect(() => {
    loadRequest();
    loadComments();
  }, [loadRequest, loadComments]);

  useEffect(() => {
    if (showFillModal) {
      loadTorrents();
    }
  }, [showFillModal, loadTorrents]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    try {
      setPostingComment(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('requests.mustBeLoggedIn', 'You must be logged in to post comments'));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('requests.failedToPostComment', 'Failed to post comment'));
      }

      toast.success(t('requests.commentPosted', 'Comment posted successfully'));
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error instanceof Error ? error.message : t('requests.errorPostingComment', 'Error posting comment'));
    } finally {
      setPostingComment(false);
    }
  };

  const handleFillRequest = async (torrentId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        toast.error(t('requests.mustBeLoggedIn', 'You must be logged in to fill requests'));
        return;
      }

      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/fill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          torrentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('requests.failedToFillRequest', 'Failed to fill request'));
      }

      const result = await response.json();
      
      // Show success message with notification status
      if (result.notificationSent) {
        toast.success(t('requests.fillRequestSuccess', 'Request filled successfully'));
      } else if (result.notificationError) {
        toast.success(t('requests.fillRequestSuccess', 'Request filled successfully'), {
          duration: 4000,
          icon: '⚠️'
        });
        toast.error(t('requests.notificationError', 'Request filled but notification could not be sent'), {
          duration: 3000
        });
      } else {
        toast.success(t('requests.fillRequestSuccess', 'Request filled successfully'));
      }
      
      setShowFillModal(false);
      loadRequest();
    } catch (error) {
      console.error('Error filling request:', error);
      toast.error(error instanceof Error ? error.message : t('requests.errorFillingRequest', 'Error filling request'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800 border-green-200';
      case 'FILLED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return t('requests.openRequests', 'Open');
      case 'FILLED': return t('requests.filledRequests', 'Filled');
      case 'CLOSED': return t('requests.closedRequests', 'Closed');
      case 'REJECTED': return t('requests.rejectedRequests', 'Rejected');
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = [
      t('requests.fileSizes.bytes', 'Bytes'),
      t('requests.fileSizes.kb', 'KB'),
      t('requests.fileSizes.mb', 'MB'),
      t('requests.fileSizes.gb', 'GB'),
      t('requests.fileSizes.tb', 'TB')
    ];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-background rounded animate-pulse"></div>
          <div className="h-6 bg-background rounded w-32 animate-pulse"></div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-background rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-background rounded w-full mb-2"></div>
          <div className="h-4 bg-background rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <div className="text-text-secondary text-lg mb-2">{t('requests.requestNotFound', 'Request not found')}</div>
        <button
          onClick={onBack}
          className="text-primary hover:text-primary-dark"
        >
          {t('requests.backToList', 'Back to List')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <ArrowToLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-text">{t('requests.requestDetails', 'Request Details')}</h1>
      </div>

      {/* Request Details */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text mb-2">{request.title}</h2>
            {request.description && (
              <p className="text-text-secondary mb-4 whitespace-pre-wrap">{request.description}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
            {getStatusText(request.status)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
          <div className="flex items-center gap-1">
            <User size={16} />
            <span>{request.user.username}</span>
          </div>
          {request.category && (
            <div className="flex items-center gap-1">
              <Tag size={16} />
              <span>{request.category.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{formatDate(request.createdAt)}</span>
          </div>
          {request.filledBy && (
            <div className="flex items-center gap-1 text-green">
              <span>Filled by {request.filledBy.username}</span>
            </div>
          )}
        </div>

        {request.filledTorrent && (
          <div className="mt-4 p-4 bg-green/10 border border-green/20 rounded-lg">
            <h3 className="font-medium text-green mb-2">{t('requests.filledWith', 'Filled with:')}</h3>
            <button
              onClick={() => router.push(`/torrent/${request.filledTorrent!.id}`)}
              className="text-green hover:text-green/80 font-medium transition-colors"
            >
              {request.filledTorrent.name}
            </button>
          </div>
        )}

        {request.status === 'OPEN' && (
          <div className="mt-4">
            <button
              onClick={() => setShowFillModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus size={16} />
              {t('requests.fillRequest', 'Fill Request')}
            </button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Message size={20} />
          {t('requests.comments', 'Comments')}
        </h3>

        {/* Add Comment */}
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('requests.commentPlaceholder', 'Write a comment...')}
            rows={3}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-text-secondary">
              {newComment.length}/1000
            </div>
            <button
              onClick={handlePostComment}
              disabled={!newComment.trim() || postingComment}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {postingComment ? t('requests.postingComment', 'Posting...') : t('requests.postComment', 'Post Comment')}
            </button>
          </div>
        </div>

        {/* Comments List */}
        {commentsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-background rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-background rounded w-24 mb-2"></div>
                    <div className="h-4 bg-background rounded w-full mb-1"></div>
                    <div className="h-4 bg-background rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {t('requests.noComments', 'No comments yet')}
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User size={16} className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text">{comment.user.username}</span>
                    <span className="text-xs text-text-secondary">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-text-secondary whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fill Request Modal */}
      {showFillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text">
                {t('requests.fillWithTorrent', 'Fill with Torrent')}
              </h2>
              <button
                onClick={() => setShowFillModal(false)}
                className="p-2 hover:bg-background rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    placeholder={t('requests.searchTorrents', 'Search torrents...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {torrentsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-background rounded"></div>
                    </div>
                  ))}
                </div>
              ) : torrents.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  {t('requests.noTorrentsFound', 'No torrents found')}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {torrents.map((torrent) => (
                    <div key={torrent.id} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-text">{torrent.name}</h4>
                          {torrent.freeleech && (
                            <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-sm font-medium border border-green-500/20">
                              FL
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span>{formatFileSize(torrent.size)}</span>
                          <span>{torrent.uploader.username}</span>
                          <span>{torrent.category.name}</span>
                          <span>{formatDate(torrent.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/torrent/${torrent.id}`)}
                      className="p-2 text-text-secondary hover:text-text transition-colors"
                      title={t('requests.viewTorrent', 'View Torrent')}
                    >
                      <Show size={16} />
                    </button>
                        <button
                          onClick={() => handleFillRequest(torrent.id)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          {t('requests.fillRequest', 'Fill Request')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

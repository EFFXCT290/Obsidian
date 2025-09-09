'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Show, X, Check, Search, Filter, LeftArrow, Message, XCircle } from '@styled-icons/boxicons-regular';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    username: string;
  };
}

interface RequestDetails extends Request {
  comments?: Comment[];
}

interface RequestClientProps {
  translations: {
    title: string;
    description: string;
    list: string;
    titleField: string;
    descriptionField: string;
    category: string;
    status: string;
    createdBy: string;
    filledBy: string;
    filledTorrent: string;
    createdAt: string;
    updatedAt: string;
    open: string;
    filled: string;
    closed: string;
    rejected: string;
    close: string;
    reject: string;
    view: string;
    reason: string;
    reasonOptional: string;
    closeRequest: string;
    rejectRequest: string;
    viewRequest: string;
    cancel: string;
    confirmClose: string;
    confirmReject: string;
    noRequests: string;
    closedSuccess: string;
    rejectedSuccess: string;
    errorLoading: string;
    errorClosing: string;
    errorRejecting: string;
    filterBy: string;
    allRequests: string;
    openRequests: string;
    filledRequests: string;
    closedRequests: string;
    rejectedRequests: string;
    searchBy: string;
    searchPlaceholder: string;
    requestDetails: string;
    backToList: string;
    requestNotFound: string;
    loadingRequest: string;
    comments: string;
    noComments: string;
    addComment: string;
    commentPlaceholder: string;
    postComment: string;
    commentPosted: string;
    errorPostingComment: string;
  };
}

// Request Item Component
function RequestItem({ 
  item, 
  onView, 
  onClose, 
  onReject,
  translations
}: { 
  item: Request; 
  onView: (request: Request) => void; 
  onClose: (request: Request) => void;
  onReject: (request: Request) => void;
  translations: RequestClientProps['translations'];
}) {
  const handleView = () => {
    onView(item);
  };

  const handleClose = () => {
    onClose(item);
  };

  const handleReject = () => {
    onReject(item);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-600';
      case 'FILLED': return 'bg-blue-100 text-blue-600';
      case 'CLOSED': return 'bg-gray-100 text-gray-600';
      case 'REJECTED': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return translations.open;
      case 'FILLED': return translations.filled;
      case 'CLOSED': return translations.closed;
      case 'REJECTED': return translations.rejected;
      default: return status;
    }
  };

  return (
    <div className="request-item bg-surface rounded-lg border border-border p-4 mb-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-medium text-text truncate">{item.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
              {getStatusText(item.status)}
            </span>
          </div>
          
          {item.description && (
            <div className="text-sm text-text-secondary mb-2 line-clamp-2">
              {item.description}
            </div>
          )}
          
          <div className="text-xs text-text-secondary space-y-1">
            <div>
              <span>{translations.createdBy}: {item.user.username}</span>
              {item.category && (
                <>
                  <span className="mx-2">•</span>
                  <span>{translations.category}: {item.category.name}</span>
                </>
              )}
            </div>
            {item.filledBy && (
              <div>
                <span>{translations.filledBy}: {item.filledBy.username}</span>
                {item.filledTorrent && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{translations.filledTorrent}: {item.filledTorrent.name}</span>
                  </>
                )}
              </div>
            )}
            <div>
              <span>{translations.createdAt}: {formatDate(item.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-4 flex-shrink-0">
          <button
            onClick={handleView}
            className="p-2 rounded transition-colors text-text-secondary hover:text-primary hover:bg-surface-light"
            title={translations.view}
          >
            <Show size={16} />
          </button>
          
          {item.status === 'OPEN' && (
            <>
              <button
                onClick={handleClose}
                className="p-2 rounded transition-colors text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                title={translations.close}
              >
                <X size={16} />
              </button>
              
              <button
                onClick={handleReject}
                className="p-2 rounded transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
                title={translations.reject}
              >
                <XCircle size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestClient({ translations }: RequestClientProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'FILLED' | 'CLOSED' | 'REJECTED'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<Request | null>(null);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      let url = `${API_BASE_URL}/requests`;
      const params = new URLSearchParams();
      
      if (filter !== 'all') params.append('status', filter);
      if (searchTerm) params.append('q', searchTerm);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load requests');
      }
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error(translations.errorLoading);
    } finally {
      setLoading(false);
    }
  }, [translations.errorLoading, filter, searchTerm]);

  const loadRequestDetails = useCallback(async (requestId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load request details');
      }
      const data = await response.json();
      setSelectedRequest(data);
    } catch (error) {
      console.error('Error loading request details:', error);
      toast.error(translations.errorLoading);
    }
  }, [translations.errorLoading]);

  const loadComments = useCallback(async (requestId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/comments`, { headers, cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
      const data = await response.json();
      setSelectedRequest(prev => prev ? { ...prev, comments: data } : null);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleView = async (request: Request) => {
    setSelectedRequest(null);
    setShowDetails(true);
    await loadRequestDetails(request.id);
    await loadComments(request.id);
  };

  const handleClose = (request: Request) => {
    setActionRequest(request);
    setCloseModalOpen(true);
  };

  const handleReject = (request: Request) => {
    setActionRequest(request);
    setRejectModalOpen(true);
  };

  const confirmClose = async () => {
    if (!actionRequest) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/request/${actionRequest.id}/close`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to close request');
      }

      toast.success(translations.closedSuccess);
      setCloseModalOpen(false);
      setActionRequest(null);
      setReason('');
      loadRequests();
    } catch (error) {
      console.error('Error closing request:', error);
      toast.error(translations.errorClosing);
    }
  };

  const confirmReject = async () => {
    if (!actionRequest) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/admin/request/${actionRequest.id}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      toast.success(translations.rejectedSuccess);
      setRejectModalOpen(false);
      setActionRequest(null);
      setReason('');
      loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(translations.errorRejecting);
    }
  };

  const handlePostComment = async () => {
    if (!selectedRequest || !comment.trim()) return;

    try {
      setPostingComment(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE_URL}/requests/${selectedRequest.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: comment }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      toast.success(translations.commentPosted);
      setComment('');
      await loadComments(selectedRequest.id);
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(translations.errorPostingComment);
    } finally {
      setPostingComment(false);
    }
  };

  const handleSearch = () => {
    loadRequests();
  };

  const clearSearch = () => {
    setSearchTerm('');
    loadRequests();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-text-secondary">Loading requests...</div>
      </div>
    );
  }

  if (showDetails && selectedRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDetails(false)}
            className="p-2 rounded transition-colors text-text-secondary hover:text-primary hover:bg-surface-light"
          >
            <LeftArrow size={20} />
          </button>
          <h1 className="text-2xl font-bold text-text">{translations.requestDetails}</h1>
        </div>

        <div className="bg-surface rounded-lg border border-border p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-text mb-2">{selectedRequest.title}</h2>
              <div className="flex items-center space-x-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusText(selectedRequest.status, translations)}
                </span>
                {selectedRequest.category && (
                  <span className="text-sm text-text-secondary">
                    {translations.category}: {selectedRequest.category.name}
                  </span>
                )}
              </div>
            </div>

            {selectedRequest.description && (
              <div>
                <h3 className="font-medium text-text mb-2">{translations.descriptionField}</h3>
                <p className="text-text-secondary whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-text">{translations.createdBy}:</span>
                <span className="ml-2 text-text-secondary">{selectedRequest.user.username}</span>
              </div>
              <div>
                <span className="font-medium text-text">{translations.createdAt}:</span>
                <span className="ml-2 text-text-secondary">
                  {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {selectedRequest.filledBy && (
                <div>
                  <span className="font-medium text-text">{translations.filledBy}:</span>
                  <span className="ml-2 text-text-secondary">{selectedRequest.filledBy.username}</span>
                </div>
              )}
              {selectedRequest.filledTorrent && (
                <div>
                  <span className="font-medium text-text">{translations.filledTorrent}:</span>
                  <span className="ml-2 text-text-secondary">{selectedRequest.filledTorrent.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-surface rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-text mb-4">{translations.comments}</h3>
          
          {/* Add Comment */}
          <div className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={translations.commentPlaceholder}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={handlePostComment}
                disabled={!comment.trim() || postingComment}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {postingComment ? 'Posting...' : translations.postComment}
              </button>
            </div>
          </div>

          {/* Comments List */}
          {selectedRequest.comments && selectedRequest.comments.length > 0 ? (
            <div className="space-y-4">
              {selectedRequest.comments.map((comment: Comment) => (
                <div key={comment.id} className="border-b border-border pb-4 last:border-b-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-text">{comment.user?.username || 'Unknown'}</span>
                    <span className="text-xs text-text-secondary">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-text-secondary whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-center py-4">{translations.noComments}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{translations.title}</h1>
        <p className="text-text-secondary mt-1">{translations.description}</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-text mb-2">
              {translations.filterBy}
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'OPEN' | 'FILLED' | 'CLOSED' | 'REJECTED')}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">{translations.allRequests}</option>
              <option value="OPEN">{translations.openRequests}</option>
              <option value="FILLED">{translations.filledRequests}</option>
              <option value="CLOSED">{translations.closedRequests}</option>
              <option value="REJECTED">{translations.rejectedRequests}</option>
            </select>
          </div>
          
          {/* Search Input */}
          <div className="flex-2">
            <label className="block text-sm font-medium text-text mb-2">
              {translations.searchBy}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={translations.searchPlaceholder}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                <Search size={16} />
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-3 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-text">{translations.list}</h2>
        
        {requests.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {translations.noRequests}
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((item) => (
              <RequestItem
                key={item.id}
                item={item}
                onView={handleView}
                onClose={handleClose}
                onReject={handleReject}
                translations={translations}
              />
            ))}
          </div>
        )}
      </div>

      {/* Close Request Modal */}
      {closeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">{translations.closeRequest}</h3>
            <p className="text-text-secondary mb-4">
              {translations.confirmClose}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                {translations.reasonOptional}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder={translations.reason}
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={confirmClose}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                {translations.close}
              </button>
              <button
                onClick={() => setCloseModalOpen(false)}
                className="px-4 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
              >
                {translations.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">{translations.rejectRequest}</h3>
            <p className="text-text-secondary mb-4">
              {translations.confirmReject}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                {translations.reasonOptional}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder={translations.reason}
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                {translations.reject}
              </button>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-border text-text rounded-md hover:bg-surface-light transition-colors"
              >
                {translations.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN': return 'bg-green-100 text-green-600';
    case 'FILLED': return 'bg-blue-100 text-blue-600';
    case 'CLOSED': return 'bg-gray-100 text-gray-600';
    case 'REJECTED': return 'bg-red-100 text-red-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getStatusText(status: string, translations: { open: string; filled: string; closed: string; rejected: string }) {
  switch (status) {
    case 'OPEN': return translations.open;
    case 'FILLED': return translations.filled;
    case 'CLOSED': return translations.closed;
    case 'REJECTED': return translations.rejected;
    default: return status;
  }
}

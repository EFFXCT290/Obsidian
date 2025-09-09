'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Show, User, Calendar, Tag } from '@styled-icons/boxicons-regular';
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

interface RequestListClientProps {
  onCreateRequest: () => void;
  onViewRequest: (request: Request) => void;
}

export default function RequestListClient({ onCreateRequest, onViewRequest }: RequestListClientProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'OPEN' | 'FILLED' | 'CLOSED' | 'REJECTED'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        throw new Error(t('requests.failedToLoadRequests', 'Failed to load requests'));
      }
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error(t('requests.errorLoadingRequests', 'Error loading requests'));
    } finally {
      setLoading(false);
    }
  }, [t, filter, searchTerm]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-background rounded w-3/4"></div>
                <div className="h-3 bg-background rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-background rounded w-16"></div>
            </div>
            <div className="h-3 bg-background rounded w-full mb-2"></div>
            <div className="h-3 bg-background rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={onCreateRequest}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={20} />
          {t('requests.createRequest', 'Create Request')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder={t('requests.searchPlaceholder', 'Search requests...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-text-secondary" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'OPEN' | 'FILLED' | 'CLOSED' | 'REJECTED')}
            className="px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">{t('requests.allRequests', 'All Requests')}</option>
            <option value="OPEN">{t('requests.openRequests', 'Open Requests')}</option>
            <option value="FILLED">{t('requests.filledRequests', 'Filled Requests')}</option>
            <option value="CLOSED">{t('requests.closedRequests', 'Closed Requests')}</option>
            <option value="REJECTED">{t('requests.rejectedRequests', 'Rejected Requests')}</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-text-secondary text-lg mb-2">{t('requests.noRequests', 'No requests found')}</div>
          <p className="text-text-secondary text-sm">
            {filter === 'all' 
              ? t('requests.noRequests', 'No requests found')
              : t('requests.noRequestsForFilter', 'No requests found for this filter')
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-surface border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text mb-2">{request.title}</h3>
                  {request.description && (
                    <p className="text-text-secondary text-sm line-clamp-2 mb-3">{request.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
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
                  <div className="flex items-center gap-1 text-green-600">
                    <span>Filled by {request.filledBy.username}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {request.filledTorrent && (
                    <button
                      onClick={() => router.push(`/torrent/${request.filledTorrent!.id}`)}
                      className="text-primary hover:text-primary-dark text-sm font-medium"
                    >
                      View Torrent
                    </button>
                  )}
                </div>
                <button
                  onClick={() => onViewRequest(request)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Show size={16} />
                  {t('requests.viewRequest', 'View Request')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

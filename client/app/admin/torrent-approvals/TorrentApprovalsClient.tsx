'use client';

import { useState, useEffect, useCallback } from 'react';
import { showNotification } from '@/app/utils/notifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Show, Check, X, Search, Filter, InfoCircle } from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';
import { useI18n } from '@/app/hooks/useI18n';

interface Torrent {
  id: string;
  name: string;
  description: string | null;
  size: string;
  createdAt: string;
  isApproved: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: {
    id: string;
    username: string;
  };
  uploader: {
    id: string;
    username: string;
    role: string;
  };
  category: {
    id: string;
    name: string;
  };
  seeders: number;
  leechers: number;
  completed: number;
}

interface TorrentStats {
  total: number;
  approved: number;
  pending: number;
}

export default function TorrentApprovalsClient() {
  const { t } = useI18n();
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [stats, setStats] = useState<TorrentStats>({ total: 0, approved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingTorrent, setProcessingTorrent] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectionInfoModal, setShowRejectionInfoModal] = useState<string | null>(null);

  // Fetch torrents
  const fetchTorrents = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`${API_BASE_URL}/admin/torrents?${params}`, { headers, cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch torrents');
      
      const data = await response.json();
      setTorrents(data.torrents);
      setTotalPages(Math.ceil(data.total / 20));
    } catch (error) {
      console.error('Error fetching torrents:', error);
      // Only show notification if we're in the browser
      if (typeof window !== 'undefined') {
        showNotification(t('admin.torrentApprovals.notifications.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, t]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/admin/torrents/stats`, { headers, cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchTorrents();
  }, [fetchTorrents]);

  // Approve torrent
  const approveTorrent = useCallback(async (torrentId: string) => {
    try {
      setProcessingTorrent(torrentId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/admin/torrent/${torrentId}/approve`, {
        method: 'POST',
        headers
      });

      if (!response.ok) throw new Error('Failed to approve torrent');

      if (typeof window !== 'undefined') {
        showNotification(t('admin.torrentApprovals.notifications.approved'), 'success');
      }
      fetchTorrents();
      fetchStats();
    } catch (error) {
      console.error('Error approving torrent:', error);
      if (typeof window !== 'undefined') {
        showNotification(t('admin.torrentApprovals.notifications.error'), 'error');
      }
    } finally {
      setProcessingTorrent(null);
    }
  }, [fetchTorrents, fetchStats, t]);

  // Reject torrent
  const rejectTorrent = useCallback(async (torrentId: string, reason: string) => {
    try {
      setProcessingTorrent(torrentId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/admin/torrent/${torrentId}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error('Failed to reject torrent');

      if (typeof window !== 'undefined') {
        showNotification(t('admin.torrentApprovals.notifications.rejected'), 'success');
      }
      setShowRejectModal(null);
      setRejectReason('');
      fetchTorrents();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting torrent:', error);
      if (typeof window !== 'undefined') {
        showNotification(t('admin.torrentApprovals.notifications.error'), 'error');
      }
    } finally {
      setProcessingTorrent(null);
    }
  }, [fetchTorrents, fetchStats, t]);

  // Format file size
  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-text">{stats.total}</div>
          <div className="text-text-secondary text-sm">{t('admin.torrentApprovals.stats.total')}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
          <div className="text-text-secondary text-sm">{t('admin.torrentApprovals.stats.approved')}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
          <div className="text-text-secondary text-sm">{t('admin.torrentApprovals.stats.pending')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.torrentApprovals.filters.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-text-secondary w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved' | 'pending' | 'rejected')}
              className="px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('admin.torrentApprovals.filters.all')}</option>
              <option value="approved">{t('admin.torrentApprovals.filters.approved')}</option>
              <option value="pending">{t('admin.torrentApprovals.filters.pending')}</option>
              <option value="rejected">{t('admin.torrentApprovals.filters.rejected')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Torrents Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-text-secondary mt-2">Loading...</p>
          </div>
        ) : torrents.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-text mb-2">
              {t('admin.torrentApprovals.empty.title')}
            </h3>
            <p className="text-text-secondary">
              {t('admin.torrentApprovals.empty.description')}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {t('admin.torrentApprovals.table.name')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {t('admin.torrentApprovals.table.uploader')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {t('admin.torrentApprovals.table.category')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {t('admin.torrentApprovals.table.size')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {t('admin.torrentApprovals.table.date')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {t('admin.torrentApprovals.table.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
                      {t('admin.torrentApprovals.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {torrents.map((torrent) => (
                    <tr key={torrent.id} className="hover:bg-background/50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-text">{torrent.name}</div>
                          {torrent.description && (
                            <div className="text-sm text-text-secondary truncate max-w-xs">
                              {torrent.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="text-text">{torrent.uploader.username}</div>
                          <div className="text-text-secondary text-xs">{torrent.uploader.role}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {torrent.category.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {formatFileSize(torrent.size)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text">
                        {formatDate(torrent.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${
                            torrent.isRejected
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : torrent.isApproved 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}>
                            {torrent.isRejected
                              ? t('admin.torrentApprovals.status.rejected')
                              : torrent.isApproved 
                                ? t('admin.torrentApprovals.status.approved')
                                : t('admin.torrentApprovals.status.pending')
                            }
                          </span>
                          {torrent.isRejected && torrent.rejectionReason && (
                            <button
                              onClick={() => setShowRejectionInfoModal(torrent.id)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title={t('admin.torrentApprovals.actions.viewRejectionReason')}
                            >
                              <InfoCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/torrent/${torrent.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-text-secondary hover:text-text transition-colors"
                            title={t('admin.torrentApprovals.actions.view')}
                          >
                            <Show className="w-4 h-4" />
                          </a>
                          
                          {!torrent.isApproved && !torrent.isRejected && (
                            <>
                              <button
                                onClick={() => approveTorrent(torrent.id)}
                                disabled={processingTorrent === torrent.id}
                                className="p-1 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                                title={t('admin.torrentApprovals.actions.approve')}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => setShowRejectModal(torrent.id)}
                                disabled={processingTorrent === torrent.id}
                                className="p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                                title={t('admin.torrentApprovals.actions.reject')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-text-secondary">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-background border border-border rounded hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-background border border-border rounded hover:bg-background/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rejection Info Modal */}
      {showRejectionInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">
                {t('admin.torrentApprovals.modals.rejectionInfo.title')}
              </h3>
              <button
                onClick={() => setShowRejectionInfoModal(null)}
                className="text-text-secondary hover:text-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('admin.torrentApprovals.modals.rejectionInfo.reason')}
                </label>
                <div className="bg-background border border-border rounded-lg p-3 text-text">
                  {torrents.find(t => t.id === showRejectionInfoModal)?.rejectionReason || t('admin.torrentApprovals.modals.rejectionInfo.noReason')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('admin.torrentApprovals.modals.rejectionInfo.rejectedBy')}
                </label>
                <div className="text-text">
                  {torrents.find(t => t.id === showRejectionInfoModal)?.rejectedBy?.username || t('admin.torrentApprovals.modals.rejectionInfo.unknown')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('admin.torrentApprovals.modals.rejectionInfo.rejectedAt')}
                </label>
                <div className="text-text">
                  {torrents.find(t => t.id === showRejectionInfoModal)?.rejectedAt ? 
                    formatDate(torrents.find(t => t.id === showRejectionInfoModal)!.rejectedAt!) : 
                    t('admin.torrentApprovals.modals.rejectionInfo.unknown')
                  }
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowRejectionInfoModal(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('admin.torrentApprovals.modals.rejectionInfo.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-text mb-4">
              {t('admin.torrentApprovals.modals.reject.title')}
            </h3>
            <p className="text-text-secondary mb-4">
              {t('admin.torrentApprovals.modals.reject.message')}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                {t('admin.torrentApprovals.modals.reject.reason')}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Optional reason for rejection..."
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm bg-background border border-border rounded-lg hover:bg-background/80 transition-colors"
              >
                {t('admin.torrentApprovals.modals.reject.cancel')}
              </button>
              <button
                onClick={() => rejectTorrent(showRejectModal, rejectReason)}
                disabled={processingTorrent === showRejectModal}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processingTorrent === showRejectModal 
                  ? t('admin.torrentApprovals.actions.rejecting')
                  : t('admin.torrentApprovals.modals.reject.confirm')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

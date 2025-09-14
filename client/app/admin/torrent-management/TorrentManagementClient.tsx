'use client';

import { useState, useEffect, useCallback } from 'react';
import { showNotification } from '@/app/utils/notifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash, Search } from '@styled-icons/boxicons-regular';
import { API_BASE_URL } from '@/lib/api';
import { useI18n } from '@/app/hooks/useI18n';

interface Torrent {
  id: string;
  name: string;
  description: string | null;
  size: string;
  createdAt: string;
  updatedAt: string;
  isApproved: boolean;
  freeleech?: boolean;
  isVip?: boolean;
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
  infoHash: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function TorrentManagementClient() {
  const { t } = useI18n();
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingTorrent, setEditingTorrent] = useState<string | null>(null);
  const [deletingTorrent, setDeletingTorrent] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    isVip: false
  });

  // Fetch approved torrents
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
        ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
        status: 'approved' // Only get approved torrents
      });

      const response = await fetch(`${API_BASE_URL}/torrent/list?${params}`, { headers, cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch torrents');
      
      const data = await response.json();
      setTorrents(data.torrents || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching torrents:', error);
      if (typeof window !== 'undefined') {
        showNotification(t('admin.torrentManagement.notifications.error'), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, categoryFilter, t]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/admin/category`, { headers, cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Handle edit torrent
  const handleEditTorrent = async (torrentId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/admin/torrent/${torrentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update torrent');
      }

      showNotification(t('admin.torrentManagement.notifications.updated'), 'success');
      setEditingTorrent(null);
      setEditForm({ name: '', description: '', categoryId: '', isVip: false });
      fetchTorrents();
    } catch (error) {
      console.error('Error updating torrent:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to update torrent', 'error');
    }
  };

  // Handle delete torrent
  const handleDeleteTorrent = async (torrentId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {}; // No Content-Type for DELETE without body
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = `${API_BASE_URL}/admin/torrent/${torrentId}`;
      console.log('[handleDeleteTorrent] Making request to:', url);
      console.log('[handleDeleteTorrent] Headers:', headers);
      console.log('[handleDeleteTorrent] Token exists:', !!token);

      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete torrent');
      }

      const data = await response.json();
      
      // Show success notification
      if (data.notificationSent) {
        showNotification(t('admin.torrentManagement.notifications.deleted'), 'success');
      } else {
        // Show success with warning about notification
        showNotification(
          t('admin.torrentManagement.notifications.deletedNoEmail'), 
          'error'
        );
      }
      
      setDeletingTorrent(null);
      fetchTorrents();
    } catch (error) {
      console.error('Error deleting torrent:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to delete torrent', 'error');
    }
  };

  // Start editing a torrent
  const startEdit = (torrent: Torrent) => {
    setEditForm({
      name: torrent.name,
      description: torrent.description || '',
      categoryId: torrent.category.id,
      isVip: torrent.isVip || false
    });
    setEditingTorrent(torrent.id);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTorrent(null);
    setEditForm({ name: '', description: '', categoryId: '', isVip: false });
  };

  // Format file size
  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    fetchTorrents();
  }, [fetchTorrents]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loading && torrents.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
            <div className="h-4 w-3/4 bg-text-secondary/10 rounded mb-2" />
            <div className="h-3 w-1/2 bg-text-secondary/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder={t('admin.torrentManagement.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t('admin.torrentManagement.filters.allCategories')}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-text-secondary hover:text-text transition-colors"
          >
            {t('admin.torrentManagement.filters.clear')}
          </button>
        </div>
      </div>

      {/* Torrents List */}
      <div className="space-y-4">
        {torrents.map((torrent) => (
          <div key={torrent.id} className="bg-surface border border-border rounded-lg p-4">
            {editingTorrent === torrent.id ? (
              // Edit Form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    {t('admin.torrentManagement.edit.name')}
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    {t('admin.torrentManagement.edit.description')}
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    {t('admin.torrentManagement.edit.category')}
                  </label>
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isVip}
                      onChange={(e) => setEditForm({ ...editForm, isVip: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-text">
                      {t('admin.torrentManagement.vip.title')}
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTorrent(torrent.id)}
                    className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {t('admin.torrentManagement.edit.save')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-text-secondary/10 text-text-secondary rounded-lg hover:bg-text-secondary/20 transition-colors"
                  >
                    {t('admin.torrentManagement.edit.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              // Torrent Display
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-text">{torrent.name}</h3>
                      {torrent.freeleech && (
                        <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-sm font-medium border border-green-500/20">
                          FL
                        </span>
                      )}
                      {torrent.isVip && (
                        <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-sm font-medium border border-yellow-500/20">
                          VIP
                        </span>
                      )}
                    </div>
                    {torrent.description && (
                      <p className="text-text-secondary text-sm mb-2">{torrent.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                      <span>{t('admin.torrentManagement.info.size')}: {formatFileSize(torrent.size)}</span>
                      <span>{t('admin.torrentManagement.info.category')}: {torrent.category.name}</span>
                      <span>{t('admin.torrentManagement.info.uploader')}: {torrent.uploader.username}</span>
                      <span>{t('admin.torrentManagement.info.created')}: {format(new Date(torrent.createdAt), 'PP', { locale: es })}</span>
                      {torrent.updatedAt !== torrent.createdAt && (
                        <span>{t('admin.torrentManagement.info.updated')}: {format(new Date(torrent.updatedAt), 'PP', { locale: es })}</span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-green-500">↑ {torrent.seeders}</span>
                      <span className="text-red-500">↓ {torrent.leechers}</span>
                      <span className="text-blue-500">✓ {torrent.completed}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(torrent)}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      title={t('admin.torrentManagement.actions.edit')}
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => setDeletingTorrent(torrent.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title={t('admin.torrentManagement.actions.delete')}
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-border rounded-lg bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-light transition-colors"
            >
              {t('admin.torrentManagement.pagination.previous')}
            </button>
                          <span className="px-3 py-2 text-text">
                {`Page ${currentPage} of ${totalPages}`}
              </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-border rounded-lg bg-surface text-text disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-light transition-colors"
            >
              {t('admin.torrentManagement.pagination.next')}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTorrent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-text mb-4">
              {t('admin.torrentManagement.delete.confirmTitle')}
            </h3>
            <p className="text-text-secondary mb-6">
              {t('admin.torrentManagement.delete.confirmMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteTorrent(deletingTorrent)}
                className="flex-1 px-4 py-2 bg-red-500 text-background rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('admin.torrentManagement.delete.confirm')}
              </button>
              <button
                onClick={() => setDeletingTorrent(null)}
                className="flex-1 px-4 py-2 bg-text-secondary/10 text-text-secondary rounded-lg hover:bg-text-secondary/20 transition-colors"
              >
                {t('admin.torrentManagement.delete.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && torrents.length === 0 && (
        <div className="text-center text-text-secondary py-12">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium mb-2">
            {t('admin.torrentManagement.noResults.title')}
          </h3>
          <p className="text-sm">
            {t('admin.torrentManagement.noResults.description')}
          </p>
        </div>
      )}
    </div>
  );
}
